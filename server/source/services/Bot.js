require('dotenv/config');

const Discord = require('discord.js');
const intents = Discord.GatewayIntentBits;

const fs = require('node:fs');

const Logger = require('../utils/logger');

const { server, io } = require('../api');

const Button = require('../modules/button');
const Embed = require('../modules/embed');
const Errors = require('../modules/errors');

const Player = require('../handlers/Player');

class Bot extends Discord.Client {
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
      this.config = process.env;

      this.commands = new Discord.Collection();

      this.button = new Button(this);
      this.embed = new Embed(this);
      this.errors = Errors;

      this.player = new Player(this);

      this.LoadEvents();
      this.LoadCommands();

      this.LoadInteractions();

      this.socket = io;
   }

   LoadEvents() {
      const folders = fs
         .readdirSync('./source/events')
         .filter((file) => fs.statSync(`./source/events/${file}`).isDirectory());
      try {
         Logger.async('Started loading events:');
         let length = 0;
         folders.forEach((folder) => {
            const files = fs
               .readdirSync(`./source/events/${folder}`)
               .filter((file) => file.endsWith('.js'));
            files.forEach((file) => {
               try {
                  const Event = require(`../events/${folder}/${file}`);
                  const event = new Event();
                  if (folder == 'client') {
                     this.on(event.name, (...args) => event.execute(this, ...args));
                  } else if (folder == 'player') {
                     this.player.on(event.name, (...args) => event.execute(this, ...args));
                  }
                  // Logger.info(`${file} working`);
                  length++;
               } catch (error) {
                  Logger.erro(`${file} failed: ${error}`);
               }
            });
         });
         Logger.done(`Successfully loaded ${length} events.`);
      } catch (error) {
         Logger.erro(`Error loading events.`);
         throw new Error(error);
      }
   }

   async LoadCommands() {
      const files = fs.readdirSync('./source/commands').filter((file) => file.endsWith('.js'));
      try {
         Logger.async('Started loading commands:');
         files.forEach(async (file) => {
            try {
               const Command = require(`../commands/${file}`);
               const command = new Command(this);
               if (command.name && command.description) {
                  this.commands.set(command.name, command);
                  // Logger.info(`${file} working`);
               } else {
                  Logger.warn(
                     `The command at ${file} is missing a required "name" or "descripition" property.`
                  );
               }
            } catch (error) {
               Logger.erro(`${file} failed: ${error}`);
            }
         });
         Logger.done(`Successfully loaded ${this.commands.size} commands.`);
      } catch (error) {
         Logger.erro(`Error loading commands.`);
         throw new Error(error);
      }
   }

   async LoadInteractions() {
      const rest = new Discord.REST({ version: '10' }).setToken(this.config.DISCORD_TOKEN);

      try {
         if (this.commands.size == 0) {
            Logger.erro('Could not find any command');
            throw new Error();
         }

         Logger.async(`Started loading interactions:`);
         const data = await rest.put(Discord.Routes.applicationCommands(this.config.DISCORD_ID), {
            body: this.commands.map((command) => command),
         });

         data.forEach((command) => {
            this.commands.set(command.name, {
               ...command,
               ...this.commands.get(command.name),
            });
         });

         Logger.done(`Successfully loaded ${data.length} interactions`);
      } catch (error) {
         Logger.erro(`Error loading interactions.`);
         throw new Error(error);
      }
   }

   async build() {
      try {
         await this.login(this.config.DISCORD_TOKEN);
         server.listen(this.config.PORT, () => {
            Logger.done(`API is running on port: ${this.config.PORT}`);
         });
      } catch (error) {
         Logger.erro(`Error logging in.`);
         throw new Error(error);
      }
   }
}

module.exports = Bot;
