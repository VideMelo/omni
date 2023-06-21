const Command = require('../managers/Command.js');

class Join extends Command {
   constructor(client) {
      super(client, {
         name: 'join',
         description: 'Join to a voice channel!',
      });
   }

   async execute({ client, interaction }) {
      try {
         const player = client.manager.get(interaction.guild.id);
         if (!interaction.member?.voice?.channel)
            return await interaction.replyErro('You must join a voice channel first.');
         interaction.noReply();
         player.queue.connect(
            interaction.member.voice.channel.id,
            interaction.channel.guild.id,
            interaction
         );
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Join;
