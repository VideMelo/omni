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

         if (
            client.errors.verify(context, {
               errors: ['userNotInVoice', 'inSameVoice', 'emptyQueue'],
               queue,
            })
         )
            return;

         if (!queue.tracks.size) return await context.replyErro('there is nothing to resume.');
         if (queue.state == 'playing')
            return await context.replyErro('the queue is already playing!');
         if (queue.state != 'paused') return await context.replyErro('the queue is not paused!');

         queue.resume();
         context.noReply();
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

module.exports = Resume;
