const Interaction = require('../../handlers/Interaction.js');

class Remove extends Interaction {
   constructor(client) {
      super(client, {
         name: 'remove',
         description: 'Remove a track from the queue!',
         exemple: '1',
         usage: '<index>',
      });

      this.addIntegerOption((option) =>
         option.setName('index').setDescription('Index of the track to remove').setRequired(true)
      );
   }

   async execute({ client, context }) {
      try {
         const queue = client.queue.get(context.guild.id);

         const errors = client.errors.verify(context, {
            errors: ['emptyQueue', 'userNotInVoice', 'inSameVoice'],
            queue,
         });
         if (errors) return;

         const index = context.options.getInteger('index');
         if (index > queue.tracks.size)
            return await context.replyErro("You can't remove a track that hasn't been added yet.");

         const track = queue.remove(index);
         if (track) {
            return await context.reply(`Removed \`${track.name}\` from the queue.`);
         }
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

module.exports = Remove;
