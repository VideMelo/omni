import 'dotenv/config';
import fs from 'node:fs';

import {
   Client,
   Collection,
   GatewayIntentBits,
   Guild,
   VoiceBasedChannel,
   TextBasedChannel,
} from 'discord.js';

import Interactions from '../modules/Interactions.js';
import Events from '../modules/Events.js';

import Queue from '../handlers/Queue.js';

import { server, io } from '../api/index.js';
import logger from '../utils/logger.js';
import Verify from '../utils/errors.js';
import Player from '../handlers/Player.js';
import Search from '../handlers/Search.js';
import Embed from '../utils/embed.js';
import Button from '../utils/button.js';

export default class Bot extends Client {
   config: {
      token: string;
      id: string;
      port: string | number;
      spotify: {
         id: string;
         secret: string;
      };
   };
   public players: Collection<string, Player>;
   public interactions: Interactions;
   public events: Events;
   public socket: typeof io;
   public verify: Verify;
   public search: Search;
   public embed: Embed;
   public button: Button;

   constructor() {
      super({
         intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMembers,
         ],
      });

      this.config = {
         token: process.env.DISCORD_TOKEN || '',
         id: process.env.DISCORD_ID || '',
         port: process.env.PORT || 3000,
         spotify: {
            id: process.env.SPOTIFY_ID || '',
            secret: process.env.SPOTIFY_SECRET || '',
         },
      };

      this.players = new Collection();
      this.interactions = new Interactions(this);
      this.verify = new Verify();
      this.embed = new Embed();
      this.button = new Button();
      this.events = new Events(this);
      this.search = new Search(this);
      this.socket = io;
   }

   async initGuildPlayer(voice: VoiceBasedChannel, channel?: TextBasedChannel) {
      if (!voice) return;

      const existing = this.players.get(voice.guild.id);
      if (existing) return existing;

      const queue = new Player(this, {
         voice: voice.id,
         guild: voice.guild.id,
      });
      this.players.set(voice.guild.id, queue);

      await queue.connect(voice.id);
      // queue.on('disconnect', () => {
      //    this.queue.delete(guild.id);
      // });

      return queue;
   }

   async destroyGuildPlayer(guild: string) {
      const player = this.players.get(guild);
      if (!player) return;
      await player.disconnect();
      this.players.delete(guild);
   }

   override async login(token?: string): Promise<string> {
      try {
         logger.info('Started loading modules');
         await this.events.load();
         await this.interactions.load();

         const loginToken = token ?? this.config.token;
         const result = await super.login(loginToken);
         server.listen(this.config.port, () => {
            logger.done(`API is running on port: ${this.config.port}`);
         });

         return result;
      } catch (error: any) {
         logger.error('Error logging in.', error);
         throw error;
      }
   }
}
