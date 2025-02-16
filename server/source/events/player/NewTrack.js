const Event = require('../../handlers/Event');

class NewTrack extends Event {
   constructor() {
      super({ name: 'newTrack' });
   }

   async execute(client, queue, track) {
      if (!queue.channel) return;
      if (queue.tracks.size == 1) return;

      const color = await client.embed.color(track.thumbnail);

      const Embed = client.embed.new({
         color,
         author: {
            name: 'New track!',
         },
         thumbnail: track?.thumbnail ?? null,
         title: `${track.name.length > 36 ? `${track.name.slice(0, 36)}...` : track.name}`,
         description: `${track.artist}\n`,
         fields: [
            {
               name: 'Duration',
               value: track.time,
               inline: true,
            },
            {
               name: 'Resquester',
               value: `<@${track.requester.id}>`,
               inline: true,
            },
            {
               name: 'Index',
               value: `${track.index}`,
               inline: true,
            },
         ],
      });

      await queue.channel.send({
         embeds: [Embed],
      });
   }
}

module.exports = NewTrack;
