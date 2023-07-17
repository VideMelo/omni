module.exports = (io) => {
   io.on('connection', (socket) => {
      const client = require('../../../');
      socket.on('get-queue', (callback) => {
         console.log(`user: ${socket.user} with ${socket.id} get-queue, in guild: ${socket.guild}`);

         console.log(socket.guild);
         const queue = client.player.get(socket.guild);
         if (!queue) return;

         callback({
            list: queue.list,
            playing: queue.state == 'playing' ? true : false,
            state: queue.state,
            current: {
               ...queue.current,
               position: queue.getPosition(),
            },
            metadata: {
               channel: queue.metadata.channel,
               voice: queue.metadata.voice,
            },
            config: queue.config,
         });
      });

      socket.on('pause', () => {
         const queue = client.player.get(socket.guild);
         if (!queue) return;

         if (!queue.state == 'playing') return;
         queue.pause();
      });

      socket.on('resume', () => {
         const queue = client.player.get(socket.guild);
         if (!queue) return;

         if (queue.state == 'playing') return;
         queue.resume();
      });

      socket.on('next', () => {
         const queue = client.player.get(socket.guild);
         if (!queue) return;

         queue.play(queue.next(), { state: 'update', emit: true });
      });

      socket.on('previous', () => {
         const queue = client.player.get(socket.guild);
         if (!queue) return;
         queue.play(queue.previous(), { state: 'update', emit: true });
      });

      socket.on('repeat', (value) => {
         const queue = client.player.get(socket.guild);
         if (!queue) return;

         queue.setRepeat(value);
      });

      socket.on('shuffle', (value) => {
         const queue = client.player.get(socket.guild);
         if (!queue) return;

         if (value) {
            queue.shuffle();
         } else {
            queue.order();
         }
      });

      socket.on('volume', (value) => {
         const queue = client.player.get(socket.guild);
         if (!queue) return;

         queue.volume(value);
      });

      socket.on('seek', (value) => {
         const queue = client.player.get(socket.guild);
         if (!queue) return;

         queue.seek(value);
         client.socket.to(socket.guild).emit('seek', value);
      });
   });
};
