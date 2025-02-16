const Event = require('../../handlers/Event');

class NowPlaying extends Event {
   constructor() {
      super({ name: 'nowPlaying' });
   }

   async execute(client, queue, track) {
      if (!queue.channel) return;

      const color = await client.embed.color(track?.thumbnail);

      const Embed = client.embed.new({
         color,
         author: {
            name: 'Now Playing!',
         },
         thumbnail: track?.thumbnail ?? null,
         title: `${track.name.length > 36 ? `${track.name.slice(0, 36)}...` : track.name}`,
         description: `${track.artist}`,
      });

      try {
         const last = queue.message;
         const message = await queue.channel.send({
            embeds: [Embed],
            components: [],
         });
         queue.message = message;
         await last?.delete();
      } catch (error) {
         if (error.code == 10008) return;
         client.logger.error(error);
      }
   }
}

module.exports = NowPlaying;
