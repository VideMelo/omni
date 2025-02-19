const Interaction = require('../../handlers/Interaction.js');

class Shuffle extends Interaction {
   constructor(client) {
      super(client, {
         name: 'shuffle',
         description: 'Shuffle the queue!',
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

         queue.shuffle();
         queue.shuffle = true;
         return await context.reply('Queue shuffled!');
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

module.exports = Shuffle;
