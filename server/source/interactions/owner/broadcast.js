const Discord = require('discord.js');

const Interaction = require('../../handlers/Interaction.js');

class Broadcast extends Interaction {
   constructor(client) {
      super(client, {
         name: 'broadcast',
         description: 'Execute a command in large scale for tests!',
      });

      this.addStringOption((option) =>
         option.setName('input').setDescription('Input for a command!').setRequired(true)
      );
   }

   async execute({ client, context }) {
      const voices = [
         '1343352947320553523',
         '1343352599398580248',
         '1343345916224081956',
         '1343345399489888414',
         '1343062286587138082',
         '1343060393374912597',
         '1343059910803456093',
         '1343061169761423433',
         '1343058313675411477',
      ];

      const input = context.options.getString('input');
      const search = await client.search.list(input);

      const queues = [];

      for (const voice of voices) {
         const queue = await client.initGuildQueue({ voice });
         queue.new(search.items[0]);
         queue.shuffle();
         queues.push(queue);

         console.log(search.items[0].tracks.length);
      }

      for (const queue of queues) {
         await queue.play(queue.tracks.at(0));
      }
   }
}

module.exports = Broadcast;
