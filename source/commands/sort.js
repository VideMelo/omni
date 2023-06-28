const Command = require('../managers/Command.js');

class Sort extends Command {
   constructor(client) {
      super(client, {
         name: 'sort',
         description: 'Sort the queue!',
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

         queue.order();
         queue.config.shuffle = false;
         return await interaction.reply('Queue sorted!');
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Sort;