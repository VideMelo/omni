import Bot from '../../core/Bot.js';
import { InteractionContext } from '../../modules/Interactions.js';
import Interaction from '../../handlers/Interaction.js';

export default class pause extends Interaction {
   constructor() {
      super({
         name: 'pause',
         description: 'Pause current track!',
      });
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

         await context.noReply();
         player.pause();
      } catch (err: any) {
         throw new Error(err);
      }
   }
}
