const Interaction = require('../../handlers/Interaction.js');

class Help extends Interaction {
   constructor(client) {
      super(client, {
         name: 'help',
         description: 'Shows help info and commands.',
         exemple: 'play',
         usage: '[command]',
         direct: true,
      });

      this.addStringOption((option) =>
         option.setName('command').setDescription('Command name for help.').setAutocomplete(true)
      );
   }

   async autocomplete({ client, context }) {
      const commands = client.interactions.items.map((command) => command);

      const focused = context.options.getFocused();
      const choices = commands.map((command) => command.name);
      const filtered = choices.filter((choice) => choice.startsWith(focused));
      await context.respond(filtered.map((choice) => ({ name: choice, value: choice })));
   }

   async execute({ client, context }) {
      try {
         const input = context.options.getString('command');
         if (input) {
            const command = client.interactions.items.find((command) => command.name == input);
            if (command) {
               const usage = command.help.usage
                  ? `\n**Usage**\n</${command.name}:${command.id}> \`${command.help.usage}\`\n`
                  : '';
               const exemple = command.help.exemple
                  ? `\n**Exemple**\n</${command.name}:${command.id}> \`${command.help.exemple}\``
                  : '';

               const embed = client.embed.new({
                  author: {
                     name: `${client.user.username} Help!`,
                     iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.jpeg`,
                  },
                  title: `/${command.name}`,
                  description: `${command.description}${usage}${exemple}`,
                  thumbnail: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.jpeg`,
               });
               return await context.reply({
                  embeds: [embed],
               });
            } else {
               return await context.replyErro(`Command ${input} not found!`);
            }
         }

         const commands = client.interactions.items.map((command) => command);

         const list = commands
            .filter((command) => command.name != this.name)
            .map((command) => {
               const usage = command.help.usage ? ` \`${command.help.usage}\`` : '';

               return `</${command.name}:${command.id}>${usage}\n${command.description}`;
            });

         const pages = client.embed.pages(list);

         const help = commands.find((command) => (command.name = this.name));

         const embeds = pages.map((message, index) => {
            return client.embed.new({
               author: {
                  name: `${client.user.username} Help!`,
                  iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.jpeg`,
               },
               thumbnail: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.jpeg`,
               description: `Want info about a specific command?\n</${help.name}:${help.id}> \`[command]\``,
               fields: [{ name: 'COMMANDS', value: pages[index] }],
            });
         });

         await client.button.pagination({
            interaction: context,
            pages: embeds,
         });
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

module.exports = Help;
