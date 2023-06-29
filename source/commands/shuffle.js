const Command = require('../managers/Command.js');
const Errors = require('../utils/errors.js');

class Shuffle extends Command {
   constructor(client) {
      super(client, {
         name: 'shuffle',
         description: 'Shuffle the queue!',
      });
   }

   async execute({ client, interaction }) {
      try {
         const queue = client.player.get(interaction.guild.id);

         if (Errors(interaction, { errors: ['userVoice', 'inSameVoice', 'emptyQueue'], queue }))
            return;

         queue.shuffle();
         queue.config.shuffle = true;
         return await interaction.reply('Queue shuffled!');
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Shuffle;
