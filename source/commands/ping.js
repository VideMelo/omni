const Command = require('../managers/Command.js');

class Ping extends Command {
   constructor(client) {
      super(client, {
         name: 'ping',
         description: 'Sends Pong!',
      });
   }

   async execute({ client, interaction }) {
      console.log(player.player, player.voice, player.queue);
      await interaction.reply(
         `**Pong!** 🏓 \nLatency is ${
            Date.now() - interaction.createdTimestamp
         }ms.\nAPI Latency is ${Math.round(client.ws.ping)}ms`
      );
   }
}

module.exports = Ping;
