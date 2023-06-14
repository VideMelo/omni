const Command = require('../source/manegers/Command.js');

class Remove extends Command {
   constructor(client) {
      super(client, {
         name: 'remove',
         description: 'Sends Pong!',
      });
   }

   async execute({ client, interaction }) {}
}

module.exports = Remove;
