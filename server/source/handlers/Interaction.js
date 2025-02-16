const { SlashCommandBuilder } = require('discord.js');

class Interaction extends SlashCommandBuilder {
   constructor(client, { name = '', description = '', exemple = '', usage = '', direct = false }) {
      super();
      this.client;

      this.setName(name);
      this.setDescription(description);
      this.setDMPermission(direct);

      this.help = { exemple, usage };

      this.execute = this.execute;
      this.autocomplete = this.autocomplete;
   }

   autocomplete() {
      this.client.logger.error(`${this.name}.js - An 'autocomplete' method is required`);
      throw new Error();
   }

   execute() {
      this.client.logger.error(`${this.name}.js - An 'execute' method is required`);
      throw new Error();
   }
}

module.exports = Interaction;
