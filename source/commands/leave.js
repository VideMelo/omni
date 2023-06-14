const Command = require('../source/manegers/Command.js');

class Leave extends Command {
   constructor(client) {
      super(client, {
         name: 'leave',
         description: 'Leave to a voice channel!',
      });
   }

   async execute({ client, interaction }) {
      if (
         !interaction.guild.members.me?.voice?.channel ||
         !client.voice.adapters.get(interaction.guild.id) // in case the bot is restarted and still remains in the voice channel
      )
         return await interaction.reply("I'm not on any voice channels");
      if (!interaction.member?.voice?.channel)
         return await interaction.reply('You must join a voice channel first.');

      if (
         interaction.guild.members.me?.voice?.channel &&
         interaction.guild.members.me?.voice?.channel?.id != interaction.member.voice?.channel?.id
      )
         return await interaction.reply('You need to be on the same voice channel as me.');

      client.player.voice?.disconnect();
      interaction.noReply();
   }
}

module.exports = Leave;
