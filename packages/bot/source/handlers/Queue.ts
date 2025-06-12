import { Collection } from 'discord.js';
import { Playlist, Track } from './Media.js';

type RepeatTypes = 'off' | 'track' | 'queue';

export default class Queue {
   public tracks: Track[] = [];
   public repeat: RepeatTypes;
   public guild: string;
   constructor(guild: string) {
      this.guild = guild;
      this.repeat = 'off';
   }

   new(item: Track | Playlist, options?: { requester?: string }) {
      if (!item) return;
      let track;
      if (item instanceof Playlist) {
         let list = { ...item, requester: options?.requester || null };
         for (let track of list.tracks) {
            track.index = this.tracks.length;
            track.requester = options?.requester || null;
            this.tracks.push(track);
         }
         track = this.tracks.find((track) => track.id === list.tracks[0].id);
      } else if (item instanceof Track) {
         item.index = this.tracks.length;
         item.requester = options?.requester || null;
         this.tracks.push(item);

         track = item;
      }
      return track;
   }

   next(track: Track) {
      const index = this.tracks.indexOf(track);
      if (index === -1) return null;

      if (this.repeat === 'track') return track;

      const next = this.tracks[index + 1] || null;
      if (!next && this.repeat === 'queue') return this.tracks[0] || null;

      return next;
   }

   previous(track: Track) {
      const index = this.tracks.indexOf(track);
      if (index === -1) return null;

      if (this.repeat === 'track') return track;

      let previous = this.tracks[index - 1] || null;
      if (!previous && this.repeat === 'queue') {
         previous = this.tracks[this.tracks.length - 1] || null;
      }

      return previous;
   }

   get(index: number) {
      if (index < 0 || index >= this.tracks.length) return null;
      return this.tracks[index];
   }

   remove(index: number) {
      if (index < 0 || index >= this.tracks.length) return null;
      const track = this.tracks.splice(index, 1)[0];
      return track;
   }

   clear() {
      this.tracks = [];
   }

   shuffle() {
      if (this.tracks.length < 2) return null;
      let shuffled = this.tracks.sort(() => Math.random() - 0.5);
      this.tracks = shuffled.map((track, index) => {
         track.ogidx = track.index;
         track.index = index;
         return track;
      });
      return this.tracks;
   }

   reorder() {
      let reordered = this.tracks.sort((a, b) => {
         if (a.ogidx! < b.ogidx!) return -1;
         if (a.ogidx! > b.ogidx!) return 1;
         return 0;
      });

      this.tracks = reordered.map((track, index) => {
         track.index = index;
         return track;
      });
      return this.tracks;
   }

   setRepeat(mode: RepeatTypes) {
      this.repeat = mode;
   }
}
