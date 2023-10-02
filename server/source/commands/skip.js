const Command = require('../handlers/Command.js');

class Skip extends Command {
   constructor(client) {
      super(client, {
         name: 'skip',
         description: 'Skip to a next track.',
         exemple: '4',
         usage: '[to]',
      });

      this.addIntegerOption((option) => option.setName('to').setDescription('Skip to a track'));
   }

   async execute({ client, interaction }) {
      try {
         const queue = client.player.get(interaction.guild.id);

         if (client.errors(interaction, {
               errors: ['userVoice', 'inSameVoice', 'emptyQueue'],
               queue,
            })) return;

         let index = interaction.options.getInteger('to');
         if (index > queue.list.size)
            return await interaction.replyErro(
               "You can't skip to a track that hasn't been added yet."
            );

         if (queue.current.index == queue.list.size) index = 1;
         if (index) {
            await queue.play(queue.skip(index), { state: 'update', emit: true });
         } else {
            await queue.play(queue.next(true), { state: 'update', emit: true });
         }
         return await interaction.reply('Skipped');
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Skip;
