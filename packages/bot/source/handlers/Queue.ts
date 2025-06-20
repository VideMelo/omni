import { Collection } from 'discord.js';
import { Playlist, Track } from './Media.js';
import Player from './Player.js';

type RepeatTypes = 'off' | 'track' | 'queue';

export default class Queue {
   public tracks: Collection<string, Track> = new Collection();
   public repeat: RepeatTypes;
   public guild: string;
   private player: Player;
   public shuffled: boolean;

   constructor(guild: string, player: Player) {
      this.guild = guild;
      this.repeat = 'off';
      this.shuffled = false;
      this.player = player;
   }

   new(item: Track | Playlist, options?: { requester?: string }) {
      if (!item) return;
      let track;
      if (item instanceof Playlist) {
         let list = { ...item, requester: options?.requester || null };
         for (let track of list.tracks) {
            track.index = this.tracks.size;
            track.requester = options?.requester || null;
            this.tracks.set(track.id, new Track(track));
         }
         return this.tracks.find((track) => track.id === list.tracks[0].id);
      } else if (item instanceof Track) {
         if (this.tracks.has(item.id)) return
         item.index = item.index ?? this.tracks.size;
         item.requester = item.requester ?? (options?.requester || null);

         this.tracks.set(item.id, item);

         track = item;
         this.player.emit('newTrack', this.player, track);
         this.player.socket();
         return track;
      }
   }

   next() {
      if (!this.player.current?.id) return;
      const current = this.tracks.get(this.player.current.id);
      if (!current) return null;
      const index = current.index;
      if (index === undefined || index === null) return null;

      if (this.repeat === 'track') return this.player.current;

      const next = this.tracks.at(index + 1) || null;
      if (!next && this.repeat === 'queue') return this.tracks.at(0) || null;

      return next;
   }

   previous() {
      if (!this.player.current) return;
      const current = this.tracks.get(this.player.current.id);
      if (!current) return null;
      const index = current.index;
      if (index === undefined || index === null) return null;

      if (this.repeat === 'track') return this.player.current;
      let previous = this.tracks.at(index - 1) || null;
      if (!previous && this.repeat === 'queue') {
         previous = this.tracks.at(this.tracks.size - 1) || null;
      }

      return previous;
   }

   get(index: number) {
      if (index < 0 || index >= this.tracks.size) return null;
      return this.tracks.at(index);
   }

   remove(index: number) {
      if (index < 0 || index >= this.tracks.size) return null;
      const track = this.tracks.at(index)!;
      this.tracks.delete(track.id);
      this.player.socket();
      return track;
   }

   clear() {
      this.tracks.clear();
      const current = this.player.current;
      if (this.player.playing && current) this.tracks.set(current.id, { index: 0, ogidx: 0, ...current });
      this.player.socket();
   }

   shuffle() {
      if (this.tracks.size < 2) return null;
      if (this.shuffled) return;
      this.tracks = this.tracks.sort(() => Math.random() - Math.random());

      let index = 0;
      this.tracks = this.tracks.mapValues((track) => {
         track.ogidx = track.index;
         track.index = index++;
         return track;
      });
      this.shuffled = true;
      this.player.socket();
      return this.tracks;
   }

   reorder() {
      if (!this.shuffled) return;
      this.tracks.sort((a, b) => {
         if (a.ogidx! < b.ogidx!) return -1;
         if (a.ogidx! > b.ogidx!) return 1;
         return 0;
      });
      this.tracks = this.tracks.mapValues((track) => {
         track.index = track.ogidx;
         track.ogidx = track.index;
         return track;
      });

      this.shuffled = false;
      this.player.socket();
      return this.tracks;
   }

   setRepeat(mode: RepeatTypes) {
      this.repeat = mode;
      this.player.socket();
   }
}
