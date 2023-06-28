const Event = require('../../managers/Event');

const Discord = require('discord.js');

class NewList extends Event {
   constructor() {
      super({ name: 'newList' });
   }

   async execute(client, queue, list) {
      const color = await client.embed.color(list?.thumbnail);

      const Embed = client.embed.new({
         color: color?.Vibrant?.hex ?? color,
         author: {
            name: 'New Playlist!',
         },
         thumbnail: list?.thumbnail ?? null,
         title: `${list.name.length > 36 ? `${list.name.slice(0, 36)}...` : list.name}`,
         description: `Added **${list.tracks.length}** tracks!`,
      });
      
      if (list?.page) {
         const next = client.button.primary('next', 'Load Next Page', { style: 1 });
         const pages = client.button
            .secondary('pages', `${list.page}/${Math.ceil(list.total / 100)}`)
            .setDisabled(true);
         const row = client.button.row([next, pages]);

         const message = await queue.metadata.channel.send({
            embeds: [Embed],
            components: [row],
         });

         const collector = message.createMessageComponentCollector({
            componentType: Discord.ComponentType.Button,
            time: 30000,
         });

         if (list.page >= Math.ceil(list.total / 100)) {
            collector.stop();
            next.setDisabled(true);
            return message.edit({
               components: [row],
            });
         }

         collector.on('collect', async (collect) => {
            if (!collect.isButton()) return;
            collect.deferUpdate();

            const search = await queue.node.search.list(list.url, { page: list.page + 1 });
            await queue.new(search, {
               member: collect.member,
               type: 'list',
            });
            collector.stop();
         });

         collector.on('end', async () => {
            next.setDisabled(true);
            return message.edit({
               components: [row],
            });
         });
      } else {
         await queue.metadata.channel.send({
            embeds: [Embed],
         });
      }
   }
}

module.exports = NewList;
