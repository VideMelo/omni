const sockets = new Map();

module.exports = (io) => {
   io.on('connection', (socket) => {
      const client = require('../../..');
      socket.on('setUser', (user) => {
         socket.user = user;
         socket.join(user);

         client.logger.info(`User: ${user}, connected with socket: ${socket.id}`);

         socket.on('disconnect', () => {
            client.logger.info(`User ${user} disconnected.`);
         });
      });
   });
};
