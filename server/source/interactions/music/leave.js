const Interaction = require('../../handlers/Interaction.js');

class Leave extends Interaction {
   constructor(client) {
      super(client, {
         name: 'leave',
         description: 'Leave to a voice channel!',
      });
   }

   async execute({ client, context }) {
      try {
         if (client.errors.verify(context, { errors: ['botNotInVoice', 'botNotInVoice'] })) return;

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

module.exports = Leave;
