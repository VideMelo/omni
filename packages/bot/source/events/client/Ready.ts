import Bot from '../../core/Bot.js';
import * as Discord from 'discord.js';

import Event from '../../handlers/Event.js';
import logger from '../../utils/logger.js';

export default class ClientReady extends Event {
   constructor() {
      super({ name: 'ready' });
   }

   async execute(client: Bot, event: Discord.Client) {
      await client.application!.commands.fetch();

      client.user!.setPresence({
         activities: [{ name: 'Music!', type: 2 }],
      });

      logger.info(`Ready! Logged in as: ${event.user!.username}`);
   }
}
