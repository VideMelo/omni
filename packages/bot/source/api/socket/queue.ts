import { Server, Socket } from 'socket.io';
import logger from '../../utils/logger.js';
import { Track } from '../../handlers/Media.js';
import { isBooleanObject } from 'node:util/types';
import { isBoolean } from 'node:util';

const RATE_LIMIT_TIME = 15000;
const MAX_REQUESTS_DEFAULT = 20;
const MAX_REQUESTS_CUSTOM: Record<string, number> = {
   'player:play': 3,
   'player:next': 3,
   'player:previous': 3,
};
const IGNORED_EVENTS = ['queue:get', 'player:get', 'user:set', 'voice:sync', 'search:top'];

interface RequestEventData {
   count: number;
   startTime: number;
}

interface SocketWithMeta extends Socket {
   user?: string;
   guild?: string;
   voice?: any;
   warns?: number;
}

const requests = new Map<string, Record<string, RequestEventData>>();

module.exports = (io: Server) => {
   io.use((socket: SocketWithMeta, next) => {
      if (!requests.has(socket.id)) {
         socket.warns = 0;
         requests.set(socket.id, {});
      }
      next();
   });

   io.on('connection', async (socket: SocketWithMeta) => {
      const { default: client } = await import('../../index.js');

      socket.use(([event, ...args], next) => {
         if (IGNORED_EVENTS.includes(event)) return next();

         if ((socket.warns || 0) >= 25) {
            socket.emit('status', {
               type: 'error',
               message: `You have been blocked for a while, try again later.`,
            });
            return logger.error(`User warned: [${socket.user}]`);
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
            logger.error(`Event rate limit: [${event}], user: ${socket.user}`);
            socket.emit('status', {
               type: 'error',
               message: `You are making requests too quickly; please wait a moment before making the next one!!`,
            });
            socket.warns = (socket.warns || 0) + 1;
            return;
         }

         requests.set(socket.id, data);
         next();
      });

      async function validate() {
         if (!socket?.user) {
            const error = { status: 404, message: 'userNotFound' };
            socket.emit('status', { type: 'error', ...error });
            return { error };
         }

         if (!socket.guild || !socket?.voice) {
            const error = { status: 404, message: 'userNotInVoice' };
            socket.emit('status', { type: 'error', ...error });
            return { error };
         }

         const voice = await client.channels.fetch(socket.voice);
         if (!voice?.isVoiceBased()) return;

         let player = client.players.get(socket.guild);
         if (!player) {
            player = await client.initGuildPlayer(voice);
         }

         if (voice.id !== player?.voice) {
            const error = { status: 403, message: 'playerNotInitied' };
            socket.emit('status', { type: 'error', ...error });
            return { error };
         }

         const requester = voice.members.get(socket.user);
         if (!requester) {
            const error = { status: 403, message: 'userNotInPlayerChannel' };
            socket.emit('status', { type: 'warn', ...error });
            return { error };
         }

         return { player, voice, requester };
      }

      socket.on('queue:get', (callback?: (data?: any) => void) => {
         if (!socket.guild || !socket.voice) return callback?.(undefined);
         const player = client.players.get(socket.guild);
         if (!player) return callback?.(undefined);

         logger.info(`user: ${socket.user} with ${socket.id} queue:get, in guild: ${socket.guild}`);
         callback?.({
            list: player.queue.tracks,
            current: player.current,
            next: player.queue.next(),
            repeat: player.queue.repeat,
            shuffled: player.queue.shuffled,
            previous: player.queue.previous(),
         });
      });

      socket.on('player:get', (callback?: (data?: any) => void) => {
         if (!socket.guild || !socket.voice || !socket.user) return callback?.(undefined);
         const player = client.players.get(socket.guild);
         if (!player) return callback?.(undefined);

         logger.info(`user: ${socket.user} with ${socket.id} player:get, in guild: ${socket.guild}`);
         callback?.({
            metadata: player.metadata,
            repeat: player.queue.repeat,
            position: player.getPosition() || 0,
            playing: player.playing,
            paused: player.paused,
            volume: player.volume,
         });
      });

      socket.on('search:top', async (query: string, callback?: (result: any) => void) => {
         if (!socket.user) return callback?.(undefined);
         const result = await client.search.resolve(query, { type: 'top' });
         callback?.(result);
      });

      socket.on('player:play', async (track: any, callback?: Function) => {
         const data = await validate();
         if (data?.error || !data) return;
         data.player.play(new Track(track), { force: true });
      });

      socket.on('queue:new', async (track: any, callback?: (tracks: any) => void) => {
         const data = await validate();
         if (data?.error || !data) return;

         track = {
            ...track,
            resquester: socket.user || 0,
         };

         data.player.queue.new(new Track(track), { requester: socket.user });
         socket.emit('status', {
            type: 'done',
            message: `New track added to queue!`,
         });
         callback?.(data.player.queue.tracks);
      });

      socket.on('player:skip', async (index: number) => {
         const data = await validate();
         if (data?.error || !data) return;

         const track = data.player.queue.get(index);
         if (!track) return;

         data.player.play(track, { force: true });
      });

      socket.on('player:pause', async () => {
         const data = await validate();
         if (data?.error || !data) return;
         if (data.player.paused) return;
         data.player.pause();
      });

      socket.on('player:resume', async () => {
         const data = await validate();
         if (data?.error || !data) return;
         if (!data.player.paused) return;
         data.player.resume();
      });

      socket.on('player:next', async () => {
         const data = await validate();
         if (data?.error || !data) return;
         if (!data.player.current) return;
         const next = data.player.queue.next();
         if (next) data.player.play(next, { force: true });
      });

      socket.on('player:previous', async () => {
         const data = await validate();
         if (data?.error || !data) return;
         if (!data.player.current) return;
         const previus = data.player.queue.previous();
         if (previus) data.player.play(previus, { force: true });
      });

      socket.on('queue:repeat', async (value: 'track' | 'off' | 'queue') => {
         const data = await validate();
         if (data?.error || !data) return;
         data.player.queue.setRepeat(value);
      });

      socket.on('queue:shuffle', async (value: boolean) => {
         const data = await validate();
         if (data?.error || !data) return;
         if (!isBoolean(value)) return;
         value ? data.player.queue.shuffle() : data.player.queue.reorder();
      });

      socket.on('player:volume', async (value: number) => {
         const data = await validate();
         if (data?.error || !data) return;

         data.player.setVolume(value);
      });

      socket.on('player:seek', async (value: number) => {
         const data = await validate();
         if (data?.error || !data) return;
         data.player.seek(value);
      });
   });
};
