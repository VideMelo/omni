const Event = require('../../handlers/Event.js');
const Player = require('../../handlers/Player.js');

const Logger = require('../../utils/logger');

class ClientReady extends Event {
   constructor() {
      super({ name: 'ready' });
   }

   async execute(client, interaction) {
      await Player.init(client);
      await client.application.commands.fetch();

      await client.user.setPresence({
         activities: [{ name: 'Music!', type: 2 }],
      });

      Logger.info(`Ready! Logged in as: ${interaction.user.username}`);
   }
}

module.exports = ClientReady;
