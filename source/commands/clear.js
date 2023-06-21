const Command = require('../managers/Command.js');

class Clear extends Command {
   constructor(client) {
      super(client, {
         name: 'clear',
         description: 'Clear the queue!',
      });
   }

   async execute({ client, interaction }) {
      try {
         const player = client.manager.get(interaction.guild.id);
         if (
            !client.voice.adapters.get(interaction.guild.id) ||
            !interaction.guild.members.me?.voice?.channel
         )
            return await interaction.replyErro("I'm not on any voice channels");
         if (!interaction.member?.voice?.channel)
            return await interaction.replyErro('You must join a voice channel first.');

         if (
            interaction.guild.members.me?.voice?.channel &&
            interaction.guild.members.me?.voice?.channel?.id !=
               interaction.member?.voice?.channel?.id
         )
            return await interaction.replyErro('You need to be on the same voice channel as me.');
         if (!player.queue.list.size) return await interaction.replyErro('No tracks in the queue.');

         player.queue.clear();
         return await interaction.reply('Queue cleared!');
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Clear;
