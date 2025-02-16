const axios = require('axios');

module.exports = (io) => {
   io.on('connection', (socket) => {
      const client = require('../../..');
      socket.on('set-user', (user) => {
         client.logger.info(`user: ${user.id} connected whit socket: ${socket.id}`);
         socket.user = user.id;
      });
   });
};
