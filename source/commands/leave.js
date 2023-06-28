const Command = require('../managers/Command.js');

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

         queue.disconnect();
         interaction.noReply();
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Leave;
