const Command = require('../managers/Command.js');

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
         if (
            !interaction.guild.members.me?.voice?.channel ||
            !client.voice.adapters.get(interaction.guild.id)
         )
            return await interaction.replyErro("I'm not on any voice channels");
         if (!interaction.member?.voice?.channel)
            return await interaction.replyErro('You must join a voice channel first.');

         if (
            interaction.guild.members.me?.voice?.channel &&
            interaction.guild.members.me?.voice?.channel?.id !=
               interaction.member.voice?.channel?.id
         )
            return await interaction.replyErro('You need to be on the same voice channel as me.');

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