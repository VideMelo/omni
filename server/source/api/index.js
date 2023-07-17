const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');

const api = express();
const http = require('http');
const server = http.createServer(api);
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
      api.use(route);
   }
});

fs.readdirSync('./source/api/socket').forEach((file) => {
   if (file.endsWith('.js')) {
      const event = require(`./socket/${file}`);
      event(io);
   }
});

module.exports = { server, io };
