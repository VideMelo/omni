const Interaction = require('../../handlers/Interaction.js');

class Loop extends Interaction {
   constructor(client) {
      super(client, {
         name: 'loop',
         description: 'Loop the queue or current track!',
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

         queue.setRepeat(
            queue.repeat == 'off' ? 'queue' : queue.repeat == 'queue' ? 'track' : 'off'
         );

         if (queue.repeat == 'off') {
            await context.reply('Loop disabled!');
         } else if (queue.repeat == 'queue') {
            await context.reply('Loop queue enabled!');
         } else if (queue.repeat == 'track') {
            await context.reply('Loop current track enabled!');
         }
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

module.exports = Loop;
