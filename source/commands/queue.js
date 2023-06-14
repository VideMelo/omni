const Command = require('../manegers/Command.js');

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
         return `> **${song.index}.** ${song.name}\n> \`${song.authors[0].name}\``;
      });

      const pages = client.embed.pages(songs);
      const current = client.player.queue.list.get(client.player.queue.current.index);
      const next = client.player.queue.list.get(current.index + 1);
      const color = await client.embed.color(current.thumbnail);
      const embeds = pages.map((song, index) => {
         return client.embed.new({
            thumbnail: `${current.thumbnail}`,
            color: color.Vibrant.hex,
            fields: [
               {
                  name: 'Current',
                  value: `**${current.index}.** ${current.name}\n\`${current.authors[0].name}\` \`${current.duration}\``,
                  inline: true,
               },
               {
                  name: 'Next',
                  value: next
                     ? `**${next.index}.** ${next.name}\n\`${next.authors[0].name}\``
                     : 'No more tracks.',
                  inline: true,
               },
               {
                  name: 'List',
                  value: pages[index],
               },
            ],
            footer: {
               text: `Queue  •  ${client.player.queue.list.size} tracks, ${client.player.queue.duration}`,
            },
         });
      });

      await client.button.pagination({
         interaction,
         pages: embeds,
      });
   }
}

module.exports = Queue;
