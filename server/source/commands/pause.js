const Command = require('../handlers/Command.js');

class pause extends Command {
   constructor(client) {
      super(client, {
         name: 'pause',
         description: 'Pause current track!',
      });
   }

   async execute({ client, interaction }) {
      try {
         const queue = client.player.get(interaction.guild.id);

         if (client.errors(interaction, {
               errors: ['botVoice', 'userVoice', 'inSameVoice', 'emptyQueue'],
               queue,
            })) return;

         await interaction.noReply();
         queue.pause();
      } catch (error) {
         throw new Error(error); 
      }
   }
}

module.exports = pause;
