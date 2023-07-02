function Errors(interaction, options = { errors: [] }) {
   list = {
      userVoice: {
         error: !interaction.member?.voice?.channel,
         message: 'You must join a voice channel first.',
      },
      botVoice: {
         error: !interaction.guild.members.me?.voice?.channel,
         message: 'I must join a voice channel first.',
      },
      inSameVoice: {
         error:
            interaction.guild.members.me?.voice?.channel &&
            interaction.guild.members.me?.voice?.channel?.id !=
               interaction.member?.voice?.channel?.id,
         message: 'You need to be on the same voice channel as me.',
      },
      emptyQueue: {
         error: !options.queue?.list.size,
         message: 'No tracks in the queue.',
      },
   };

   for (const error of options.errors) {
      if (list[error].error) {
         interaction.replyErro(list[error].message);
         return true;
      }
   }
   return false;
}

module.exports = Errors;
