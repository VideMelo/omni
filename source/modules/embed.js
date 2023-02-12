const Discord = require('discord.js');

class Embed {
   new({
      title = '',
      description = '',
      fields = [],
      thumbnail = '',
      color = '609EAF',
      timestamp = false,
      author = '',
   }) {
      const embed = new Discord.EmbedBuilder();
      embed.setColor(color);

      if (title) embed.setTitle(title);
      if (description) embed.setDescription(description);
      if (fields) embed.addFields(fields);
      if (timestamp) embed.setTimestamp();
      if (thumbnail) embed.setThumbnail(thumbnail);
      if (author) embed.setAuthor(author);

      return embed;
   }
}

module.exports = Embed;
