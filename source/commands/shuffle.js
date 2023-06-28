const Command = require('../managers/Command.js');

class Shuffle extends Command {
   constructor(client) {
      super(client, {
         name: 'shuffle',
         description: 'Shuffle the queue!',
      });
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

         queue.shuffle();
         queue.config.shuffle = true;
         return await interaction.reply('Queue shuffled!');
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Shuffle;
