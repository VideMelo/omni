const Command = require('../manegers/Command.js');

class Ping extends Command {
   constructor(client) {
      super(client, {
         name: 'ping',
         description: 'Sends Pong!',
      });
   }

   async execute({ client, interaction }) {
      console.log(client.player.player, client.player.voice, client.player.queue);
      await interaction.reply(
         `**Pong!** 🏓 \nLatency is ${
            Date.now() - interaction.createdTimestamp
         }ms.\nAPI Latency is ${Math.round(client.ws.ping)}ms`
      );
   }
}

module.exports = Ping;
