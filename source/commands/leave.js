const Command = require('../managers/Command.js');
const Errors = require('../utils/errors.js');

class Leave extends Command {
   constructor(client) {
      super(client, {
         name: 'leave',
         description: 'Leave to a voice channel!',
      });
   }

   async execute({ client, interaction }) {
      try {
         const queue = client.player.get(interaction.guild.id);

         if (Errors(interaction, { errors: ['botVoice'] })) return;

         queue.disconnect();
         interaction.noReply();
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Leave;
