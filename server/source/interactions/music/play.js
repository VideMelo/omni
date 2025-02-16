const Discord = require('discord.js');

const Interaction = require('../../handlers/Interaction.js');

class Play extends Interaction {
   constructor(client) {
      super(client, {
         name: 'play',
         description: 'Start play a music!',
         exemple: 'Travis Scott',
         usage: '[input]',
      });

      this.addStringOption((option) =>
         option.setName('input').setDescription('Search a music name!').setRequired(true)
      );
   }

   async execute({ client, context }) {
      try {
         if (
            client.errors.verify(context, {
               errors: ['userNotInVoice', 'inSameVoice', 'botNotInVoice'],
            })
         )
            return;

         await context.deferReply({ flags: Discord.MessageFlags.Ephemeral });

         const queue = client.queue.get(context.guild.id);

         const input = context.options.getString('input');

         let search;
         try {
            search = await client.search.list(input);
         } catch (error) {
            client.logger.error(error);

            return context.replyErro('An error occurred while searching, please try again later.');
         }

         if (search) {
            if (search.type == 'search') {
               const results = search.items.map((result, index) => {
                  return {
                     label: `${result.name}`,
                     description: result.artist,
                     value: `${index}`,
                  };
               });
               const select = client.button.menu({
                  id: 'results',
                  placeholder: `Results to: ${input}`,
                  options: results,
               });
               const row = client.button.row([select]);
               const message = await context.editReply({
                  components: [row],
               });

               const collector = message.createMessageComponentCollector({
                  componentType: Discord.ComponentType.StringSelect,
                  time: 30000,
               });

               collector.on('collect', async (collect) => {
                  const track = search.items[parseInt(collect.values[0])];

                  await collect.deferReply();

                  await queue.play(track, {
                     voice: context.member.voice.channel,
                     guild: context.channel.guild,
                     requester: context.user,
                     channel: context.channel,
                  });

                  await collector.stop();
                  await collect.deleteReply();
               });

               collector.on('end', async () => {
                  await context.deleteReply();
               });
            } else if (search.type == 'track') {
               await queue.play(search.items[0], {
                  voice: context.member.voice.channel,
                  guild: context.channel.guild,
                  requester: context.user,
                  channel: context.channel,
               });
               await context.deleteReply();
            } else if (search.type == 'list') {
               await queue.play(search, {
                  voice: context.member.voice.channel,
                  guild: context.channel.guild,
                  requester: context.user,
                  channel: context.channel,
               });
               await context.deleteReply();
            } else {
               return await context.replyErro('Unable to execute this command.');
            }
         } else {
            return await context.replyErro('No tracks found.');
         }
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

module.exports = Play;
