const Command = require('../managers/Command.js');

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
         const player = client.Manager.get(interaction.guild.id);
         if (!interaction.member?.voice?.channel)
            return await interaction.replyErro('You must join a voice channel first.');

         if (
            interaction.guild.members.me?.voice?.channel &&
            interaction.guild.members.me?.voice?.channel?.id !=
               interaction.member?.voice?.channel?.id
         )
            return await interaction.replyErro('You need to be on the same voice channel as me.');
         if (!player.queue.list.size) return await interaction.replyErro('No tracks in the queue.');

         const index = interaction.options.getInteger('index');
         if (index > player.queue.list.size)
            return await interaction.replyErro(
               "You can't remove a track that hasn't been added yet."
            );

         const track = player.queue.remove(index);
         if (track) {
            return await interaction.reply(`Removed \`${track.name}\` from the queue.`);
         }
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Remove;
