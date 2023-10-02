const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');

const production = process.env.NODE_ENV === 'production';

const api = express();
const protocol = production ? require('https') : require('http');
const server = production
   ? protocol.createServer(
        {
           key: fs.readFileSync('key.pem'),
           cert: fs.readFileSync('cert.pem'),
        },
        api
     )
   : protocol.createServer(api);
const io = require('socket.io')(server, {
   cors: {
      origin: '*',
   },
});

api.use(bodyParser.urlencoded({ extended: true }));
api.use(bodyParser.json());

// load routes
fs.readdirSync('./source/api/routes').forEach((file) => {
   if (file.endsWith('.js')) {
      const route = require(`./routes/${file}`);
      api.use('/', route);
   }
});

fs.readdirSync('./source/api/socket').forEach((file) => {
   if (file.endsWith('.js')) {
      const event = require(`./socket/${file}`);
      event(io);
   }
});

module.exports = { server, io };
