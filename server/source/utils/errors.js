class Errors {
   verify(interaction, options = { errors: [] }) {
      const errors = {
         userNotInVoice: {
            error: !interaction.member?.voice?.channel,
            message: 'You must join a voice channel first.',
         },
         botNotInVoice: {
            error: !interaction.guild.members.me?.voice?.channel,
            message: 'I must join a voice channel first.',
         },
         alreadyInVoice: {
            error: interaction.guild.members.me?.voice?.channel,
            message: 'I am already connected to a voice channel.',
         },
         inSameVoice: {
            error:
               interaction.guild.members.me?.voice?.channel &&
               interaction.guild.members.me?.voice?.channel?.id !==
                  interaction.member?.voice?.channel?.id,
            message: 'You need to be in the same voice channel as me.',
         },
         emptyQueue: {
            error: !interaction?.queue?.tracks?.size,
            message: 'There are no tracks in the queue.',
         },
      };
      for (const error of options.errors) {
         if (errors[error].error) {
            interaction.replyErro(errors[error].message);
            return true;
         }
      }
      return false;
   }
}

module.exports = Errors;
