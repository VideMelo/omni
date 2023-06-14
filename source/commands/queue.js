const Command = require('../source/manegers/Command.js');

class Queue extends Command {
   constructor(client) {
      super(client, {
         name: 'queue',
         description: 'Guild Queue.',
      });
   }

   async execute({ client, interaction }) {
      if (!client.player.queue.list.size) return await interaction.reply('No tracks in the queue.');

      const songs = client.player.queue.list.map((song) => {
         return `**${song.index}.** ${song.authors[1].name} - \`${song.name}\``;
      });

      const pages = client.embed.pages(songs);
      const embeds = pages.map((song, index) => {
         return client.embed.new({
            title: `${interaction.guild.name} - Queue`,
            thumbnail: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.jpeg`,
            description: `Guild musics list`,
            fields: [
               {
                  name: 'List',
                  value: pages[index],
               },
            ],
         });
      });

      await client.button.pagination({
         interaction,
         pages: embeds,
      });
   }
}

module.exports = Queue;
