const Event = require('../../handlers/Event');

class ClientReady extends Event {
   constructor() {
      super({ name: 'ready' });
   }

   async execute(client, event) {
      await client.application.commands.fetch();

      await client.user.setPresence({
         activities: [{ name: 'Music!', type: 2 }],
      });

      client.logger.info(`Ready! Logged in as: ${event.user.username}`);
   }
}

module.exports = ClientReady;
