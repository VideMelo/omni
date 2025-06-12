import Bot from '../../core/Bot.js';
import { InteractionContext } from '../../modules/Interactions.js';
import Interaction from '../../handlers/Interaction.js';

export default class Remove extends Interaction {
   constructor() {
      super({
         name: 'remove',
         description: 'Remove a track from the queue!',
         exemple: '1',
         usage: '<index>',
      });

      this.addIntegerOption((option) =>
         option.setName('index').setDescription('Index of the track to remove').setRequired(true)
      );
   }

   async execute({ client, context }: { client: Bot; context: InteractionContext }) {
      try {
         const player = client.players.get(context.guild.id);

         if (client.verify.isUserNotInVoice(context)) return;
         if (client.verify.isNotInSameVoice(context)) return;
         if (client.verify.isEmptyQueue(context)) return;
         if (!player) return await context.replyErro('No player found for this guild!');

         const index = context.raw.options.getInteger('index');

         if (index! > player.queue.tracks.length)
            return await context.replyErro("You can't remove a track that hasn't been added yet.");

         const track = player.queue.remove(index!);
         if (track) return await context.raw.reply(`Removed \`${track.name}\` from the queue.`);
         return await context.replyErro('No track found at this index.');
      } catch (err: any) {
         throw new Error(err);
      }
   }
}
