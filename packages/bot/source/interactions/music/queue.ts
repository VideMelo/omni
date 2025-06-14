import Bot from '../../core/Bot.js';
import { InteractionContext } from '../../modules/Interactions.js';
import Interaction from '../../handlers/Interaction.js';

class Queue extends Interaction {
   constructor() {
      super({
         name: 'queue',
         description: 'Guild Queue.',
      });
   }

   async execute({ client, context }: { client: Bot; context: InteractionContext }) {
      try {
         const player = client.players.get(context.guild.id);
         if (!player) return await context.replyErro('No player found for this guild!');

         const queue = player.queue;

         const tracks = queue.tracks.map((track) => {
            return `> **${track.index! + 1}.** ${track.name}\n> \`${track.artist.name}\``;
         });

         const pages = client.embed.pages(tracks);
         const current = queue.tracks.find((track) => track.id === player.current?.id)!;
         if (!current) return context.replyErro('No current playing song found!')
            
         const next = queue.next();
         const color = await client.embed.color(current.thumbnail!);
         const embeds = pages.map((track, index) => {
            return client.embed.new({
               thumbnail: `${current.thumbnail}`,
               color,
               fields: [
                  {
                     name: 'Current',
                     value: `**${current.index! + 1}.** ${current.name}\n\`${
                        current.artist.name
                     }\``,
                     inline: true,
                  },
                  {
                     name: 'Next',
                     value: next
                        ? `**${next.index! + 1}.** ${next.name}\n\`${next.artist.name}\``
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
      } catch (err: any) {
         throw new Error(err);
      }
   }
}

module.exports = Queue;
