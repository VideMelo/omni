const Discord = require('discord.js');
const { EventEmitter } = require('events');

class Queue extends EventEmitter {
   constructor(player) {
      super();
      this.current = { index: 0 };
      this.list = new Discord.Collection();

      this.durationMS = 0;
      this.duration = '';

      this.player = player;
   }

   new(body, { member, type = 'track' }) {
      if (type == 'track') {
         body = { index: this.list.size + 1, requester: member, ...body };
         this.list.set(this.list.size + 1, body);
         this.emit('new', this.list.get(body.index), type);
      } else if (type == 'list') {
         body = { ...body, requester: member };
         body.songs.forEach((song) => {
            song = { index: this.list.size + 1, requester: member, ...song };
            this.list.set(this.list.size + 1, song);
         });
         this.emit('new', body, type);
      }

      this.durationMS = this.list.reduce((acc, song) => acc + song.durationMS, 0);
      this.duration = this.MStoHMS(this.durationMS);

      return body;
   }

   next() {
      if (this.idle()) return;
      return this.list.get(this.current.index + 1);
   }

   skip(index) {
      return this.list.get(index);
   }

   idle() {
      return this.current.index == this.list.get(this.list.size).index;
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
