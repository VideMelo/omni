const Interaction = require('../../handlers/Interaction.js');

class Join extends Interaction {
   constructor(client) {
      super(client, {
         name: 'join',
         description: 'Join to a voice channel!',
      });
   }

   async execute({ client, context }) {
      try {
         if (client.errors.verify(context, { errors: ['userNotInVoice'] }))
            return;
         
         context.noReply();
         client.initGuildQueue(context.channel.guild, context.member.voice.channel);
      } catch (error) {
         console.error(error);
         client.logger.erro(error);
      }
   }
}

module.exports = Join;
