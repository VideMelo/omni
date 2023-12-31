const Event = require('../../handlers/Event');
const Logger = require('../../utils/logger');

class NowPlaying extends Event {
   constructor() {
      super({ name: 'playing' });
   }

   async execute(client, queue, track) {
      if (!queue.metadata.channel) return;

      const color = await client.embed.color(track?.thumbnail);

      const Embed = client.embed.new({
         color,
         author: {
            name: 'Now Playing!',
         },
         thumbnail: track?.thumbnail ?? null,
         title: `${track.name.length > 36 ? `${track.name.slice(0, 36)}...` : track.name}`,
         description: `${track.authors.map((author) => author.name).join(', ')}`,
      });

      try {
         const last = queue.metadata.message;
         const message = await queue.metadata.channel.send({
            embeds: [Embed],
            components: [],
         });
         queue.metadata.message = message;
         await last?.delete();
      } catch (error) {
         if (error.code == 10008) return;
         Logger.erro(error);
      }
   }
}

module.exports = NowPlaying;
