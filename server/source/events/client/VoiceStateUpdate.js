const { PermissionFlagsBits } = require('discord.js');
const Event = require('../../handlers/Event');

class VoiceStateUpdate extends Event {
   constructor() {
      super({ name: 'voiceStateUpdate' });
   }

   async execute(client, old, now) {
      const queue = client.queue.get(now.guild.id);
      if (!queue) return;
      let members;
      if (client.user.id == now.id) {
         members = [
            ...(old?.channel?.members ?? []).map((member) => member.id),
            ...(now?.channel?.members ?? []).map((member) => member.id),
         ];

         client.socket
            .to([now.guild.id, old?.channel?.id, now?.channel?.id, ...members])
            .emit('botVoiceUpdate');

         if (old?.channel?.id && !now?.channel?.id) return queue.disconnect();
         if (old?.channel?.id && now?.channel?.id && old?.channel?.id !== now?.channel?.id)
            return queue.move(now.channel);
      }

      client.socket.to(now.id).emit('userVoiceUpdate');
   }
}

module.exports = VoiceStateUpdate;
