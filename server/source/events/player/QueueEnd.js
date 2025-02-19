const Event = require('../../handlers/Event');

class QueueEnd extends Event {
   constructor() {
      super({ name: 'queueEnd' });
   }

   async execute(client, queue) {
      setTimeout(() => {
         if (!queue.playing) return client.destroyGuildQueue(queue.guild.id);
      }, 1000);

      if (!queue.channel) return;

      const Embed = client.embed.new({
         title: 'Queue ended!',
      });

      await queue.channel.send({
         embeds: [Embed],
      });
   }
}

module.exports = QueueEnd;
 