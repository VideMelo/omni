const Command = require('../managers/Command.js');

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
         if (!interaction.member?.voice?.channel)
            return await interaction.replyErro('You must join a voice channel first.');

         if (
            interaction.guild.members.me?.voice?.channel &&
            interaction.guild.members.me?.voice?.channel?.id !=
               interaction.member?.voice?.channel?.id
         )
            return await interaction.replyErro('You need to be on the same voice channel as me.');
         if (!queue.list.size) return await interaction.replyErro('No tracks in the queue.');

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
