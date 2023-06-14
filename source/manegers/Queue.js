const Discord = require('discord.js');
const { EventEmitter } = require('events');

class Queue extends EventEmitter {
   constructor(client, player) {
      super();
      this.current = { index: 0 };
      this.list = new Discord.Collection();

      this.player = player;
   }

   set(song) {
      this.list.set(song.index, { ...this.list.get(song.index), ...song })
      this.emit('new', this.list.get(song.index));
      return this.list.get(song.index);
   }

   new(song) {
      this.list.set(this.list.size + 1, song);
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
}

module.exports = Queue;
