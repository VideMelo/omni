const Interaction = require('../../handlers/Interaction.js');

class Queue extends Interaction {
   constructor(client) {
      super(client, {
         name: 'queue',
         description: 'Guild Queue.',
      });
   }

   async execute({ client, context }) {
      try {
         if (client.errors.verify(context, { errors: ['emptyQueue'] })) return;

         const queue = client.queue.get(context.guild.id);

         const tracks = queue.tracks.map((track) => {
            return `> **${track.index + 1}.** ${track.name}\n> \`${track.artist}\``;
         });

         const pages = client.embed.pages(tracks);
         const current = queue.tracks.get(queue.current.id);
         const next =
            current.index == queue.tracks.size && queue.repeat && !queue.shuffle
               ? queue.tracks.at(1)
               : queue.tracks.at(current.index + 1);
         const color = await client.embed.color(current.thumbnail);
         const embeds = pages.map((track, index) => {
            return client.embed.new({
               thumbnail: `${current.thumbnail}`,
               color,
               fields: [
                  {
                     name: 'Current',
                     value: `**${current.index + 1}.** ${current.name}\n\`${current.artist}\``,
                     inline: true,
                  },
                  {
                     name: 'Next',
                     value: next
                        ? `**${next.index + 1}.** ${next.name}\n\`${next.artist}\``
                        : queue.shuffle && queue.tracks.size > 1
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
                  text: `Queue  •  ${queue.tracks.size} tracks`,
               },
            });
         });

         await client.button.pagination({
            interaction: context,
            pages: embeds,
         });
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

module.exports = Queue;
