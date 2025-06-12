import Bot from '../../core/Bot.js';
import { InteractionContext } from '../../modules/Interactions.js';
import Interaction from '../../handlers/Interaction.js';

export default class Stop extends Interaction {
   constructor() {
      super({
         name: 'stop',
         description: 'Stop to a voice channel!',
      });
   }

   async execute({ client, context }: { client: Bot; context: InteractionContext }) {
      try {
         const player = client.players.get(context.guild.id);
         if (!player) return await context.replyErro('No player found for this guild!');

         if (client.verify.isBotNotInVoice(context)) return;
         if (client.verify.isUserNotInVoice(context)) return;
         if (client.verify.isNotInSameVoice(context)) return;
         if (client.verify.isEmptyQueue(context)) return;
         if (client.verify.isNotPlaying(context, player)) return;


         client.destroyGuildPlayer(context.guild.id);
         context.noReply();
      } catch (err: any) {
         throw new Error(err);
      }
   }
}
