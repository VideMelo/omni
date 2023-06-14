const Command = require('../manegers/Command.js');

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
         let index = interaction.options.getNumber('to');
         if (!interaction.member?.voice?.channel)
            return await interaction.replyErro('You must join a voice channel first.');

         if (
            interaction.guild.members.me?.voice?.channel &&
            interaction.guild.members.me?.voice?.channel?.id !=
               interaction.member?.voice?.channel?.id
         )
            return await interaction.replyErro('You need to be on the same voice channel as me.');
         if (!client.player.queue.list.size)
            return await interaction.replyErro('No tracks in the queue.');

         if (index > client.player.queue.list.size)
            return await interaction.replyErro(
               "You can't skip to a song that hasn't been added yet."
            );

         if (client.player.queue.current.index == client.player.queue.list.size) index = 1;
         if (index) {
            await client.player.play(client.player.queue.skip(index), { state: 'skiping' });
         } else {
            await client.player.play(client.player.queue.next(), { state: 'skiping' });
         }
         return await interaction.reply('Skipped');
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Skip;
