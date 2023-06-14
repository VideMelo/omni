const Command = require('../source/manegers/Command.js');

class pause extends Command {
   constructor(client) {
      super(client, {
         name: 'pause',
         description: 'Pause current song!',
      });
   }

   async execute({ client, interaction }) {
      if (
         !client.voice.adapters.get(interaction.guild.id) ||
         !interaction.guild.members.me?.voice?.channel
      )
         return await interaction.reply("I'm not on any voice channels");
      if (!interaction.member?.voice?.channel)
         return await interaction.reply('You must join a voice channel first.');

      if (
         interaction.guild.members.me?.voice?.channel &&
         interaction.guild.members.me?.voice?.channel?.id != interaction.member?.voice?.channel?.id
      )
         return await interaction.reply('You need to be on the same voice channel as me.');
      if (!client.player.queue.list.size) return await interaction.reply('No tracks in the queue.');

      await interaction.noReply();
      client.player.pause();
   }
}

module.exports = pause;
