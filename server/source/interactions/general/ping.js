const Interaction = require('../../handlers/Interaction.js');

class Ping extends Interaction {
   constructor(client) {
      super(client, {
         name: 'ping',
         description: 'Sends Pong!',
      });
   }

   async execute({ client, context }) {
      await context.reply(
         `**Pong!** 🏓 \nLatency is ${
            Date.now() - context.createdTimestamp
         }ms.\nAPI Latency is ${Math.round(client.ws.ping)}ms`
      );
   }
}

module.exports = Ping;
