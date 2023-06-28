const Command = require('../managers/Command.js');

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
         if (!interaction.member?.voice?.channel)
            return await interaction.replyErro('You must join a voice channel first.');

         if (
            interaction.guild.members.me?.voice?.channel &&
            interaction.guild.members.me?.voice?.channel?.id !=
               interaction.member?.voice?.channel?.id
         )
            return await interaction.replyErro('You need to be on the same voice channel as me.');
         if (!queue.list.size) return await interaction.replyErro('No tracks in the queue.');

         let index = interaction.options.getInteger('to');
         if (index > queue.list.size)
            return await interaction.replyErro(
               "You can't skip to a track that hasn't been added yet."
            );

         if (queue.current.index == queue.list.size) index = 1;
         if (index) {
            await queue.play(queue.skip(index), { state: 'update' });
         } else {
            await queue.play(queue.next(), { state: 'update' });
         }
         return await interaction.reply('Skipped');
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Skip;
