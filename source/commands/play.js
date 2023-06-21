const Discord = require('discord.js');

const Command = require('../managers/Command.js');

class Play extends Command {
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

   async execute({ client, interaction }) {
      try {
         const voice = interaction.guild.me?.voice;
         const channel = interaction.member?.voice?.channel;

         if (!interaction.member?.voice?.channel)
            return await interaction.replyErro('You must join a voice channel first.');

         if (voice?.channel && voice?.channel?.id != channel?.id)
            return await interaction.replyErro('You need to be on the same voice channel as me.');

         await interaction.deferReply({ ephemeral: true });

         const player = client.manager.get(interaction.guild.id);
         const input = interaction.options.getString('input');

         let search;
         try {
            search = await player.search.list(input);
         } catch (error) {
            client.log.erro(error);

            return interaction.replyErro(
               'An error occurred while searching, please try again later.'
            );
         }

         if (search) {
            if (search.type == 'search') {
               const results = search.tracks.map((result, index) => {
                  return {
                     label: `${result.name}`,
                     description: result.authors.map((author) => author.name).join(', '),
                     value: `${index}`,
                  };
               });
               const select = client.button.menu({
                  id: 'results',
                  placeholder: `Results to: ${input}`,
                  options: results,
               });
               const row = client.button.row([select]);
               const message = await interaction.editReply({
                  components: [row],
               });

               const collector = message.createMessageComponentCollector({
                  componentType: Discord.ComponentType.StringSelect,
                  time: 30000,
               });

               collector.on('collect', async (collect) => {
                  const track = search.tracks[parseInt(collect.values[0])];

                  await collect.deferReply();

                  await player.play(track, {
                     voice: interaction.member.voice.channel,
                     guild: interaction.channel.guild,
                     requester: interaction.user,
                     channel: interaction.channel,
                  });

                  await collector.stop();
                  await collect.deleteReply();
               });

               collector.on('end', async () => {
                  await interaction.deleteReply();
               });
            } else if (search.type == 'track') {
               await player.play(search.tracks[0], {
                  voice: interaction.member.voice.channel,
                  guild: interaction.channel.guild,
                  requester: interaction.user,
                  channel: interaction.channel,
               });
               await interaction.deleteReply();
            } else if (search.type == 'list') {
               await player.play(search, {
                  voice: interaction.member.voice.channel,
                  guild: interaction.channel.guild,
                  requester: interaction.user,
                  channel: interaction.channel,
               });
               await interaction.deleteReply();
            } else {
               return await interaction.replyErro('Unable to execute this command.');
            }
         } else {
            return await interaction.replyErro('No tracks found.');
         }
      } catch (error) {
         throw new Error(error);
      }
   }
}

module.exports = Play;
