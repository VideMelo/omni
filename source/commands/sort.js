const Command = require('../managers/Command.js');
const Errors = require('../utils/errors.js');

class Sort extends Command {
   constructor(client) {
      super(client, {
         name: 'sort',
         description: 'Sort the queue!',
      });
   }

   async execute({ client, interaction }) {
      try {
         const queue = client.player.get(interaction.guild.id);

         if (Errors(interaction, { errors: ['userVoice', 'inSameVoice', 'emptyQueue'], queue }))
            return;

         queue.order();
         queue.config.shuffle = false;
         return await interaction.reply('Queue sorted!');
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Sort;
