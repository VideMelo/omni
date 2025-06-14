import Bot from "../../core/Bot.js";
import { Track } from "../../handlers/Media.js";
import Queue from "../../handlers/Queue.js";

import Event from "../../handlers/Event.js";
import Player from "../../handlers/Player.js";
import { TextBasedChannel, TextChannel } from "discord.js";

export default class NewTrack extends Event {
   constructor() {
      super({ name: 'newTrack' });
   }

   async execute(client: Bot, player: Player, track: Track) {
      if (!player.channel || !track.id) return;

      const color = await client.embed.color(track.thumbnail ?? '');

      const Embed = client.embed.new({
         color,
         author: {
            name: 'New track!',
         },
         thumbnail: track?.thumbnail ?? '',
         title: `${track.name.length > 36 ? `${track.name.slice(0, 36)}...` : track.name}`,
         description: `${track.artist.name}\n`,
      });

      const channel = await client.channels.fetch(player.channel)
      if (!channel?.isSendable()) return;

      await channel.send({
         embeds: [Embed],
      });
   }
}