const Command = require('../managers/Command.js');

class Seek extends Command {
   constructor(client) {
      super(client, {
         name: 'seek',
         description: 'Seek to a position in the track!',
         exemple: '1:30',
         usage: '<position>',
      });

      this.addStringOption((option) =>
         option.setName('position').setDescription('Position to seek').setRequired(true)
      );
   }

   async execute({ client, interaction }) {
      try {
         const queue = client.player.get(interaction.guild.id);
         if (!interaction.member?.voice?.channel)
            return await interaction.replyErro('You must join a voice channel first.');

         if (
            interaction.guild.members.me?.voice?.channel &&
            interaction.guild.members.me?.voice?.channel?.id !=
               interaction.member?.voice?.channel?.id
         )
            return await interaction.replyErro('You need to be on the same voice channel as me.');
         if (!queue.list.size) return await interaction.replyErro('No tracks in the queue.');

         const position = interaction.options.getString('position');

         const regex = /^(((\d+):)?(\d{1,2})?(:(\d{2}))|((\d+)h)?\s?((\d+)m)?\s?((\d+)s)?)$/;
         const matches = regex.exec(position);
         if (!matches)
            return await interaction.replyErro(
               'Invalid position format. Valid formats: `1:30`, `1m30s`, `90s`, `90`.'
            );

         const hours = matches[3] || matches[8] || 0;
         const minutes = matches[4] || matches[10] || 0;
         const seconds = matches[6] || matches[12] || 0;
         const time =
            parseInt(hours) * 3600000 + parseInt(minutes) * 60000 + parseInt(seconds) * 1000;

         if (time > queue.current.duration)
            return await interaction.replyErro(
               'Position cannot be longer than the track duration.'
            );

         await queue.seek(time);
         return await interaction.reply(`Seeked to \`${position}\`.`);
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Seek;
