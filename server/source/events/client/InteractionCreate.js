const { PermissionFlagsBits } = require('discord.js');

const Event = require('../../handlers/Event');
const Logger = require('../../utils/logger');

class InteractionCreate extends Event {
   constructor() {
      super({ name: 'interactionCreate' });
   }

   async execute(client, interaction) {
      if (interaction.isChatInputCommand()) {
         client.interactions.process(interaction)
      }

      if (interaction.isAutocomplete()) {
         const command = client.interactions.items.get(interaction.commandName);
         if (!command) {
            Logger.erro(`No command matching ${interaction.commandName} was found.`);
            return;
         }

         try {
            await command.autocomplete({ client, interaction });
         } catch (error) {
            Logger.erro(`Error executing ${interaction.commandName}`);
            throw new Error(error);
         }
      }
   }
}

module.exports = InteractionCreate;
