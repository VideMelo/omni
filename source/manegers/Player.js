const Discord = require('discord.js');
const {
   createAudioPlayer,
   joinVoiceChannel,
   createAudioResource,
   AudioPlayerStatus,
   VoiceConnectionStatus,
} = require('@discordjs/voice');

const ytdl = require('ytdl-core');

const Queue = require('./Queue');
const Song = require('./Song');
const Search = require('./Search');

class Player {
   constructor(client) {
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
         const color = await client.embed.color(song.thumbnail.url);

         const Embed = client.embed.new({
            color: color.Vibrant.hex,
            author: {
               name: 'Now Playing!',
            },
            thumbnail: song.thumbnail.url,
            title: `${song.name.length > 36 ? `${song.name.slice(0, 36)}...` : song.name}`,
            description: `${song.authors[0].join(', ')}`,
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

      this.queue.on('new', async (song) => {
         if (this.queue.current.index != 0) {
            const color = await client.embed.color(song.thumbnail.url);

            const Embed = client.embed.new({
               color: color.Vibrant.hex,
               author: {
                  name: 'New Song!',
               },
               thumbnail: song.thumbnail.url,
               title: `${song.name.length > 36 ? `${song.name.slice(0, 36)}...` : song.name}`,
               description: `${song.authors[0].join(', ')}\n`,
               fields: [
                  {
                     name: 'Duration',
                     value: song.duration,
                     inline: true,
                  },
                  {
                     name: 'Resquester',
                     value: `<@${song.requester.id}>`,
                     inline: true,
                  },
                  {
                     name: 'Index',
                     value: `${song.index}`,
                     inline: true,
                  },
               ],
            });

            await this.channel.send({
               embeds: [Embed],
            });
         }
      });
   }

   set(guild, voice, interaction) {
      this.voice = this.connect(voice, guild, interaction);
      this.guild = guild;
      this.channel = interaction.channel;
   }

   play(song, { interaction, guild, voice, member, state } = {}) {
      let avaliable = interaction && guild && voice && member;
      if (avaliable) {
         this.set(guild, voice, interaction);
         song = this.queue.set({
            index: this.queue.list.size,
            ...song,
            requester: member,
         });
      }

      state = state || this.state;
      if (state == 'playing') return;
      if (this.queue.list.size) {
         this.queue.current = song;
      }

      let url = song?.url;

      const resource = createAudioResource(
         ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
         }),
         {
            inlineVolume: true,
         }
      );

      resource.volume.setVolume(0.3);

      this.state = 'playing';
      this.player.play(resource);
      this.voice.subscribe(this.player);
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
