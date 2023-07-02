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

         if (client.errors(interaction, {
               errors: ['userVoice', 'inSameVoice', 'emptyQueue'],
               queue,
            })) return;

         queue.config.loop = queue.config.loop ? false : queue.config.repeat ? false : true;
         queue.config.repeat = queue.config.repeat ? false : queue.config.loop ? false : true;

         if (!queue.config.loop && !queue.config.repeat) {
            await interaction.reply('Loop disabled!');
         } else if (queue.config.loop && !queue.config.repeat) {
            await interaction.reply('Loop queue enabled!');
         } else if (!queue.config.loop && queue.config.repeat) {
            await interaction.reply('Loop current track enabled!');
         }
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Loop;
