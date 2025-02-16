const RATE_LIMIT_TIME = 15000;
const MAX_REQUESTS_DEFAULT = 5;
const MAX_REQUESTS_CUSTOM = {
   play: 3,
   next: 3,
   previous: 3,
};
const IGNORED_EVENTS = ['getQueue', 'getPlayer', 'set-user', 'syncVoiceChannel', 'search'];

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
            socket.emit('error', 'userBlocked');
            return client.logger.error(`User blocked: [${socket.user}]`);
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
            client.logger.error(`Event rate limit: [${event}], user: ${socket.user}`);
            socket.emit('error', 'rateLimit');
            socket.warns++;
            return;
         }

         requests.set(socket.id, data);
         next();
      });

      function validate() {
         if (!socket?.user) return;

         if (!socket.guild || !socket?.voice) {
            const data = { error: { status: 404, message: 'userNotSyncVoiceChannel' } };
            socket.emit('error', data.error.message);
            return data;
         }

         const queue = client.queue.get(socket.guild);
         const voice = queue?.voice;

         if (!queue || !voice) {
            const data = { error: { status: 404, message: 'queueNotFound' } };
            socket.emit('error', data.error.message);
            return data;
         }

         const requester = voice.members.get(socket.user);
         if (!requester) {
            const data = {
               error: { status: 403, message: 'userNotInQueueChannel' },
            };
            socket.emit('error', data.error.message);
            return data;
         }

         return { queue, voice, requester };
      }

      socket.on('getQueue', (callback) => {
         if (!socket.guild || !socket.voice) if (typeof callback == 'function') return callback(undefined);

         const queue = client.queue.get(socket.guild);
         if (!queue) if (typeof callback == 'function') return callback(undefined);

         client.logger.info(
            `user: ${socket.user} with ${socket.id} getQueue, in guild: ${socket.guild}`
         );

         if (typeof callback == 'function')
            callback({
               list: queue.tracks,
               current: queue.current,
            });
      });

      socket.on('getPlayer', (callback) => {
         if (!socket.guild || !socket.voice) if (typeof callback == 'function') return callback(undefined);

         const queue = client.queue.get(socket.guild);
         if (!queue) if (typeof callback == 'function') return callback(undefined);

         client.logger.info(
            `user: ${socket.user} with ${socket.id} getPlayer, in guild: ${socket.guild}`
         );

         if (typeof callback == 'function')
            callback({
               metadata: {
                  channel: queue.channel,
                  voice: queue.voice,
                  guild: queue.guild,
               },
               shuffle: queue.shuffle,
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
         if (data.error) return;

         data.queue.play(track, { requester: socket.user });
      });

      socket.on('newTrack', async (track, callback) => {
         const data = validate();
         if (data.error) return;
         track = {
            ...track,
            resquester: socket.user | 0,
         };
         data.queue.new(track, { type: 'track' });
         if (typeof callback == 'function') callback(data.queue.tracks);
      });

      socket.on('skipTo', (index) => {
         const data = validate();
         if (data.error) return;

         data.queue.play(data.queue.skip(index), { state: 'update', emit: true });
      });

      socket.on('pause', () => {
         const data = validate();
         if (data.error) return;

         if (!data.queue.playing) return;
         data.queue.pause();
      });

      socket.on('resume', () => {
         const data = validate();
         if (data.error) return;

         if (data.queue.playing) return;
         data.queue.unpause();
      });

      socket.on('next', () => {
         const data = validate();
         if (data.error) return;

         data.queue.play(data.queue.next(true));
      });

      socket.on('previous', () => {
         const data = validate();
         if (data.error) return;
         data.queue.play(data.queue.previous(true), { state: 'update', emit: true });
      });

      socket.on('repeat', (value) => {
         const data = validate();
         if (data.error) return;

         data.queue.setRepeat(value);
      });

      socket.on('shuffle', (value) => {
         const data = validate();
         if (data.error) return;

         if (value) {
            data.queue.shuffle();
         } else {
            data.queue.order();
         }
      });

      socket.on('volume', (value) => {
         const data = validate();
         if (data.error) return;

         data.queue.volume(value);
      });

      socket.on('seek', (value) => {
         const data = validate();
         if (data.error) return;

         data.queue.seek(value);
         client.socket.to(socket.guild).emit('seek', value);
      });
   });
};
