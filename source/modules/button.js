const Discord = require('discord.js');

class Buttons {
   primary(id, label) {
      const button = new Discord.ButtonBuilder();
      button.setCustomId(id);
      button.setLabel(label);
      button.setStyle('Primary');
      return button;
   }

   secondary(id, label) {
      const button = new Discord.ButtonBuilder();
      button.setCustomId(id);
      button.setLabel(label);
      button.setStyle('Secondary');
      return button;
   }

   success(id, label) {
      const button = new Discord.ButtonBuilder();
      button.setCustomId(id);
      button.setLabel(label);
      button.setStyle('Success');
      return button;
   }

   danger(id, label) {
      const button = new Discord.ButtonBuilder();
      button.setCustomId(id);
      button.setLabel(label);
      button.setStyle('Danger');
      return button;
   }

   link(id, label, url) {
      const button = new Discord.ButtonBuilder();
      button.setCustomId(id);
      button.setLabel(label);
      button.setUrl(url);
      button.setStyle('Link');
      return button;
   }

   emoji(id, emoji, style = 'Primary', label = '') {
      const button = new Discord.ButtonBuilder();
      button.setCustomId(id);
      button.setEmoji(emoji);
      button.setStyle(style);

      if (label) button.setLabel(label);
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

            const first = this.emoji('first', '<:first:1070496991345377411>', style).setDisabled(
               true
            );
            const previous = this.emoji(
               'previous',
               '<:previous:1070496467254513706>',
               style
            ).setDisabled(true);
            const number = this.secondary('number', `${page + 1}/${pages.length}`).setDisabled(
               true
            );
            const next = this.emoji('next', '<:next:1070496518420844566>', style);
            const last = this.emoji('last', '<:last:1070497040997568634>', style);

            const buttons = [first, previous, number, next, last];
            const row = this.row(buttons);

            const message = await interaction.reply({
               [type]: type === 'embeds' ? [pages[page]] : pages[page],
               components: pages.length > 1 ? [row] : [],
               fetchReply: true,
            });
            
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
                     fetchReply: true,
                  });
               } catch (error) {
                  console.error(error);
               }
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
                     fetchReply: true,
                  });
               } catch (error) {}
            });
         }
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Buttons;
