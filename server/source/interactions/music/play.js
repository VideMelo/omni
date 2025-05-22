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
         option
            .setName('input')
            .setDescription('Search a music name!')
            .setRequired(true)
            .setAutocomplete(true)
      );
   }

   async autocomplete({ client, interaction }) {
      try {
         const error = client.errors.verify(interaction, {
            errors: ['userNotInVoice', 'inSameVoice'],
            respond: false,
         });
         if (error) {
            return await interaction.respond([
               {
                  name: `${error.message} Please join one to play music!`,
                  value: `403`, // ;-;
               },
            ]);
         }

         const focused = interaction.options.getFocused();
         if (!focused || client.search.isUrl(focused)) return await interaction.respond([]);

         const search = await client.search.list(focused);
         if (!search) return await interaction.respond([{ name: focused, value: focused }]);
         const tracks = search.items.map((track) => {
            const { artist, name } = track;
            const item =
               `${name} - ${artist}`.length > 100
                  ? `${name.slice(0, 100 - artist.length - 6)}... - ${artist}`
                  : `${name} - ${artist}`;
            return { name: item, value: search.type != 'track' ? focused : item };
         });

         console.log(tracks);

         await interaction.respond(tracks);
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }

   async execute({ client, context }) {
      try {
         const errors = client.errors.verify(context, {
            errors: ['userNotInVoice', 'inSameVoice'],
         });
         if (errors) return;

         const input = context.options.getString('input');

         await context.deferReply();

         const search = await client.search.list(input);
         if (!search) return await context.replyErro('No tracks found.');

         const queue = await client.initGuildQueue({
            guild: context.guild,
            voice: context.member.voice.channel,
            channel: context.channel,
         });

         const track = await queue.play(search.items[0]);
         console.log(track);

         if (!track?.name) return await context.deleteReply();

         const embed = client.embed.new({
            description: `Added  **[${track.name}](${track.metadata.url})** by **[${track.artist}](${track.metadata.url})** to queue`,
         });
         await context.editReply({
            embeds: [embed],
         });
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

module.exports = Play;
