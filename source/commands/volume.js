const Command = require('../handlers/Command.js');

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

         if (client.errors(interaction, {
               errors: ['userVoice', 'inSameVoice', 'emptyQueue'],
               queue,
            })) return;

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
