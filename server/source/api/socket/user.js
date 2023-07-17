const axios = require('axios');

module.exports = (io) => {
   io.on('connection', (socket) => {
      socket.on('get-user', (token, callback) => {
         console.log(`socket: ${socket.id} get-user`);
         axios
            .get('https://discord.com/api/users/@me', {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            })
            .then((response) => {
               socket.user = response.data.id;
               callback(response.data);
            })
            .catch((error) => {
               callback({ error });
               console.log(error);
            });
      });
   });
};
