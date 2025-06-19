import Bot from '../core/Bot.js';
import { Track } from './Media.js';
import Spotify from './Spotify.js';
import YouTube from './Youtube.js';

type SearchResultType = 'track' | 'album' | 'playlist' | 'artist' | 'search' | 'top';
type SearchType = 'track' | 'top' | 'url';

interface SearchOptions {
   type?: SearchType;
   limit?: number;
}

interface SearchResult {
   type: SearchResultType;
   items: {
      tracks?: Track[];
      playlists?: any[];
      albums?: any[];
      artists?: any[];
      top?: any;
   };
}

export default class Search {
   public spotify: Spotify;
   public youtube: YouTube;
   private client: Bot;
   constructor(client: Bot) {
      this.spotify = new Spotify({
         id: client.config.spotify.id,
         secret: client.config.spotify.secret,
      });

      this.youtube = new YouTube();
      this.client = client;
   }

   async resolve(query: string, options: SearchOptions = { limit: 5 }): Promise<SearchResult | undefined> {
      options.type ??= this.idealSearchType(query);
      if (!options.type) return;

      switch (options.type) {
         case 'track':
            const trackResult = await this.spotify.search(query, {
               types: ['track'],
               limit: options.limit,
            });
            return {
               type: 'track',
               items: { tracks: trackResult.items.tracks.map((t) => new Track(t)) },
            };
         case 'top':
            const topResult = await this.spotify.getTopResults(query);
            if (!topResult) return;
            return {
               type: 'top',
               items: { ...topResult, tracks: topResult.tracks.map((t) => new Track(t)) },
            };
         case 'url': {
            const info = this.infoUrl(query);
            if (!info) return;

            if (info.stream === 'spotify') {
               const result = await this.spotify.search(query);
               return {
                  type: 'search',
                  items: result.items,
               };
            }

            if (info.stream === 'youtube') {
               const result = await this.youtube.search(query);
               return {
                  type: 'search',
                  items: { tracks: [new Track(result)] },
               };
            }
            return;
         }
      }
   }

   idealSearchType(query: string): SearchType | undefined {
      if (typeof query != 'string') return;
      if (this.isUrl(query)) {
         const info = this.infoUrl(query);
         if (!info) return;
         if (info.stream == 'spotify') return 'url';
         else if (info.stream == 'youtube') return 'url';
         else return;
      } else return 'track';
   }

   isUrl(url: string): boolean {
      const isUrl = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/g;

      if (!url.match(isUrl)) return false;
      return true;
   }

   infoUrl(url: string): { stream: string; type: string; id: string } | null {
      if (this.spotify.urls.pattern.test(url)) {
         const match = this.spotify.urls.pattern.exec(url);
         if (!match) return null;
         return {
            stream: 'spotify',
            type: match[1],
            id: match[2],
         };
      }
      if (this.youtube.urls.pattern.test(url)) {
         url.match(this.youtube.urls.pattern);
         const match = this.youtube.urls.pattern.exec(url);
         if (!match) return null;
         return {
            stream: 'youtube',
            type: match[6] ? 'playlist' : 'track',
            id: match[7],
         };
      }
      return null;
   }
}
