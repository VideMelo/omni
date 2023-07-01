const Command = require('../handlers/Command.js');

class Remove extends Command {
   constructor(client) {
      super(client, {
         name: 'remove',
         description: 'Remove a track from the queue!',
         exemple: '1',
         usage: '<index>',
      });

      this.addIntegerOption((option) =>
         option.setName('index').setDescription('Index of the track to remove').setRequired(true)
      );
   }

   async execute({ client, interaction }) {
      try {
         const queue = client.player.get(interaction.guild.id);

         if (client.errors(interaction, {
               errors: ['userVoice', 'inSameVoice', 'emptyQueue'],
               queue,
            })) return;

         const index = interaction.options.getInteger('index');
         if (index > queue.list.size)
            return await interaction.replyErro(
               "You can't remove a track that hasn't been added yet."
            );

         const track = queue.remove(index);
         if (track) {
            return await interaction.reply(`Removed \`${track.name}\` from the queue.`);
         }
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Remove;
