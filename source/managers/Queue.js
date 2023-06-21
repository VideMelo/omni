const Discord = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const { EventEmitter } = require('events');

class Queue extends EventEmitter {
   constructor(player) {
      super();
      this.player = player;
      this.current = { index: 0 };
      this.list = new Discord.Collection();

      this.config = {
         loop: false,
         shuffle: false,
         repeat: false,
         volume: 1,
      };

      this.state = 'idle';
      this.metadata = {
         voice: null,
         guild: null,
         channel: null,
      };

      this.duration = 0;
      this.time = 'no time';
   }

   connect(voice) {
      const connection = joinVoiceChannel({
         channelId: voice.id,
         guildId: voice.guild.id,
         adapterCreator: voice.guild.voiceAdapterCreator,
      });
      return connection;
   }

   data(metadata) {
      return (this.metadata = {
         ...this.metadata,
         ...metadata,
         voice: this.connect(metadata.voice),
      });
   }

   new(body, { requester, type = 'track' }) {
      let track;
      if (type == 'track') {
         body.set({
            index: this.list.size + 1,
            requester,
         });
         this.list.set(this.list.size + 1, body);
         this.emit('new', this.list.get(body.index), type);
         track = body;
      } else if (type == 'list') {
         body = { ...body, requester };
         body.tracks.forEach((track) => {
            track.set({
               index: this.list.size + 1,
               requester,
            });
            this.list.set(this.list.size + 1, track);
         });
         this.emit('new', body, type);
         track = this.list.find((track) => body.starter == track.id);
      } else if (type == 'search') {
         body.set({
            index: this.list.size + 1,
            requester,
         });
         this.list.set(this.list.size + 1, body);
         this.emit('new', this.list.get(body.index), type);
         track = body;
      }

      this.update();
      return track;
   }

   next() {
      if (this.idle()) return;
      if (this.current.index == this.list.size) {
         if (this.config.loop) {
            if (this.config.shuffle) {
               this.shuffle(true);
               return this.list.get(1);
            } else {
               return this.list.get(1);
            }
         }
      }
      return this.list.get(this.current.index + 1);
   }

   skip(index) {
      return this.list.get(index);
   }

   remove(index) {
      const track = this.list.get(index);
      this.list.delete(index);
      this.update();
      return track;
   }

   clear() {
      this.list.clear();
      this.current.index = 1;
      this.list.set(1, this.current);
      this.tim;
   }

   shuffle(repeat = true) {
      if (repeat) {
         this.list.delete(this.current.index);
         this.current.index = 1;
      }

      const tracks = this.list.map((track) => track);
      this.list.clear();

      if (repeat) this.list.set(1, this.current);

      tracks.sort(() => Math.random() - 0.5);
      tracks.forEach((track) => {
         track.index = this.list.size + 1;
         this.list.set(this.list.size + 1, track);
      });
   }

   order() {
      const tracks = this.list.map((track) => track);
      this.list.clear();

      tracks.sort((a, b) => a.order - b.order);
      tracks.forEach((track) => {
         this.list.set(this.list.size + 1, track);
      });
   }

   update() {
      const tracks = this.list.map((track) => track);
      this.list.clear();
      tracks.forEach((track) => {
         track.index = this.list.size + 1;
         this.list.set(this.list.size + 1, track);
      });
      this.duration = this.list.reduce((acc, track) => acc + track.duration, 0);
      this.time = this.MStoHMS(this.duration);
      return this.list;
   }

   idle() {
      return this.config.loop ? false : this.current.index == this.list.size;
   }

   seek(time = 0) {
      this.player.play(this.current, { state: 'update', seek: time });
   }

   pause() {
      this.player.manager.pause();
      this.state = 'paused';
   }

   unpause() {
      this.player.manager.unpause();
      this.state = 'playing';
   }

   volume(volume) {
      this.player.manager.state.resource.volume.setVolume(volume);
      this.config.volume = volume;
   }

   MStoHMS(ms) {
      const seconds = Math.floor(ms / 1000) % 60;
      const minutes = Math.floor(ms / (1000 * 60)) % 60;
      const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;

      return `${hours ? `${hours}h ` : ''}${minutes}min ${
         !hours && seconds != 0 ? `${seconds}s` : ''
      }`;
   }
}

module.exports = Queue;
