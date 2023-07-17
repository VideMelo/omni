const Command = require('../handlers/Command.js');

class Loop extends Command {
   constructor(client) {
      super(client, {
         name: 'loop',
         description: 'Loop the queue or current track!',
      });
   }

   async execute({ client, interaction }) {
      try {
         const queue = client.player.get(interaction.guild.id);

         if (
            client.errors(interaction, {
               errors: ['userVoice', 'inSameVoice', 'emptyQueue'],
               queue,
            })
         )
            return;

         queue.setRepeat(
            queue.config.repeat == 'off'
               ? 'queue'
               : queue.config.repeat == 'queue'
               ? 'track'
               : 'off'
         );

         if (queue.config.repeat == 'off') {
            await interaction.reply('Loop disabled!');
         } else if (queue.config.repeat == 'queue') {
            await interaction.reply('Loop queue enabled!');
         } else if (queue.config.repeat == 'track') {
            await interaction.reply('Loop current track enabled!');
         }
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Loop;
