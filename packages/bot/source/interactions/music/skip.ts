import Bot from '../../core/Bot.js';
import { InteractionContext } from '../../modules/Interactions.js';
import Interaction from '../../handlers/Interaction.js';

export default class Skip extends Interaction {
   constructor() {
      super({
         name: 'skip',
         description: 'Skip to a next track.',
         exemple: '4',
         usage: '[to]',
      });

      this.addIntegerOption((option) => option.setName('to').setDescription('Skip to a track'));
   }

   async execute({ client, context }: { client: Bot; context: InteractionContext }) {
      try {
         const player = client.players.get(context.guild.id);

         if (client.verify.isUserNotInVoice(context)) return;
         if (client.verify.isNotInSameVoice(context)) return;
         if (client.verify.isEmptyQueue(context)) return;
         if (!player) return await context.replyErro('No player found for this guild!');

         let index = context.raw.options.getInteger('to');
         if (index! > player.queue.tracks.size)
            return await context.replyErro("You can't skip to a track that hasn't been added yet.");

         if (index) {
            const track = player.queue.get(index);
            if (!track) return await context.replyErro('No track found at this index.');
            await player.play(track);
         } else {
            const next = player.queue.next();
            if (!next) return await context.replyErro('No next track found in the queue.');
            await player.play(next, { force: true });
         }
         return await context.raw.reply('Skipped');
      } catch (err: any) {
         throw new Error(err);
      }
   }
}
