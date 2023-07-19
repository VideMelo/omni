const Discord = require('discord.js');
const Vibrant = require('node-vibrant');

class Embed {
   new({
      title = '',
      description = '',
      fields = [],
      thumbnail = '',
      color = 'FFC619',
      timestamp = false,
      author = '',
      footer = 0,
   }) {
      const embed = new Discord.EmbedBuilder();
      embed.setColor(color);

      if (title) embed.setTitle(title);
      if (description) embed.setDescription(description);
      if (fields) embed.addFields(fields);
      if (timestamp) embed.setTimestamp();
      if (thumbnail) embed.setThumbnail(thumbnail);
      if (author) embed.setAuthor(author);
      if (footer) embed.setFooter(footer);

      return embed;
   }

   // splits an array into several others (return array of arrays)
   pages(list, size = 10) {
      let pages = [];
      let index = 0;
      while (index < list.length) {
         pages.push(list.slice(index, index + size).join('\n\n'));
         index += size;
      }
      return pages;
   }

   // get the most present color in an image
   async color(image, type = 'Vibrant') {
      return image ? (await Vibrant.from(image).getSwatches())?.[type]?.hex : 'FFC619';
   }
}

module.exports = Embed;
