import Bot from '../../core/Bot.js';
import { InteractionContext } from '../../modules/Interactions.js';
import Interaction from '../../handlers/Interaction.js';

export default class Volume extends Interaction {
   constructor() {
      super({
         name: 'volume',
         description: 'Change the volume!',
      });

      this.addIntegerOption((option) => option.setName('volume').setDescription('Volume').setRequired(true));
   }

   async execute({ client, context }: { client: Bot; context: InteractionContext }) {
      try {
         const player = client.getGuildPlayback(context.guild.id);
         if (!player) return await context.replyErro('No player found for this guild!');

         if (client.verify.isRadio(context, player)) return;

         if (client.verify.isUserNotInVoice(context)) return;
         if (client.verify.isNotInSameVoice(context)) return;
         if (client.verify.isEmptyQueue(context)) return;
         if (client.verify.isNotPlaying(context, player)) return;

         const volume = context.raw.options.getInteger('volume')!;

         if (volume < 0 || volume > 100) return await context.replyErro('Volume must be between 0 and 100');

         player.setVolume(100);
         await context.raw.reply(`Volume: \`${volume}%\``);
      } catch (err: any) {
         throw new Error(err);
      }
   }
}
