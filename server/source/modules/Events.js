const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');
const fs = require('node:fs');

class Events {
   constructor(client) {
      this.client = client;
      this.items = new Discord.Collection();
   }

   async load() {
      const folders = fs
         .readdirSync('./source/events')
         .filter((file) => fs.statSync(`./source/events/${file}`).isDirectory());
      try {
         this.client.logger.async('Started loading events:');
         let length = 0;

         this.client.PlayerEvents = [];

         const queue = this.client.queue.set.bind(this.client.queue);
         this.client.queue.set = (key, value) => {
            const result = queue(key, value);
            this.client.PlayerEvents.forEach(({ name, handler }) => {
               value.on(name, handler);
            });
            return result;
         };

         folders.forEach((folder) => {
            const files = fs
               .readdirSync(`./source/events/${folder}`)
               .filter((file) => file.endsWith('.js'));
            files.forEach((file) => {
               try {
                  const Event = require(`../events/${folder}/${file}`);
                  const event = new Event();
                  if (folder === 'client') {
                     this.client.on(event.name, (...args) => event.execute(this.client, ...args));
                  } else if (folder === 'player') {
                     // Criar o handler para o evento
                     const handler = (...args) => event.execute(this.client, ...args);

                     // Armazenar o evento para uso futuro
                     this.client.PlayerEvents.push({
                        name: event.name,
                        handler,
                     });

                     // Aplicar o evento a todas as queue existentes
                     this.client.queue.forEach((queue) => {
                        queue.on(event.name, handler);
                     });
                  }
                  length++;
               } catch (error) {
                  this.client.logger.error(`${file} failed: ${error}`);
               }
            });
         });
         this.client.logger.done(`Successfully loaded ${length} events.`);
      } catch (error) {
         this.client.logger.error('Error loading events.', error);
         throw new Error(error);
      }
   }
}

module.exports = Events;
