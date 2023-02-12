const Command = require('../structures/Command.js');

class Ping extends Command {
   constructor(client) {
      super(client, {
         name: 'ping',
         description: 'Sends Pong!',
      });
   }

   async execute({ client, interaction }) {
      await interaction.reply(
         `**Pong!** 🏓 \nLatency is ${
            Date.now() - interaction.createdTimestamp
         }ms.\nAPI Latency is ${Math.round(client.ws.ping)}ms`
      );
   }
}

module.exports = Ping;
