const Command = require('../handlers/Command.js');

class Resume extends Command {
   constructor(client) {
      super(client, {
         name: 'resume',
         description: 'Resume the current song!',
      });
   }

   async execute({ client, interaction }) {
      try {
         const queue = client.player.get(interaction.guild.id);

         if (client.errors(interaction, {
               errors: ['userVoice', 'inSameVoice', 'emptyQueue'],
               queue,
            })) return;

         if (!queue.list.size) return await interaction.replyErro('there is nothing to resume.');
         if (queue.state == 'playing')
            return await interaction.replyErro('the queue is already playing!');
         if (queue.state != 'paused')
            return await interaction.replyErro('the queue is not paused!');

         queue.unpause();
         interaction.noReply();
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Resume;
