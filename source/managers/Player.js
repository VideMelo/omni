const Discord = require('discord.js');
const { createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');

const ytdl = require('ytdl-core');

const fluentFfmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

const { Stream } = require('stream');
const { EventEmitter } = require('events');

const Queue = require('./Queue');
const { Search, Result, Track } = require('./Search');

class Player extends EventEmitter {
   constructor(client) {
      super();
      this.manager = createAudioPlayer();

      this.queue = new Queue(client, this);
      this.search = new Search(client, this);

      this.message;

      this.manager.on(AudioPlayerStatus.Idle, () => {
         this.queue.state = 'idle';
         if (this.queue.idle()) {
            this.manager.stop();
            this.queue.list.clear();
            return this.queue.metadata.connection.disconnect();
         }
         this.play(this.queue.next(), { state: 'update' });
      });

      this.manager.on(AudioPlayerStatus.Playing, async () => {
         if (!this.queue.metadata.channel) return;
         const track = this.queue.current;
         const color = await client.embed.color(track.thumbnail);

         const Embed = client.embed.new({
            color: color?.Vibrant?.hex ?? color,
            author: {
               name: 'Now Playing!',
            },
            thumbnail: track?.thumbnail ?? null,
            title: `${track.name.length > 36 ? `${track.name.slice(0, 36)}...` : track.name}`,
            description: `${track.authors.map((author) => author.name).join(', ')}`,
         });

         try {
            const last = this.queue.metadata.message;
            const message = await this.queue.metadata.channel.send({
               embeds: [Embed],
               components: [],
            });
            this.queue.metadata.message = message;
            await last?.delete();
         } catch (error) {
            client.log.erro(error);
         }
      });

      this.queue.on('new', async (body, type) => {
         if (type == 'track') {
            if (this.queue.current.index != 0) {
               const color = await client.embed.color(body.thumbnail);

               const Embed = client.embed.new({
                  color: color?.Vibrant?.hex ?? color,
                  author: {
                     name: 'New track!',
                  },
                  thumbnail: body?.thumbnail ?? null,
                  title: `${body.name.length > 36 ? `${body.name.slice(0, 36)}...` : body.name}`,
                  description: `${body.authors.map((author) => author.name).join(', ')}\n`,
                  fields: [
                     {
                        name: 'Duration',
                        value: body.time,
                        inline: true,
                     },
                     {
                        name: 'Resquester',
                        value: `<@${body.requester.id}>`,
                        inline: true,
                     },
                     {
                        name: 'Index',
                        value: `${body.index}`,
                        inline: true,
                     },
                  ],
               });

               await this.queue.metadata.channel.send({
                  embeds: [Embed],
               });
            }
         } else if (type == 'list') {
            const color = await client.embed.color(body?.thumbnail);

            const Embed = client.embed.new({
               color: color?.Vibrant?.hex ?? color,
               author: {
                  name: 'New Playlist!',
               },
               thumbnail: body?.thumbnail ?? null,
               title: `${body.name.length > 36 ? `${body.name.slice(0, 36)}...` : body.name}`,
               description: `Added **${body.tracks.length}** tracks!`,
            });

            const next = client.button.primary('next', 'Load Next Page', { style: 1 });
            const pages = client.button
               .secondary('pages', `${body.page}/${Math.ceil(body.total / 100)}`)
               .setDisabled(true);
            const row = client.button.row([next, pages]);

            const message = await this.queue.metadata.channel.send({
               embeds: [Embed],
               components: [row],
            });

            const collector = message.createMessageComponentCollector({
               componentType: Discord.ComponentType.Button,
               time: 30000,
            });

            if (body.page >= Math.ceil(body.total / 100)) {
               collector.stop();
               next.setDisabled(true);
               return message.edit({
                  components: [row],
               });
            }

            collector.on('collect', async (collect) => {
               if (!collect.isButton()) return;
               collect.deferUpdate();

               const search = await this.search.list(body.url, { page: body.page + 1 });
               await this.queue.new(search, {
                  member: collect.member,
                  type: 'list',
               });
               collector.stop();
            });

            collector.on('end', async () => {
               next.setDisabled(true);
               return message.edit({
                  components: [row],
               });
            });
         }
      });
   }

   /**
    * Play a track
    * @param {Track|Result|string} track The track to play
    * @param {object} metadata The metadata
    * @param {string} metadata.state The state of the player
    * @param {Discord.GuildMember} metadata.requester The member who requested the track
    * @param {Discord.TextChannel} metadata.channel The channel where the track was requested
    * @param {Discord.Message} metadata.message The message where the track was requested
    * @param {Discord.VoiceChannel} metadata.channel The voice channel where the track was requested
    * @param {Discord.Guild} metadata.guild The guild where the track was requested
    * @example
    * player.play('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
    *   voice: message.member.voice.channel,
    *   requester: message.member,
    *   channel: message.channel,
    *   message: message,
    * });
    */
   async play(track, metadata = {}) {
      try {
         // Check if the track is valid
         if (!track) return;
         if (track instanceof Result) track = track.type == 'search' ? track.tracks[0] : track;
         if (track instanceof Track)
            if (!track?.url) track.set({ url: await this.search.getUrl(track) });
         if (typeof track == 'string') {
            const search = await this.search.track(track);
            track = search.tracks[0];
         }

         let state = metadata?.state || this.queue.state; // set state

         // Add the queue only if the state is different from "update"
         if (state != 'update') {
            this.queue.data({ ...metadata });
            track = this.queue.new(track, {
               requester: metadata?.requester,
               type: track?.type,
            });
         }

         if (state == 'playing') return; // If the state is playing, return

         if (!track?.url) track.set({ url: await this.search.getUrl(track) }); // Set the track url if not defined

         this.queue.current = track; // Set the current track

         // Create a new stream with the track url
         const stream = await ytdl(track.url, {
            highWaterMark: 1 << 25,
            filter: 'audioonly',
            quality: 'highestaudio',
         });

         let seek = metadata?.seek / 1000 || 0; // if seek is not defined, set to 0

         const bufferStream = new Stream.PassThrough(); // buffer the stream

         // Edit the stream
         const reStream = fluentFfmpeg({ source: stream })
            .setFfmpegPath(ffmpegPath)
            .format('opus')
            .seekInput(seek)
            .on('error', (err) => {
               if (err instanceof Error && err?.message?.includes('Premature close')) return;
               console.error(err);
            })
            .stream(bufferStream);

         // Create a new resource with the edited stream
         const resource = createAudioResource(reStream, {
            inlineVolume: true,
         });

         resource.volume.setVolume(this.queue.config.volume); // Set the volume

         this.queue.metadata.connection.subscribe(this.manager); // Subscribe connection to the manager

         this.manager.play(resource); // Play the resource
         this.queue.state = 'playing'; // Set the state to playing
      } catch (erro) {
         throw new Error(erro);
      }
   }

   static async init(client) {
      if (!client.manager instanceof Discord.Collection) throw new Error('Manager must be a Collection!');
      const guilds = await client.guilds.fetch();
      guilds.forEach((guild) => {
         client.manager.set(guild.id, new Player(client));
      });
   }
}

module.exports = Player;
