const Interaction = require('../../handlers/Interaction.js');

class Volume extends Interaction {
   constructor(client) {
      super(client, {
         name: 'volume',
         description: 'Change the volume!',
      });

      this.addIntegerOption((option) =>
         option.setName('volume').setDescription('Volume').setRequired(true)
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

         const volume = context.options.getInteger('volume');
         if (volume < 0 || volume > 100)
            return await context.replyErro('Volume must be between 0 and 100');

         queue.volume(volume / 100);
         await context.reply(`Volume: \`${volume}%\``);
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

module.exports = Volume;
