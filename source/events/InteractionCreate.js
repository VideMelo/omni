const Event = require('../managers/Event.js');
const { PermissionFlagsBits } = require('discord.js');

class InteractionCreate extends Event {
   constructor() {
      super({ name: 'interactionCreate' });
   }

   async execute(client, interaction) {
      if (interaction.isChatInputCommand()) {
         // i don't know why it doesn't have it by default ;-;
         interaction.noReply = async function () {
            if (interaction.deferred) return await interaction.deleteReply();
            await interaction.deferReply();
            await interaction.deleteReply();
         };

         interaction.replyErro = async function (message, options = {}) {
            const Embed = client.embed.new({
               description: message,
               color: 'BA3737',
               ...options,
            });

            try {
               if (interaction.replied || interaction.deferred)
                  await interaction.editReply({ embeds: [Embed], ephemeral: true });
               else await interaction.reply({ embeds: [Embed], ephemeral: true });
            } catch {
               await interaction.channel.send({
                  embeds: [Embed.setDescription(`<@${interaction.user.id}> - ${message}`)],
               });
            }
         };

         const command = client.commands.get(interaction.command.name);
         if (!command) {
            client.log.erro(`No command matching ${interaction.command.name} was found.`);
            return;
         }

         try {
            if (
               !interaction.appPermissions.has([
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ViewChannel,
               ])
            )
               throw new Error();
            await command.execute({ client, interaction });
         } catch (error) {
            client.log.erro(`Error executing ${interaction.command.name}:`, error);
            await interaction.replyErro(
               `What the f#@&! A very serious error occurred, try again later. \`\`\`${error}\`\`\``
            );
         }
      }

      if (interaction.isAutocomplete()) {
         const command = client.commands.get(interaction.command.name);
         if (!command) {
            client.log.erro(`No command matching ${interaction.command.name} was found.`);
            return;
         }

         try {
            await command.autocomplete({ client, interaction });
         } catch (error) {
            client.log.erro(`Error executing ${interaction.command.name}`);
            console.error(error);
         }
      }
   }
}

module.exports = InteractionCreate;
