const { EventEmitter } = require('events');

const Discord = require('discord.js');

class Queue extends EventEmitter {
   constructor(client, guild) {
      super();
      this.client = client;

      this.player = null;

      this.tracks = new Discord.Collection();
      this.current = null;

      this.playing = false;
      this.initialized = false;

      this.guild = guild;
      this.channel = null;
      this.voice = null;

      this.repeat = 'off';
      this.volume = 0.5;
   }

   socket(destination = this.guild.id, action = 'updatePlayer') {
      return this.client.socket.to(destination).emit(action);
   }

   async connect(voice) {
      try {
         this.voice = voice;
         this.player = await this.client.manager.joinVoiceChannel({
            channelId: this.voice.id,
            guildId: this.guild.id,
            shardId: 0,
         });

         this.player
            .on('start', (data) => {
               this.playing = true;
               this.emit('nowPlaying', this, this.current);
               this.socket();
            })
            .on('closed', (data) => this.disconnect())
            .on('stuck', (data) => {
               console.log('stuck', data);
            })
            .on('end', (data) => {
               this.playing = false;
               this.socket();
               if (data.reason == 'loadFailed') {
                  this.player.move(
                     this.client.nodes[Math.floor(Math.random() * this.client.nodes.length)].name
                  );
                  return this.client.logger.erro('Error to load track');
               }
               if (data.reason != 'finished') return;
               const next = this.next();
               if (next) this.play(next);
               else {
                  this.emit('queueEnd', this);
               }
            });

         this.initialized = true;
         this.socket();
      } catch (err) {
         this.client.logger.erro(err);
      }
   }

   disconnect() {
      if (!this.voice) return;
      this.player = null;

      this.playing = false;
      this.initialized = false;

      this.channel = null;
      this.message = null;
      this.voice = null;

      this.clear();

      this.client.manager.leaveVoiceChannel(this.guild.id);

      this.emit('disconnect');
      this.socket()
      this.removeAllListeners();
   }

   async play(track, metadata) {
      try {
         if (!track?.id || !this.player) return;
         this.new(track);
         track = this.tracks.get(track.id);

         if (metadata?.channel) this.channel = metadata.channel;

         if (!track?.metadata?.info?.identifier) {
            const node = this.client.manager.getIdealNode();

            const result = await node.rest.resolve(`ytmsearch:${track.artist} - ${track.name}`);
            if (!result?.data.length) return;
            const data = result.data.shift();

            track = {
               ...track,
               duration: data.info.length,
               metadata: { ...data },
               requester: metadata?.requester | null,
            };

            this.tracks.set(track.id, track);
         }
         if (track?.metadata?.encoded) {
            this.current = track;
            await this.player.playTrack({ track: { encoded: track?.metadata?.encoded } });
         }
      } catch (erro) {
         console.error(erro);
         throw new Error(erro);
      }
   }

   new(data, options) {
      const track = this.tracks.get(data.id);
      if (track) return;

      data = {
         index: this.tracks.size,
         requester: options?.requester,
         ...data,
      };
      this.tracks.set(data.id, data);

      this.update();

      this.emit('newTrack', this, data);
      this.socket();
      return data;
   }

   next(force = false) {
      if (this.isEnd() && !force && this.repeat == 'off') return null;
      if (this.repeat == 'track' && !force) return this.current;
      if (this.isEnd() && this.repeat == 'queue') {
         if (this.shuffle) this.shuffle(true);
         return this.tracks.at(0);
      }
      let track = this.tracks.at(this.current.index + 1);
      if (track) return track;
      else return null;
   }

   previous(force = false) {
      const start = this.current.index == 1;
      if (start && !force && this.repeat == 'off') return null;
      if (this.repeat == 'track' && !force) return this.current;
      if (start && this.repeat == 'queue') {
         if (this.shuffle) this.shuffle(true);
         return this.tracks.at(this.tracks.size);
      }
      if (this.current.index - 1 >= 0) return this.tracks.at(this.current.index - 1);
      else return null;
   }

   skipTo(index) {
      if (!index) return this.current.index + 1;
      return this.tracks.at(index - 1);
   }

   remove(index) {
      const track = this.tracks.get(index);
      this.tracks.delete(index);
      if (index == this.current.index) this.play(this.next());
      this.update();
      return track;
   }

   clear() {
      this.tracks.clear();
      this.update();
      this.current = { index: 0 };
      this.time = 'no time';
   }

   shuffle() {
      const tracks = this.tracks.map((track) => track);
      this.tracks.clear();

      tracks.sort(() => Math.random() - 0.5);
      tracks.forEach((track) => {
         this.tracks.set(track.id, track);
      });
      this.shuffle = true;
      this.socket();
      return this.tracks;
   }

   order() {
      const tracks = this.tracks.map((track) => track);
      this.tracks.clear();

      tracks.sort((a, b) => a.index - b.index);
      tracks.forEach((track) => {
         this.tracks.set(this.tracks.size + 1, track);
      });
      this.update();
      this.shuffle = false;
      this.socket();
      return this.tracks;
   }

   update() {
      const tracks = this.tracks.map((track) => track);
      this.tracks.clear();
      tracks.forEach((track) => {
         this.tracks.set(track.id, track);
      });
      return this.tracks;
   }

   isEnd() {
      return this.current.index + 1 == this.tracks.size;
   }

   setPosition(time = 0) {
      this.play(this.current);
   }

   getPosition() {
      return 0;
   }

   pause() {
      this.player.setPaused(true);
      this.playing = false;
      this.socket();
   }

   unpause() {
      this.player.setPaused(false);
      this.playing = true;
      this.socket();
   }

   setRepeat(mode) {
      this.repeat = mode;
      this.socket();
   }

   setVolume(volume) {
      this.volume = volume;
      if (this.player.state.resource) this.player.state.resource.volume.setVolume(volume);
      this.socket();
   }
}

module.exports = Queue;
