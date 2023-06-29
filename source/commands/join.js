const Command = require('../managers/Command.js');
const Errors = require('../utils/errors.js');

class Join extends Command {
   constructor(client) {
      super(client, {
         name: 'join',
         description: 'Join to a voice channel!',
      });
   }

   async execute({ client, interaction }) {
      try {
         const queue = client.player.get(interaction.guild.id);

         if (Errors(interaction, { errors: ['userVoice'] })) return;

         interaction.noReply();
         queue.connect(interaction.member.voice.channel, interaction.channel.guild, interaction);
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Join;
