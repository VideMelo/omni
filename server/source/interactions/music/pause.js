const Interaction = require('../../handlers/Interaction.js');

class pause extends Interaction {
   constructor(client) {
      super(client, {
         name: 'pause',
         description: 'Pause current track!',
      });
   }

   async execute({ client, context }) {
      try {
         const queue = client.queue.get(context.guild.id);

         const errors = client.errors.verify(context, {
            errors: ['emptyQueue', 'userNotInVoice', 'inSameVoice'],
            queue,
         });
         if (errors) return;

         await context.noReply();
         queue.pause();
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

module.exports = pause;
