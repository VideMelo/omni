import { Server, Socket } from 'socket.io';
import logger from '../../utils/logger.js';

const sockets = new Map<string, Socket>();

interface User {
   id: string;
   username: string;
   discriminator: string;
   avatar: string | null;
}

export default function UserSocket(socket: any) {
   socket.on('user:set', async (token: string, callback?: (user: User | null) => void) => {
      try {
         if (socket?.user || !token) return;
         const response = await fetch('https://discord.com/api/v10/users/@me', {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) throw new Error('Failed to fetch Discord user.');

         const user = (await response.json()) as User;

         socket.user = user.id;
         socket.join(user.id);

         logger.info(`user: ${user.username}, connected with socket: ${socket.id}`);

         if (callback) callback(user);
      } catch (err) {
         logger.error(`Error authenticating Discord user: ${err}`);
         if (callback) callback(null);
      }
   });
}
