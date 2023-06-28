const Event = require('../../managers/Event.js');
const Player = require('../../managers/Player.js');

class ClientReady extends Event {
   constructor() {
      super({ name: 'ready' });
   }

   async execute(client, interaction) {
      await Player.init(client);
      client.application.commands.fetch();
      client.log.info(`Ready! Logged in as: ${interaction.user.username}`);
   }
}

module.exports = ClientReady;
