const Command = require('../handlers/Command.js');

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

         if (client.errors(interaction, { errors: ['botVoice'] })) return;

         queue.disconnect();
         interaction.noReply();
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Leave;
