const { SlashCommandBuilder } = require('discord.js');
const Logger = require('../utils/logger');
const Discord = require('discord.js');
const { PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');

class Interactions {
   constructor(client) {
      this.client = client;
      this.items = new Discord.Collection();
   }

   async load() {
      const folders = fs
         .readdirSync('./source/interactions')
         .filter((file) => fs.statSync(`./source/interactions/${file}`).isDirectory());
      try {
         this.client.logger.async('Started loading interactions:');
         let length = 0;
         folders.forEach((folder) => {
            const files = fs
               .readdirSync(`./source/interactions/${folder}`)
               .filter((file) => file.endsWith('.js'));
            files.forEach((file) => {
               try {
                  const Interaction = require(`../interactions/${folder}/${file}`);
                  const interaction = new Interaction(this);
                  if (interaction.name && interaction.description) {
                     this.items.set(interaction.name, interaction);
                     // this.client.logger.info(`${file} working`);
                  } else {
                     this.client.logger.warn(
                        `The interaction at ${file} is missing a required "name" or "descripition" property.`
                     );
                  }
               } catch (error) {
                  this.client.logger.error(`${file} failed: ${error}`);
               }
            });
         });
         this.client.logger.done(`Successfully loaded ${this.items.size} interactions.`);
         this.deploy();
      } catch (error) {
         this.client.logger.error(`Error loading intrecations.`, error);
         throw new Error(error);
      }
   }

   async deploy() {
      const rest = new Discord.REST({ version: '10' }).setToken(this.client.config.token);

      try {
         if (this.items.size == 0) {
            this.client.logger.error('Could not find any command');
            throw new Error();
         }

         this.client.logger.async(`Started deploying interactions:`);
         const data = await rest.put(Discord.Routes.applicationCommands(this.client.config.id), {
            body: this.items.map((interaction) => interaction),
         });

         data.forEach((interaction) => {
            this.items.set(interaction.name, {
               ...interaction,
               ...this.items.get(interaction.name),
            });
         });

         this.client.logger.done(`Successfully deployed ${data.length} interactions.`);
      } catch (error) {
         this.client.logger.error(`Error loading interactions.`, error);
      }
   }

   async process(interaction) {
      const context = new InteractionContext(this.client, interaction);
      if (interaction.isChatInputCommand()) {
         const command = this.items.get(interaction.commandName);
         if (!command) {
            this.client.logger.error(`No command matching ${interaction.commandName} was found.`);
            return;
         }

         try {
            if (
               !interaction.appPermissions.has([
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ViewChannel,
               ])
            )
               throw new Error('No prmissions!');
            await command.execute({ client: this.client, context });
         } catch (error) {
            this.client.logger.error(`Error executing ${interaction.commandName}:`, error);
            await context.replyErro(
               `What the f#@&! A very serious error occurred, try again later. \`\`\`${error}\`\`\``
            );
         }
      }
   }
}

class InteractionContext {
   constructor(client, interaction) {
      this.client = client;
      this.interaction = interaction;

      return new Proxy(this, {
         get: (target, prop) => {
            if (prop in target) {
               return target[prop];
            } else {
               return this.interaction[prop];
            }
         },
      });
   }

   get user() {
      return this.interaction.user;
   }

   get member() {
      return this.interaction.guild?.members.cache.get(this.user?.id);
   }

   get me() {
      return this.interaction.guild?.members.me || undefined;
   }

   get queue() {
      return this.client.queue.get(this.interaction.guild.id);
   }

   async noReply() {
      if (this.interaction.deferred) return await this.interaction.deleteReply();
      await this.interaction.deferReply();
      await this.interaction.deleteReply();
   }

   async replyErro(message) {
      const Embed = this.client.embed.new({
         description: message,
         color: '#BA3737',
      });

      try {
         if (this.interaction.replied || this.interaction.deferred)
            await this.interaction.editReply({
               embeds: [Embed],
               flags: Discord.MessageFlags.Ephemeral,
            });
         else
            await this.interaction.reply({
               embeds: [Embed],
               flags: Discord.MessageFlags.Ephemeral,
            });
      } catch {
         await this.interaction.channel.send({
            embeds: [Embed.setDescription(`<@${this.interaction.user.id}> + ${message}`)],
         });
      }
   }
}

module.exports = Interactions;
