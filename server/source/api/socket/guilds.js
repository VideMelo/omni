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
               if (typeof callback == 'function') callback(guilds);
            })
            .catch((error) => {
               if (typeof callback == 'function') callback({ error });
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
            .then(async (response) => {
               let guild = response.data;
               guild.icon = guild.icon
                  ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                  : 'https://cdn.discordapp.com/icons/826747816927428610/8ddfad8a2f50a4dda43ee437e5dfef61.png';
               guild.color = await client.embed.color(guild.icon, 'LightVibrant');
               guild.join = client.guilds.cache.get(guild.id) ? false : true;
               if (typeof callback == 'function') callback(guild);
            })
            .catch((error) => {
               if (typeof callback == 'function') callback({ error });
               console.log(error);
            });
      });

      socket.on('get-voiceChannels', (callback) => {
         console.log(
            `user: ${socket.user} with ${socket.id} get-voiceChannels, guild: ${socket.guild}`
         );

         let channels = client.guilds.cache.get(socket.guild)?.channels.cache;
         if (!channels) return;
         channels = channels
            .filter((channel) => channel.type == 2)
            .map((channel) => {
               channel.users = channel.members.map((member) => {
                  return {
                     id: member.id,
                     name: member.user.username,
                     avatar: member.user.avatarURL()?.replace('.png', '.webp'),
                  };
               });
               return {
                  id: channel.id,
                  name: channel.name,
                  size: channel.members.size,
                  users: channel.users,
               };
            });
         if (typeof callback == 'function') callback(channels);
      });

      socket.on('join-voiceChannel', (id, callback) => {
         console.log(
            `user: ${socket.user} with ${socket.id} join-voiceChannel, guild: ${socket.guild}, channel: ${id}`
         );
         const queue = client.player.get(socket.guild);
         if (!queue) return;

         const channel = client.guilds.cache.get(socket.guild)?.channels.cache.get(id);
         if (!channel) return;

         queue.connect(channel);
         if (typeof callback == 'function') callback(queue.metadata);
      });
   });
};
