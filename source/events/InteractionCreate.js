const Event = require('../structures/Event.js');
const { PermissionFlagsBits } = require('discord.js');

class InteractionCreate extends Event {
   constructor() {
      super({ name: 'interactionCreate' });
   }

   async execute(client, interaction) {
      if (interaction.isChatInputCommand()) {
         const command = client.commands.get(interaction.command.name);
         if (!command) {
            client.log.erro(
               `No command matching ${interaction.command.name} was found.`
            );
            return;
         }

         try {
            if (!interaction.appPermissions.has([
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ViewChannel,
               ])) throw new Error();
            await command.execute({ client, interaction });
         } catch (error) {
            if (interaction.replied || interaction.deferred)
               await interaction.followUp(
                  'There was an error running this command, please try later again.'
               );
            else
               await interaction.reply(
                  'There was an error running this command, please try later again.'
               );
            client.log.erro(
               `Error executing ${interaction.command.name}:`,
               error
            );
         }
      }

      if (interaction.isAutocomplete()) {
         const command = client.commands.get(interaction.command.name);
         if (!command) {
            client.log.erro(
               `No command matching ${interaction.command.name} was found.`
            );
            return;
         }

         try {
            await command.autocomplete({ client, interaction });
         } catch (error) {
            client.log.erro(
               `Error executing ${interaction.command.name}`
            );
            console.error(error);
         }
      }
   }
}

module.exports = InteractionCreate;
