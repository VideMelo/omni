const Command = require('../manegers/Command.js');

const Discord = require('discord.js');

class Play extends Command {
   constructor(client) {
      super(client, {
         name: 'play',
         description: 'Start play a music!',
         exemple: 'Travis Scott',
         usage: '[input]',
      });

      this.addStringOption((option) =>
         option.setName('input').setDescription('Search a music name!')
      );

      this.setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageChannels);
   }

   async execute({ client, interaction }) {
      try {
         const input = interaction.options.getString('input');
         if (!interaction.member?.voice?.channel)
            return await interaction.replyErro('You must join a voice channel first.');

         if (
            interaction.guild.members.me?.voice?.channel &&
            interaction.guild.members.me?.voice?.channel?.id !=
               interaction.member?.voice?.channel?.id
         )
            return await interaction.replyErro('You need to be on the same voice channel as me.');

         if (!input) {
            if (client.player.state == 'idle') {
               return await interaction.replyErro('There is no currently music playing.');
            } else if (client.player.state == 'playing') {
               return await interaction.replyErro('The player is already playing!');
            } else if (client.player.state == 'paused') {
               await interaction.noReply();
               return client.player.unpause();
            } else {
               return await interaction.replyErro('Unable to execute this command.');
            }
         }

         await interaction.deferReply({ ephemeral: true });

         let search;
         try {
            search = await client.player.search.list(input);
         } catch (error) {
            client.log.erro(error);
            return interaction.replyErro(
               'An error occurred while searching, please try again later.'
            );
         }

         if (search) {
            if (search.type == 'search') {
               const results = search.songs.map((result, index) => {
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
                  const song = search.songs[parseInt(collect.values[0])];

                  await collect.deferReply();

                  await client.player.play(song, {
                     guild: interaction.channel.guild.id,
                     voice: interaction.member.voice.channel.id,
                     member: interaction.user,
                     interaction,
                  });

                  await collector.stop();
                  await collect.deleteReply();
               });

               collector.on('end', async () => {
                  await interaction.deleteReply();
               });
            } else if (search.type == 'track') {
               await client.player.play(search[0] || search, {
                  guild: interaction.channel.guild.id,
                  voice: interaction.member.voice.channel.id,
                  member: interaction.user,
                  interaction,
               });
               await interaction.deleteReply();
            } else if (search.type == 'list') {
               await client.player.set(
                  interaction.channel.guild.id,
                  interaction.member.voice.channel.id,
                  interaction
               );
               await client.player.queue.new(search, {
                  member: interaction.user,
                  type: 'list',
               });
               await interaction.deleteReply();
               if (client.player.state == 'idle' || client.player.queue.current == 0) {
                  const starter = client.player.queue.list.find(
                     (song) => (song.id = search.starter)
                  );
                  return await client.player.play(starter);
               }
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
