import Bot from '../../core/Bot.js';
import { InteractionContext } from '../../modules/Interactions.js';
import Interaction from '../../handlers/Interaction.js';
import { AutocompleteInteraction } from 'discord.js';
import { Track } from '../../handlers/Media.js';

export default class Play extends Interaction {
   constructor() {
      super({
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

   async autocomplete({
      client,
      context,
   }: {
      client: Bot;
      context: AutocompleteInteraction<'cached'>;
   }) {
      try {
         if (client.verify.isNotInSameVoice(context) || client.verify.isUserNotInVoice(context)) {
            return await context.respond([
               {
                  name: `Please join one to play music!`,
                  value: `403`, // ;-;
               },
            ]);
         }

         const focused = context.options.getFocused();
         if (!focused || client.search.isUrl(focused)) return await context.respond([]);

         const search = await client.search.resolve(focused);
         if (!search?.items.tracks)
            return await context.respond([{ name: focused, value: focused }]);
         const tracks = search.items.tracks.map((track: any) => {
            const { artist, name } = track;
            const item =
               `${name} - ${artist.name}`.length > 100
                  ? `${name.slice(0, 100 - artist.name.length - 6)}... - ${artist.name}`
                  : `${name} - ${artist.name}`;
            return { name: item, value: item };
         });

         await context.respond(tracks);
      } catch (error: any) {
         throw new Error(error);
      }
   }

   async execute({ client, context }: { client: Bot; context: InteractionContext }) {
      try {
         if (client.verify.isUserNotInVoice(context) || client.verify.isNotInSameVoice(context))
            return;

         const input = context.raw.options.getString('input', true);

         if (!input) return;

         await context.raw.deferReply();

         let player = client.players.get(context.guild!.id);

         if (!player)
            player = await client.initGuildPlayer(context.member!.voice.channel!, context.channel!);
         if (!player) {
            return await context.replyErro(
               'An error occurred while initializing the guild player!'
            );
         }

         console.log(`Searching for: ${input}`);
         const search = await client.search.resolve(input);
         if (!search?.items.tracks) return await context.replyErro('No tracks found.');

         const track = await player.play(new Track(search.items.tracks[0])).catch(() => {
            context.replyErro('An error occurred while playing the track!');
         });
         if (!track) return context.replyErro('An error occurred while playing the track!');

         const embed = client.embed.new({
            description: `Added  **[${track.name}](${track.metadata!.url})** by **[${
               track.artist.name
            }](${track.metadata!.artist.url})** to queue`,
         });
         await context.raw.editReply({
            embeds: [embed],
         });
      } catch (error: any) {
         throw new Error(error);
      }
   }
}
