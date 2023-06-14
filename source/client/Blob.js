require('dotenv/config');

const fs = require('node:fs');

const Discord = require('discord.js');
const intents = Discord.GatewayIntentBits;

const Logger = require('../util/logger');

const Button = require('../modules/button');
const Embed = require('../modules/embed');

const Player = require('../manegers/Player');

class Blob extends Discord.Client {
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

      this.log = new Logger();

      this.button = new Button(this);
      this.embed = new Embed(this);

      this.player = new Player(this);

      this.LoadEvents();
      this.LoadCommands();

      this.LoadInteractions();
   }

   LoadEvents() {
      const files = fs.readdirSync('./source/events')
      try {
         this.log.async('Started loading events:');
         files.forEach(async (file) => {
            try {
               const Event = require(`../events/${file}`);
               const event = new Event();
               if (event.once) {
                  this.once(event.name, (...args) => event.execute(this, ...args));
               } else {
                  this.on(event.name, (...args) => event.execute(this, ...args));
               }
               this.log.info(`${file} working`);
            } catch (error) {
               this.log.erro(`${file} failed: ${error}`);
            }
         });
         this.log.done(`Successfully loaded ${files.length} events.`);
      } catch (error) {
         this.log.erro(`Error loading events.`);
         throw new Error(error);
      }
   }

   async LoadCommands() {
      const files = fs
         .readdirSync('./source/commands')
         .filter((file) => file.endsWith('.js'));
      try {
         this.log.async('Started loading commands:');
         files.forEach(async (file) => {
            try {
               const Command = require(`../commands/${file}`);
               const command = new Command(this);
               if (command.name && command.description) {
                  this.commands.set(command.name, command);
                  this.log.info(`${file} working`);
               } else {
                  this.log.warn(
                     `The command at ${file} is missing a required "name" or "descripition" property.`
                  );
               }
            } catch (error) {
               this.log.erro(`${file} failed: ${error}`);
            }
         });
         this.log.done(`Successfully loaded ${this.commands.size} commands.`);
      } catch (error) {
         this.log.erro(`Error loading commands.`);
         throw new Error(error);
      }
   }

   async LoadInteractions() {
      const rest = new Discord.REST({ version: '10' }).setToken(this.config.DISCORD_TOKEN);

      try {
         if (this.commands.size == 0) {
            this.log.erro('Could not find any command');
            throw new Error();
         }

         this.log.async(`Started loading interactions:`);
         const data = await rest.put(Discord.Routes.applicationCommands(this.config.DISCORD_ID), {
            body: this.commands.map((command) => command),
         });

         data.forEach((command) => {
            this.commands.set(command.name, {
               ...command,
               ...this.commands.get(command.name),
            });
         });

         this.log.done(`Successfully loaded ${data.length} interactions`);
      } catch (error) {
         this.log.erro(`Error loading interactions.`);
         throw new Error(error);
      }
   }

   async build() {
      try {
         this.login(this.config.DISCORD_TOKEN);
      } catch (err) {
         console.error(err);
      }
   }
}

module.exports = Blob;
