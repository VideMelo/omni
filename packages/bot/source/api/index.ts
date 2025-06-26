import express, { Request, Response } from 'express';
import { Server, Socket } from 'socket.io';
import http from 'http';

import parser from 'body-parser';
import cors from 'cors';

import RegisterSocketHandlers from './sockets/index.js';

const api = express();
const server = http.createServer(api);
const io = new Server(server, {
   cors: {
      origin: '*',
   },
});

api.use(cors());

api.use(parser.urlencoded({ extended: true }));
api.use(parser.json());

api.get('/', (req: Request, res: Response) => {
   res.send('Servidor Express + Socket.IO em TypeScript');
});

io.on('connection', (socket: Socket) => {
   RegisterSocketHandlers(socket)
});

export { api, io, server };
