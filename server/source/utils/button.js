const Discord = require('discord.js');

class Buttons {
   new({ style = 'Primary', label, id, url, emoji, disabled = false }) {
      const button = new Discord.ButtonBuilder();

      if (id) button.setCustomId(id);
      if (label) button.setLabel(label);
      if (style === 'Link' && url) button.setUrl(url);
      if (emoji) button.setEmoji(emoji);
      if (style) button.setStyle(style);

      button.setDisabled(disabled);
      return button;
   }

   row(components) {
      const button = new Discord.ActionRowBuilder();
      button.addComponents(components);
      return button;
   }

   menu({ id, placeholder, options }) {
      const menu = new Discord.StringSelectMenuBuilder();
      menu.setCustomId(id);
      menu.setPlaceholder(placeholder);
      menu.addOptions(options);
      return menu;
   }

   async pagination({ interaction = {}, pages = [], type = 'embeds', style = 'Primary' }) {
      if (!Array.isArray(pages)) throw new Error('Pages is not array!');
      if (!(type === 'embeds' || type === 'content')) throw new Error('Invalid type');

      try {
         if (pages.length > 1) {
            let page = 0;

            const first = this.new({
               id: 'first',
               emoji: '<:first:1070496991345377411>',
               disabled: true,
               style,
            });
            const previous = this.new({
               id: 'previous',
               emoji: '<:previous:1070496467254513706>',
               disabled: true,
               style,
            });
            const number = this.new({
               id: 'number',
               label: `${page + 1}/${pages.length}`,
               style: 'Secondary',
               disabled: true,
            });
            const next = this.new({
               id: 'next',
               emoji: '<:next:1070496518420844566>',
               style,
            });
            const last = this.new({
               id: 'last',
               emoji: '<:last:1070497040997568634>',
               style,
            });

            const buttons = [first, previous, number, next, last];
            const row = this.row(buttons);
 
            await interaction.reply({
               [type]: type === 'embeds' ? [pages[page]] : pages[page],
               components: pages.length > 1 ? [row] : [],
            });

            const message = await interaction.fetchReply();

            const collector = message.createMessageComponentCollector({
               componentType: Discord.ComponentType.Button,
               time: 30000,
            });


            collector.on('collect', async (collect) => {
               if (!collect.isButton()) return;
               collect.deferUpdate();

               switch (collect.customId) {
                  case 'first':
                     page = 0;
                     break;
                  case 'previous':
                     page = page == 0 ? page : page - 1;
                     break;
                  case 'next':
                     page = page == pages.length - 1 ? page : page + 1;
                     break;
                  case 'last':
                     page = pages.length - 1;
               }

               number.setLabel(`${page + 1}/${pages.length}`);

               if (page > 0) {
                  first.setDisabled(false);
                  previous.setDisabled(false);
               }
               if (!page > 0) {
                  first.setDisabled(true);
                  previous.setDisabled(true);
               }
               if (!page < pages.length - 1) {
                  next.setDisabled(true);
                  last.setDisabled(true);
               }
               if (page < pages.length - 1) {
                  next.setDisabled(false);
                  last.setDisabled(false);
               }

               collector.resetTimer({
                  time: 30000,
               });

               try {
                  await message.edit({
                     [type]: type === 'embeds' ? [pages[page]] : pages[page],
                     components: [row],
                     withResponse: true,
                  });
               } catch (error) {}
            });

            collector.on('end', async () => {
               try {
                  buttons.forEach((button) => {
                     button.setDisabled(true);
                     button.setStyle('Secondary');
                  });
                  await message.edit({
                     [type]: type === 'embeds' ? [pages[page]] : pages[page],
                     components: [row],
                     withResponse: true,
                  });
               } catch (error) {}
            });
         } else {
            await interaction.reply({
               [type]: type === 'embeds' ? [pages[0]] : pages[0],
               withResponse: true,
            });
         }
      } catch (error) {
         console.error(error)
         throw new Error(error);
      }
   }
}

module.exports = Buttons;
