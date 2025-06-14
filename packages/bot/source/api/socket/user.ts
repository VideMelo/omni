import { Server, Socket } from 'socket.io';
import logger from '../../utils/logger.js';

const sockets = new Map<string, Socket>();

export default (io: Server): void => {
   io.on('connection', async (socket: any) => {
      const { default: client } = await import('../../index.js');

      socket.on('user:set', (user: string) => {
         socket.user = user;
         socket.join(user);

         logger.info(`user: ${user}, connected with socket: ${socket.id}`);

         socket.on('disconnect', () => {
            logger.info(`user ${user} disconnected.`);
         });
      });
   });
};
