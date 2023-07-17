const Event = require('../../handlers/Event');

const Discord = require('discord.js');

class NewList extends Event {
   constructor() {
      super({ name: 'newList' });
   }

   async execute(client, queue, list) {
      if (!queue.metadata.channel) return;
      const color = await client.embed.color(list?.thumbnail);

      const Embed = client.embed.new({
         color,
         author: {
            name: 'New Playlist!',
         },
         thumbnail: list?.thumbnail ?? null,
         title: `${list.name.length > 36 ? `${list.name.slice(0, 36)}...` : list.name}`,
         description: `Added **${list.tracks.length}** tracks!`,
      });

      if (list?.page) {
         const next = client.button.new({
            id: 'next',
            label: 'Load Next Page',
         });
         const pages = client.button.new({
            id: 'pages',
            label: `${list.page}/${Math.ceil(list.total / 100)}`,
            style: 'Secondary',
            disabled: true,
         });
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
