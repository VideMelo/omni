const axios = require('axios');
const { Collection } = require('discord.js');

module.exports = (io) => {
   io.on('connection', (socket) => {
      const client = require('../../../');

      socket.on('join-guild', (guild, callback) => {
         const queue = client.queue.get(guild);
         if (!queue) {
            if (typeof callback === 'function') {
               callback({ error: 'Queue not found for the specified guild.' });
            }
            return;
         }

         socket.join(guild);
         socket.guild = guild;

         client.logger.info(`join-guild: ${socket.guild}, user: ${socket.user} with ${socket.id}`);

         if (typeof callback === 'function') {
            callback({ room: guild, socket: socket.id });
         }
      });

      socket.on('leave-guild', () => {
         if (socket.guild) {
            client.logger.info(
               `leave-guild: ${socket.guild}, user: ${socket.user} with ${socket.id}`
            );
            socket.leave(socket.guild);
            delete socket.guild;
         }
      });

      socket.on('disconnect', () => {
         if (socket.guild) {
            client.logger.info(
               `disconnect: ${socket.guild}, user: ${socket.user} with ${socket.id}`
            );
            socket.leave(socket.guild);
         }
      });

      socket.on('sync-voiceChannel', async (callback) => {
         if (!socket.user) {
            for (let i = 0; i != 10; i++) {
               await new Promise((resolve) => setTimeout(resolve, 1000));
               if (socket.user) break;
            }
         }

         client.guilds.cache.forEach((guild) => {
            guild.members
               .fetch(socket.user)
               .then((member) => {
                  const channel = member?.voice?.channel;
                  if (!channel) return;
                  const guild = channel.guild.id;
                  const queue = client.queue.get(guild);
                  if (!queue?.voice || !socket?.guild) {
                     socket.join(guild);
                     socket.guild = guild;
                     socket.voice = channel.id;
                     if (!queue?.voice) {
                        client.logger.info(
                           `user: ${socket.user} with ${socket.id} sync-voiceChannel, guild: ${socket.guild} in voice: ${socket.voice}`
                        );

                        client.initGuildQueue(channel.guild, channel);
                     }
                     if (typeof callback == 'function') callback();
                  }
               })
               .catch((err) => console.error(err));
         });
      });
   });
};
