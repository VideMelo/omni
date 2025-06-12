import Bot from '../../core/Bot.js';
import { InteractionContext } from '../../modules/Interactions.js';
import Interaction from '../../handlers/Interaction.js';

export default class Shuffle extends Interaction {
   constructor() {
      super({
         name: 'shuffle',
         description: 'Shuffle the queue!',
      });
   }

   async execute({ client, context }: { client: Bot; context: InteractionContext }) {
      try {
         const player = client.players.get(context.guild.id);

         if (client.verify.isUserNotInVoice(context)) return;
         if (client.verify.isNotInSameVoice(context)) return;
         if (client.verify.isEmptyQueue(context)) return;
         if (!player) return await context.replyErro('No player found for this guild!');

         player.queue.shuffle();
         return await context.raw.reply('Queue shuffled!');
      } catch (err: any) {
         throw new Error(err);
      }
   }
}
