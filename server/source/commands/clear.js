const Command = require('../handlers/Command.js');

class Clear extends Command {
   constructor(client) {
      super(client, {
         name: 'clear',
         description: 'Clear the queue!',
      });
   }

   async execute({ client, interaction }) {
      try {
         const queue = client.player.get(interaction.guild.id);

         if (client.errors(interaction, {
               errors: ['botVoice', 'emptyQueue', 'userVoice', 'inSameVoice'],
               queue,
            })) return;

         queue.clear();
         return await interaction.reply('Queue cleared!');
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Clear;
