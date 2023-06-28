const Command = require('../managers/Command.js');

class Volume extends Command {
   constructor(client) {
      super(client, {
         name: 'volume',
         description: 'Change the volume!',
      });

      this.addIntegerOption((option) =>
         option.setName('volume').setDescription('Volume').setRequired(true)
      );
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

         const volume = interaction.options.getInteger('volume');
         if (volume < 0 || volume > 100)
            return await interaction.replyErro('Volume must be between 0 and 100');

         queue.volume(volume / 100);
         await interaction.reply(`Volume: \`${volume}%\``);
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Volume;
