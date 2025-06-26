import GuildSocket from './guilds.js';
import UserSocket from './user.js';
import PlayerSocket from './player.js';

import { Socket } from 'socket.io';

export interface SocketData extends Socket {
   user?: string;
   guild?: string;
   voice?: string;
   warns?: number;
}

export default function RegisterSocketHandlers(socket: SocketData) {
   GuildSocket(socket);
   UserSocket(socket);
   PlayerSocket(socket);
}
