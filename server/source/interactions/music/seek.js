const Interaction = require('../../handlers/Interaction.js');

class Seek extends Interaction {
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

   async execute({ client, context }) {
      try {
         const queue = client.queue.get(context.guild.id);

         if (
            client.errors.verify(context, {
               errors: ['userNotInVoice', 'inSameVoice', 'emptyQueue'],
               queue,
            })
         )
            return;

         const position = context.options.getString('position');

         const regex = /^(((\d+):)?(\d{1,2})?(:(\d{2}))|((\d+)h)?\s?((\d+)m)?\s?((\d+)s)?)$/;
         const matches = regex.exec(position);
         if (!matches)
            return await context.replyErro(
               'Invalid position format. Valid formats: `1:30`, `1m30s`, `90s`, `90`.'
            );

         const hours = matches[3] || matches[8] || 0;
         const minutes = matches[4] || matches[10] || 0;
         const seconds = matches[6] || matches[12] || 0;
         const time =
            parseInt(hours) * 3600000 + parseInt(minutes) * 60000 + parseInt(seconds) * 1000;

         if (time > queue.current.duration)
            return await context.replyErro('Position cannot be longer than the track duration.');

         await queue.seek(time);
         return await context.reply(`Seeked to \`${position}\`.`);
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

module.exports = Seek;
