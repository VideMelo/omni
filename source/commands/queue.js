const Command = require('../managers/Command.js');

class Queue extends Command {
   constructor(client) {
      super(client, {
         name: 'queue',
         description: 'Guild Queue.',
      });
   }

   async execute({ client, interaction }) {
      try {
         const queue = client.player.get(interaction.guild.id);
         if (!queue.list.size) return await interaction.replyErro('No tracks in the queue.');

         const tracks = queue.list.map((track) => {
            return `> **${track.index}.** ${track.name}\n> \`${track.authors[0].name}\``;
         });

         const pages = client.embed.pages(tracks);
         const current = queue.list.get(queue.current.index);
         const next =
            current.index == queue.list.size && queue.config.loop && !queue.config.shuffle
               ? queue.list.get(1)
               : queue.list.get(current.index + 1);
         const color = await client.embed.color(current.thumbnail);
         const embeds = pages.map((track, index) => {
            return client.embed.new({
               thumbnail: `${current.thumbnail}`,
               color: color.Vibrant.hex,
               fields: [
                  {
                     name: 'Current',
                     value: `**${current.index}.** ${current.name}\n\`${current.authors[0].name}\` \`${current.time}\``,
                     inline: true,
                  },
                  {
                     name: 'Next',
                     value: next
                        ? `**${next.index}.** ${next.name}\n\`${next.authors[0].name}\``
                        : queue.config.shuffle && queue.list.size > 1
                        ? 'The next track is shuffled.'
                        : 'No more tracks in the queue.',
                     inline: true,
                  },
                  {
                     name: 'List',
                     value: pages[index],
                  },
               ],
               footer: {
                  text: `Queue  •  ${queue.list.size} tracks, ${queue.time}`,
               },
            });
         });

         await client.button.pagination({
            interaction,
            pages: embeds,
         });
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Queue;
