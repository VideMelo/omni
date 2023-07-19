const axios = require('axios');

module.exports = (io) => {
   io.on('connection', (socket) => {
      const client = require('../../../');

      socket.on('join-guild', ({ guild }, callback) => {
         const queue = client.player.get(guild);
         if (!queue) return;

         socket.join(guild);
         socket.guild = guild;
         console.log(`join-guild: ${socket.guild}, user: ${socket.user} with ${socket.id}`);

         if (typeof callback == 'function') callback({ room: guild, socket: socket.id });

         socket.on('disconnect', () => {
            socket.leave(socket.guild);
         });

         socket.on('leave-guild', () => {
            console.log(`leave-guild: ${socket?.guild} - ${socket?.user} - ${socket.id}`);
            socket.leave(socket.guild);
         });
      });

      socket.on('get-guilds', (token, callback) => {
         console.log(`user: ${socket.user} with ${socket.id}, get-guilds`);
         axios
            .get('https://discord.com/api/users/@me/guilds', {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            })
            .then(async (response) => {
               let guilds = await response.data
                  .filter((guild) => guild.permissions & 32)
                  .map(async (guild) => {
                     guild.icon = guild.icon
                        ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                        : 'https://cdn.discordapp.com/icons/826747816927428610/8ddfad8a2f50a4dda43ee437e5dfef61.png';
                     guild.color = await client.embed.color(guild.icon, 'LightVibrant');
                     guild.join = client.guilds.cache.get(guild.id) ? false : true;
                     return guild;
                  });
               guilds = await Promise.all(guilds);
               guilds = guilds.sort((a, b) => (a.join === b.join ? 0 : a.join ? 1 : -1));
               callback(guilds);
            })
            .catch((error) => {
               callback({ error });
               console.log(error);
            });
      });

      socket.on('get-guild', (id, callback) => {
         console.log(`user: ${socket.user} with ${socket.id} get-guild, guild: ${id}`);
         axios
            .get(`https://discord.com/api/guilds/${id}`, {
               headers: {
                  Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
               },
            })
            .then((response) => {
               callback(response.data);
            })
            .catch((error) => {
               callback({ error });
               console.log(error);
            });
      });
   });
};
