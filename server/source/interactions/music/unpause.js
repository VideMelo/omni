const Interaction = require('../../handlers/Interaction.js');

class Resume extends Interaction {
   constructor(client) {
      super(client, {
         name: 'unpasue',
         description: 'Unpause the current song!',
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

         if (queue.playing)
            return await context.replyErro('The queue is already playing!');

         queue.unpause();
         context.noReply();
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

module.exports = Resume;
