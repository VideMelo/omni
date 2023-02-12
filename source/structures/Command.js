const { SlashCommandBuilder } = require('discord.js');

class Command extends SlashCommandBuilder {
   constructor(
      client,
      {
         name = '',
         description = '',
         exemple = '',
         usage = '',
         direct = false,
      }
   ) {
      super();

      this.setName(name);
      this.setDescription(description);
      this.setDMPermission(direct);

      this.help = { exemple, usage };

      this.execute = this.execute;
      this.autocomplete = this.autocomplete;
   }

   autocomplete({ client }) {
      client.log.erro(
         `${this.name}.js - An 'autocomplete' method is required`
      );
      throw new Error();
   }

   execute({ client }) {
      client.log.erro(
         `${this.name}.js - An 'execute' method is required`
      );
      throw new Error();
   }
}

module.exports = Command;
