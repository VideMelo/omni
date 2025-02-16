const { PermissionFlagsBits } = require('discord.js');
const Event = require('../../handlers/Event');

class VoiceStateUpdate extends Event {
   constructor() {
      super({ name: 'voiceStateUpdate' });
   }

   async execute(client, old, now) {
      client.socket.to(now.id).emit('userVoiceUpdate');
   }
}

module.exports = VoiceStateUpdate;
