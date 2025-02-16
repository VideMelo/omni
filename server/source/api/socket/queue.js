const RATE_LIMIT_TIME = 15000;
const MAX_REQUESTS_DEFAULT = 5;
const MAX_REQUESTS_CUSTOM = {
   play: 3,
   next: 3,
   previous: 3,
};
const IGNORED_EVENTS = ['get-queue', 'get-player', 'set-user', 'sync-voiceChannel', 'search'];

const requests = new Map();
module.exports = (io) => {
   io.use((socket, next) => {
      if (!requests.has(socket.id)) {
         socket.warns = 0;
         requests.set(socket.id, {});
      }
      next();
   });
   io.on('connection', (socket) => {
      const client = require('../../..');

      socket.use((packet, next) => {
         const event = packet[0];

         if (IGNORED_EVENTS.includes(event)) {
            return next();
         }

         if (socket.warns > 20) {
            io.emit('error', 'userBlocked');
            return client.logger.erro(`User blocked: [${socket.user}]`);
         }

         const now = Date.now();
         const data = requests.get(socket.id) || {};
         data[event] = data[event] || { count: 0, startTime: now };

         if (now - data[event].startTime > RATE_LIMIT_TIME) {
            data[event].count = 0;
            data[event].startTime = now;
         }

         const maxRequests = MAX_REQUESTS_CUSTOM[event] || MAX_REQUESTS_DEFAULT;
         data[event].count++;

         if (data[event].count > maxRequests) {
            client.logger.erro(`Event rate limit: [${event}], user: ${socket.user}`);
            io.emit('error', 'rateLimit');
            socket.warns++;
            return;
         }

         requests.set(socket.id, data);
         next();
      });

      function validate() {
         if (!socket?.voice || !socket?.user || !socket?.guild) return;

         const queue = client.queue.get(socket.guild);
         const voice = queue?.voice;
         if (!voice) {
            client.logger.erro('Queue is not conncet in a voice channel!');
            return;
         }

         const requester = voice.members.get(socket.user);
         if (!requester) {
            client.logger.erro('User is not in the queue voice channel!');
            return;
         }

         return { queue, voice, requester };
      }

      socket.on('get-queue', (callback) => {
         if (!socket.guild) return;

         const queue = client.queue.get(socket.guild);
         if (!queue) return;

         client.logger.info(
            `user: ${socket.user} with ${socket.id} get-queue, in guild: ${socket.guild}`
         );

         if (typeof callback == 'function')
            callback({
               list: queue.tracks,
               current: queue.current,
            });
      });

      socket.on('get-player', (callback) => {
         if (!socket.guild) return;

         const queue = client.queue.get(socket.guild);
         if (!queue) return;

         client.logger.info(
            `user: ${socket.user} with ${socket.id} get-player, in guild: ${socket.guild}`
         );

         if (typeof callback == 'function')
            callback({
               metadata: {
                  channel: queue.channel,
                  voice: queue.voice,
                  guild: queue.guild.name,
               },
               repeat: queue.repeat,
               position: queue?.player?.position | 0,
               playing: queue.playing,
            });
      });

      socket.on('search', async (query, callback) => {
         const result = await client.search.list(query, { type: 'topResult' });
         if (typeof callback == 'function') callback(result);
      });

      socket.on('play', async (track, callback) => {
         const data = validate();
         if (!data) return;

         data.queue.play(track, { requester: socket.user });
      });

      socket.on('new-track', async (track, callback) => {
         const data = validate();
         if (!data) return;
         track = {
            ...track,
            resquester: socket.user | 0,
         };
         data.queue.new(track, { type: 'track' });
         if (typeof callback == 'function') callback(data.queue.tracks);
      });

      socket.on('skip-to', (index) => {
         const data = validate();
         if (!data) return;

         data.queue.play(data.queue.skip(index), { state: 'update', emit: true });
      });

      socket.on('pause', () => {
         const data = validate();
         if (!data) return;

         if (!data.queue.playing) return;
         data.queue.pause();
      });

      socket.on('resume', () => {
         const data = validate();
         if (!data) return;

         if (data.queue.playing) return;
         data.queue.unpause();
      });

      socket.on('next', () => {
         const data = validate();
         if (!data) return;

         data.queue.play(data.queue.next(true));
      });

      socket.on('previous', () => {
         const data = validate();
         if (!data) return;
         data.queue.play(data.queue.previous(true), { state: 'update', emit: true });
      });

      socket.on('repeat', (value) => {
         const data = validate();
         if (!data) return;

         data.queue.setRepeat(value);
      });

      socket.on('shuffle', (value) => {
         const data = validate();
         if (!data) return;

         if (value) {
            data.queue.shuffle();
         } else {
            data.queue.order();
         }
      });

      socket.on('volume', (value) => {
         const data = validate();
         if (!data) return;

         data.queue.volume(value);
      });

      socket.on('seek', (value) => {
         const data = validate();
         if (!data) return;

         data.queue.seek(value);
         client.socket.to(socket.guild).emit('seek', value);
      });
   });
};
