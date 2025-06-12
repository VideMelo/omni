import Bot from '../../core/Bot.js';
import { InteractionContext } from '../../modules/Interactions.js';
import Interaction from '../../handlers/Interaction.js';

export default class Sort extends Interaction {
   constructor() {
      super({
         name: 'sort',
         description: 'Sort the queue!',
      });
   }

   async execute({ client, context }: { client: Bot; context: InteractionContext }) {
      try {
         if (client.verify.isUserNotInVoice(context)) return;
         if (client.verify.isNotInSameVoice(context)) return;
         if (client.verify.isEmptyQueue(context)) return;

         const player = client.players.get(context.guild.id);
         if (!player) return await context.replyErro('No player found for this guild!');

         player.queue.reorder();
         return await context.raw.reply('Queue sorted!');
      } catch (err: any) {
         throw new Error(err);
      }
   }
}
