import fs from 'node:fs';
import express from 'express';
import bodyParser from 'body-parser';
import { createServer as createHTTPServer } from 'http';
import { createServer as createHTTPSServer } from 'https';
import { Server as SocketIOServer } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const production = process.env.NODE_ENV === 'production';

const api = express();

const server = production
   ? createHTTPSServer(
        {
           key: fs.readFileSync(path.join(__dirname, 'key.pem')),
           cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
        },
        api
     )
   : createHTTPServer(api);

const io = new SocketIOServer(server, {
   cors: {
      origin: '*',
   },
});

api.use(bodyParser.urlencoded({ extended: true }));
api.use(bodyParser.json());

const routesPath = path.join(__dirname, 'routes');
fs.readdirSync(routesPath).forEach((file) => {
   if (file.endsWith('.ts')) {
      import(`./routes/${file}`).then((routeModule) => {
         api.use('/', routeModule.default || routeModule);
      });
   }
});

const socketsPath = path.join(__dirname, 'socket');
fs.readdirSync(socketsPath).forEach((file) => {
   if (file.endsWith('.ts')) {
      import(`./socket/${file}`).then((socketModule) => {
         const handler = socketModule.default || socketModule;
         handler(io);
      });
   }
});

export { server, io };
