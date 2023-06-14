const Discord = require('discord.js');
const { EventEmitter } = require('events');
const {
   createAudioPlayer,
   joinVoiceChannel,
   createAudioResource,
   AudioPlayerStatus,
   StreamType,
} = require('@discordjs/voice');

const ytdl = require('ytdl-core-discord');

const Queue = require('./Queue');
const Search = require('./Search');

class Player extends EventEmitter {
   constructor(client) {
      super();
      this.player = createAudioPlayer();

      this.queue = new Queue(client, this);
      this.search = new Search(client, this);

      this.state = 'idle';

      this.voice;
      this.guild;
      this.channel;

      this.message;
      this.member;

      this.player.on('error', (error) => {
         client.log.erro(error.message);
      });

      this.player.on(AudioPlayerStatus.Playing, async () => {
         const song = this.queue.current;
         const color = await client.embed.color(song.thumbnail);

         const Embed = client.embed.new({
            color: color?.Vibrant?.hex ?? color,
            author: {
               name: 'Now Playing!',
            },
            thumbnail: song?.thumbnail ?? null,
            title: `${song.name.length > 36 ? `${song.name.slice(0, 36)}...` : song.name}`,
            description: `${song.authors.map((author) => author.name).join(', ')}`,
         });

         try {
            const last = this.message;
            const message = await this.channel.send({
               embeds: [Embed],
               components: [],
            });
            this.message = message;
            await last?.delete();
         } catch (error) {
            client.log.erro(error);
         }
      });

      this.player.on(AudioPlayerStatus.Idle, () => {
         this.state = 'idle';
         if (this.queue.idle()) {
            this.player.stop();
            this.queue.list.clear();
            return this.voice.disconnect();
         }
         this.play(this.queue.next());
      });

      this.queue.on('new', async (body, type) => {
         if (type == 'track') {
            if (this.queue.current.index != 0) {
               const color = await client.embed.color(body.thumbnail);

               const Embed = client.embed.new({
                  color: color?.Vibrant?.hex ?? color,
                  author: {
                     name: 'New Song!',
                  },
                  thumbnail: body?.thumbnail ?? null,
                  title: `${body.name.length > 36 ? `${body.name.slice(0, 36)}...` : body.name}`,
                  description: `${body.authors.map((author) => author.name).join(', ')}\n`,
                  fields: [
                     {
                        name: 'Duration',
                        value: body.duration,
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

               await this.channel.send({
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
               description: `Added **${body.songs.length}** tracks!`,
            });

            const next = client.button.primary('next', 'Load Next Page', { style: 1 });
            const pages = client.button
               .secondary('pages', `${body.page}/${Math.ceil(body.total / 100)}`)
               .setDisabled(true);
            const row = client.button.row([next, pages]);

            const message = await this.channel.send({
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

   set(guild, voice, interaction) {
      this.voice = this.connect(voice, guild, interaction);
      this.guild = guild;
      this.channel = interaction.channel;
   }

   async play(song, { interaction, guild, voice, member, state } = {}) {
      try {
         if (!song?.url) song.url = await this.search.getUrl(song);
         if (voice) {
            this.set(guild, voice, interaction);
            song = this.queue.new(song, { member });
         }

         state = state || this.state;
         if (state == 'playing') return;

         this.queue.current = song;

         const stream = await ytdl(song.url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
         });

         const resource = createAudioResource(stream, {
            inputType: StreamType.Opus,
            inlineVolume: true,
         });

         resource.volume.setVolume(0.3);

         this.voice.subscribe(this.player);
         this.player.play(resource);
         this.state = 'playing';
      } catch (erro) {
         return console.error(erro);
      }
   }

   pause() {
      this.player.pause();
      this.state = 'paused';
   }

   unpause() {
      this.player.unpause();
      this.state = 'playing';
   }

   connect(voice, guild, interaction) {
      const connection = joinVoiceChannel({
         channelId: voice,
         guildId: guild,
         adapterCreator: interaction.channel.guild.voiceAdapterCreator,
      });
      return connection;
   }
}

module.exports = Player;
