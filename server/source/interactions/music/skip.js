const Interaction = require('../../handlers/Interaction.js');

class Skip extends Interaction {
   constructor(client) {
      super(client, {
         name: 'skip',
         description: 'Skip to a next track.',
         exemple: '4',
         usage: '[to]',
      });

      this.addIntegerOption((option) => option.setName('to').setDescription('Skip to a track'));
   }

   async execute({ client, context }) {
      try {
         const queue = client.queue.get(context.guild.id);

         const errors = client.errors.verify(context, {
            errors: ['emptyQueue', 'userNotInVoice', 'inSameVoice'],
            queue,
         });
         if (errors) return;

         let index = context.options.getInteger('to');
         if (index > queue.tracks.size)
            return await context.replyErro("You can't skip to a track that hasn't been added yet.");

         if (index) {
            await queue.play(queue.skipTo(index));
         } else {
            await queue.play(queue.next(true));
         }
         return await context.reply('Skipped');
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

module.exports = Skip;
