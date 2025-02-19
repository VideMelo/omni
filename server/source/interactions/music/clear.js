const Interaction = require('../../handlers/Interaction.js');

class Leave extends Interaction {
   constructor(client) {
      super(client, {
         name: 'clear',
         description: 'Clear the queue!',
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

         queue.clear();
         return await context.reply('Queue cleared!');
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

module.exports = Leave;
