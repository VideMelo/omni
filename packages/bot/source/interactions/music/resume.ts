import Bot from '../../core/Bot.js';
import { InteractionContext } from '../../modules/Interactions.js';
import Interaction from '../../handlers/Interaction.js';

export default class Resume extends Interaction {
   constructor() {
      super({
         name: 'resume',
         description: 'Resume the current song!',
      });
   }

   async execute({ client, context }: { client: Bot; context: InteractionContext }) {
      try {
         const player = client.players.get(context.guild.id);
         if (!player) return await context.replyErro('No player found for this guild!');

         if (client.verify.isUserNotInVoice(context)) return;
         if (client.verify.isNotInSameVoice(context)) return;
         if (client.verify.isEmptyQueue(context)) return;
         if (client.verify.isNotPlaying(context, player)) return;

         player.resume();
         context.noReply();
      } catch (err: any) {
         throw new Error(err);
      }
   }
}
