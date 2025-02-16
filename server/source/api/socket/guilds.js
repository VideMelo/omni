const axios = require('axios');
const { Collection } = require('discord.js');

module.exports = (io) => {
   io.on('connection', (socket) => {
      const client = require('../../../');

      socket.on('disconnect', () => {
         if (socket.guild) {
            client.logger.info(
               `disconnect: ${socket.guild}, user: ${socket.user} with ${socket.id}`
            );
            socket.voice = undefined;
            socket.leave(socket.guild);
         }
      });

      socket.on('joinVoiceChannel', async (id, callback) => {
         client.channels.fetch(id).then(async (channel) => {
            await client.initGuildQueue(channel.guild, channel);
            if (typeof callback == 'function') callback();
         });
      });

      socket.on('syncVoiceChannel', async (callback) => {
         if (!socket.user) {
            for (let i = 0; i != 10; i++) {
               await new Promise((resolve) => setTimeout(resolve, 1000));
               if (socket.user) break;
            }
         }

         let member = client.guilds.cache.map(async (guild) => {
            const member = await guild.members
               .fetch(socket.user)
               .catch((err) => console.error(err));
            if (member?.voice?.channel) return member;
            return null;
         });

         member = await Promise.all(member);
         member = member.filter(Boolean)[0];

         if (!member) {
            if (socket?.guild) {
               socket.leave(socket.guild)
               socket.guild = undefined;
               socket.voice = undefined 
            }
            if (typeof callback == 'function') callback();
            return socket.emit('error', 'userNotFound');
         }

         const channel = member.voice.channel;
         const guild = channel.guild;
         const queue = client.queue.get(guild.id);

         if (queue?.voice)
            if (queue.voice.id !== channel.id) {
               socket.voice = undefined;
               if (typeof callback == 'function') callback();
               return socket.emit('error', 'userNotInQueueChannel');
            }

         if (!socket?.voice || !socket?.guild) {
            socket.join(guild.id);
            socket.guild = guild.id;
            socket.voice = channel.id;

            client.logger.info(
               `user: ${socket.user} with ${socket.id} syncVoiceChannel, guild: ${socket.guild} in voice: ${socket.voice}`
            );
            await client.initGuildQueue(guild, channel)
         }
         if (typeof callback == 'function') callback();
      });
   }); 
};
