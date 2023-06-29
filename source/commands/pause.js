const Command = require('../managers/Command.js');
const Errors = require('../utils/errors.js');

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

         if (Errors(interaction, {
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
