const { PermissionFlagsBits } = require('discord.js');
const Event = require('../../handlers/Event');

class InteractionCreate extends Event {
   constructor() {
      super({ name: 'interactionCreate' });
   }

   async execute(client, interaction) {
      if (interaction.isChatInputCommand()) {
         client.interactions.process(interaction);
      }

      if (interaction.isAutocomplete()) {
         const command = client.interactions.items.get(interaction.commandName);
         if (!command) {
            client.logger.error(`No command matching ${interaction.commandName} was found.`);
            return;
         }

         try {
            await command.autocomplete({ client, interaction });
         } catch (error) {
            client.logger.error(`Error executing ${interaction.commandName}`);
            throw new Error(error);
         }
      }
   }
}

module.exports = InteractionCreate;
