const Command = require('../source/manegers/Command.js');

class Skip extends Command {
   constructor(client) {
      super(client, {
         name: 'skip',
         description: 'Skip to a next song.',
         exemple: '4',
         usage: '[to]',
      });

      this.addNumberOption((option) =>
         option.setName('to').setDescription('Skip to a queue song.')
      );
   }

   async execute({ client, interaction }) {
      try {
         let input = interaction.options.getNumber('to');
         if (!interaction.member?.voice?.channel)
            return await interaction.reply('You must join a voice channel first.');

         if (
            interaction.guild.members.me?.voice?.channel &&
            interaction.guild.members.me?.voice?.channel?.id !=
               interaction.member?.voice?.channel?.id
         )
            return await interaction.reply('You need to be on the same voice channel as me.');
         if (!client.player.queue.list.size)
            return await interaction.reply('No tracks in the queue.');

         if (client.player.queue.idle()) input = 1;
         if (input) {
            await client.player.play(client.player.queue.skip(input, { state: 'skiping' }));
         } else {
            await client.player.play(client.player.queue.next(), { state: 'skiping' });
         }
         await interaction.reply('Skipped');
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Skip;
