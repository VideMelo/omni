const Command = require('../manegers/Command.js');

class Join extends Command {
   constructor(client) {
      super(client, {
         name: 'join',
         description: 'Join to a voice channel!',
      });
   }

   async execute({ client, interaction }) {
      if (!interaction.member?.voice?.channel)
         return await interaction.reply('You must join a voice channel first.');
      interaction.noReply();
      client.player.connect(
         interaction.member.voice.channel.id,
         interaction.channel.guild.id,
         interaction
      );
   }
}

module.exports = Join;
