const Interaction = require('../../handlers/Interaction.js');

class Sort extends Interaction {
   constructor(client) {
      super(client, {
         name: 'sort',
         description: 'Sort the queue!',
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

         queue.order();
         queue.shuffle = false;
         return await context.reply('Queue sorted!');
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

module.exports = Sort;
