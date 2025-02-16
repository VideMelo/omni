require('dotenv/config');

const fs = require('node:fs');

const { GatewayIntentBits, Client, Collection } = require('discord.js');
const intents = GatewayIntentBits;
const { Shoukaku, Connectors } = require('shoukaku');

const { server, io } = require('./api');

const Button = require('./utils/button');
const Embed = require('./utils/embed');
const Errors = require('./utils/errors');
const Logger = require('./utils/logger');

const Interactions = require('./modules/Interactions');
const Events = require('./modules/Events');

const Queue = require('./handlers/Queue');
const { Search } = require('./handlers/Search');

class Omni extends Client {
   constructor() {
      super({
         intents: [
            intents.Guilds,
            intents.MessageContent,
            intents.GuildMessages,
            intents.GuildVoiceStates,
            intents.GuildMembers,
         ],
      });
      this.config = {
         token: process.env.DISCORD_TOKEN,
         id: process.env.DISCORD_ID,
         port: process.env.PORT,
         spotify: {
            id: process.env.SPOTIFY_ID,
            secret: process.env.SPOTIFY_SECRET
         },
      };

      this.logger = new Logger();

      this.button = new Button(this);
      this.embed = new Embed(this);
      this.errors = new Errors(this);

      this.search = new Search(this);
      this.queue = new Collection();

      this.interactions = new Interactions(this);
      this.events = new Events(this);

      this.nodes = JSON.parse(fs.readFileSync('./source/lavalink/nodes.json')).map((node) => ({
         name: node.Name,
         url: `${node.Host}:${node.Port}`,
         auth: node.Password,
         secure: node.Secure,
      }));

      this.manager = new Shoukaku(new Connectors.DiscordJS(this), this.nodes)
         .on('ready', (name, url, ls, sl) => this.logger.done(`Lavalink Node Connected: ${name}`))
         .on('reconnecting', (name, left, timeout) =>
            this.logger.async(
               `Lavalink Node [${name}] is reconnecting. Tries Left: ${left} | Timeout: ${timeout}s`
            )
         )
         .on('disconnect', (name, moved) =>
            this.logger.warn(`Lavalink Node: [${name}] is disconnected. Moved: [${moved}]`)
         )
         .on('error', (name, error) => this.logger.erro(`Lavalink Node: ${name} threw an error.`));

      this.socket = io;
   }

   async initGuildQueue(guild, voice) {
      const existing = this.queue.get(guild.id);
      if (existing) return existing;

      const queue = new Queue(this, guild);
      this.queue.set(guild.id, queue);
      
      await queue.connect(voice);
      queue.on('disconnect', () => {
         this.queue.delete(guild.id);
      })

      return queue;
   }

   async destroyGuildQueue(guild) {
      const queue = this.queue.get(guild);
      if (!queue) return;
      await queue.disconnect();
      this.queue.delete(guild);
      return queue;
   }

   async login() {
      try {
         this.logger.info('Started loading modules')
         await this.events.load();
         await this.interactions.load();
         await super.login(this.config.DISCORD_TOKEN);
         server.listen(this.config.port, () => {
            this.logger.done(`API is running on port: ${this.config.port}`);
         });
      } catch (error) {
         this.logger.erro(`Error logging in.`, error);
      }
   }
}

module.exports = Omni;
