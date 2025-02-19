const Interaction = require('../../handlers/Interaction.js');

class Stop extends Interaction {
   constructor(client) {
      super(client, {
         name: 'stop',
         description: 'Stop to a voice channel!',
      });
   }

   async execute({ client, context }) {
      try {
         if (client.errors.verify(context, { errors: ['botNotInVoice'] })) return;

         const queue = client.queue.get(context.guild.id);
         if (!queue) return;

         client.destroyGuildQueue(context.guild.id)
         context.noReply();
      } catch (error) {
         console.error(error);
         throw new Error(error); 
      }
   }
}

module.exports = Stop;
