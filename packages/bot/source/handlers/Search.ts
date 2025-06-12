import Bot from '../core/Bot.js';
import Spotify from './Spotify.js';
import YouTube from './Youtube.js';

type QueryType = 'searchTrack' | 'topResult' | 'searchUrl' | 'invalidQuery';
type ResultType = 'track' | 'album' | 'playlist' | 'artist' | 'searchResult' | 'topResults';

interface SearchOptions {
   type?: QueryType;
   limit?: number;
}

type SearchResultType = 'tracks' | 'albums' | 'playlists' | 'artists';
interface SearchResult {
   type: ResultType;
   items: {
      [key in SearchResultType]?: Array<any>;
   };
}

export default class Search {
   spotify: Spotify;
   youtube: YouTube;
   client: Bot;
   constructor(client: Bot) {
      this.spotify = new Spotify({
         id: client.config.spotify.id,
         secret: client.config.spotify.secret,
      });

      this.youtube = new YouTube();
      this.client = client;
   }

   async resolve(
      query: string,
      options: SearchOptions = { limit: 5 }
   ): Promise<SearchResult | undefined> {
      if (!options?.type) options.type = this.idealQueryType(query);
      if (options.type == 'invalidQuery') return;

      if (options.type == 'searchTrack') {
         const result = await this.spotify.search(query, {
            types: ['track'],
            limit: options.limit,
         });
         return {
            type: 'searchResult',
            items: result.items,
         };
      } else if (options.type == 'topResult') {
         const result = await this.spotify.getTopResults(query);
         if (!result) return;
         return {
            type: 'topResults',
            items: result,
         };
      } else if (options.type == 'searchUrl') {
         const info = this.infoUrl(query);
         if (!info) return;
         let result;
         if (info.stream === 'spotify') {
            result = await this.spotify.search(query);
            return {
               type: 'searchResult',
               items: result.items,
            };
         } else if (info.stream === 'youtube') {
            result = await this.youtube.search(query);
            return {
               type: 'searchResult',
               items: { tracks: [result] },
            };
         } else {
            return;
         }
      }
   }

   idealQueryType(query: string): QueryType {
      if (typeof query != 'string') return 'invalidQuery';
      if (this.isUrl(query)) {
         const info = this.infoUrl(query);
         if (!info) return 'invalidQuery';
         if (info.stream == 'spotify') return 'searchUrl';
         else if (info.stream == 'youtube') return 'searchUrl';
         else return 'invalidQuery';
      } else return 'searchTrack';
   }

   isUrl(url: string): boolean {
      const isUrl =
         /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/g;

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
