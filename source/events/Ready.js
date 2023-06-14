const Event = require('../../manegers/Event.js');

class ClientReady extends Event {
   constructor() {
      super({ name: 'ready' });
   }

   async execute(client, interaction) {
      client.application.commands.fetch();
      client.log.info(
         `Ready! Logged in as ${interaction.user.username}`
      );
   }
}

module.exports = ClientReady;
