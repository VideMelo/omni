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
         const status = Date.now();
         socket.emit('status', {
            type: 'async',
            message: 'Synchronizing with your voice channel',
            async: status,
         });

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
            if (socket?.voice) {
               socket.leave(socket?.guild);
               socket.voice = undefined;
               socket.guild = undefined;
            }
            if (typeof callback == 'function') callback();
            return socket.emit('status', {
               type: 'error',
               message: `I couldn't find you, make sure you're on a voice channel where I can see you!`,
               respond: status,
            });
         }

         const channel = member.voice.channel;
         const guild = channel.guild;
         const queue = client.queue.get(guild.id);

         if (queue?.voice)
            if (queue.voice.id !== channel.id) {
               socket.leave(socket?.guild);
               socket.voice = undefined;
               socket.guild = undefined;
               if (typeof callback == 'function') callback(); 
               return socket.emit('status', {
                  type: 'warn',
                  message: `I'm in another voice channel, on the server you're on, join to listen to music!`,
                  respond: status,
               });
            }

         if (!socket?.voice || !socket?.guild) {
            socket.join(guild.id);
            socket.guild = guild.id;
            socket.voice = channel.id;

            socket.emit('status', {
               type: 'done',
               message: queue?.voice?.id == channel.id ? `Playing in [${channel.name}]` : undefined,
               respond: status,
            });

            client.logger.info(
               `user: ${socket.user} with ${socket.id} syncVoiceChannel, guild: ${socket.guild} in voice: ${socket.voice}`
            );
            if (typeof callback == 'function') return callback();
         }
         socket.emit('status', {
            type: 'done',
            respond: status,
         });
         if (typeof callback == 'function') return callback();
      });
   });
};
