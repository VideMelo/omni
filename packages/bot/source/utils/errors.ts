import { AutocompleteInteraction } from 'discord.js';
import type { InteractionContext } from '../modules/Interactions.js';
import Player from '../handlers/Player.js';

type ErrorType =
   | 'userNotInVoice'
   | 'botNotInVoice'
   | 'alreadyInVoice'
   | 'inSameVoice'
   | 'emptyQueue'
   | 'notPlaying';

type Interaction = InteractionContext | AutocompleteInteraction<'cached'>;

interface ErrorResult {
   type: ErrorType;
   message: string;
}

class Verify {
   constructor(private readonly respond: boolean = true) {}

   private shouldRespond(interaction: Interaction): interaction is InteractionContext {
      return !(interaction instanceof AutocompleteInteraction) && this.respond;
   }

   private handle(
      condition: boolean,
      interaction: Interaction,
      message: string,
      type: ErrorType
   ): ErrorResult | undefined {
      if (!condition) return undefined;

      if (this.shouldRespond(interaction)) {
         interaction.replyErro(message);
      }

      return { type, message };
   }

   isUserNotInVoice(interaction: Interaction) {
      const condition = !!interaction && !!interaction.member && !interaction.member.voice?.channel;

      return this.handle(
         condition,
         interaction,
         'You must join a voice channel first.',
         'userNotInVoice'
      );
   }

   isBotNotInVoice(interaction: Interaction) {
      const condition = !interaction.guild?.members.me?.voice?.channel;

      return this.handle(condition, interaction, 'I must join a voice channel first.', 'botNotInVoice');
   }

   isAlreadyInVoice(interaction: Interaction) {
      const condition = !!interaction.guild?.members.me?.voice?.channel;

      return this.handle(
         condition,
         interaction,
         'I am already connected to a voice channel.',
         'alreadyInVoice'
      );
   }

   isNotInSameVoice(interaction: Interaction) {
      const botChannel = interaction.guild?.members.me?.voice?.channel;
      const userChannel = interaction.member?.voice?.channel;

      const condition = !!botChannel && !!userChannel && botChannel.id !== userChannel.id;

      return this.handle(
         condition,
         interaction,
         'You need to be in the same voice channel as me.',
         'inSameVoice'
      );
   }

   isNotPlaying(interaction: Interaction, player: Player) {
      const condition = !player.playing

      return this.handle(
         condition,
         interaction,
         'The player is not currently playing any track.',
         'notPlaying'
      );
   }

   isEmptyQueue(interaction: Interaction) {
      if (interaction instanceof AutocompleteInteraction) return;

      const condition = !interaction.queue?.tracks?.length;

      return this.handle(condition, interaction, 'There are no tracks in the queue.', 'emptyQueue');
   }
}

export default Verify;
