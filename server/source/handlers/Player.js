const Discord = require('discord.js');

const { EventEmitter } = require('events');

const Queue = require('./Queue');
const { Search } = require('./Search');

class Player extends EventEmitter {
   constructor(client) {
      super();
      this.handler = new Discord.Collection();

      this.search = new Search(client, this);
   }

   get(id) {
      return this.handler.get(id);
   }

   static async init(client) {
      const guilds = await client.guilds.fetch();
      guilds.forEach((guild) => {
         client.player.handler.set(guild.id, new Queue(client, client.player, guild));
      });
   }

   static async set(client, guild) {
      if (!guild instanceof Discord.Guild) throw new Error('Guild must be a Guild!');
      client.player.handler.set(guild.id, new Queue(client, client.player));
   }
}

module.exports = Player;
