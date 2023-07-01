const Event = require('../../handlers/Event');

class QueueEnd extends Event {
   constructor() {
      super({ name: 'queueEnd' });
   }

   async execute(client, queue) {
      if (!queue.metadata.channel) return;

      const Embed = client.embed.new({
         title: 'Queue ended!',
         color: 'F5C325',
      });

      await queue.metadata.channel.send({
         embeds: [Embed],
      });
   }
}

module.exports = QueueEnd;
