import fs from 'node:fs';
import * as Discord from 'discord.js';
import ytdl from 'youtube-dl-exec';
import ytsr from 'youtube-sr';
import { title } from 'node:process';
import { Track, TrackMetadata } from './Media.js';

export default class YouTube {
   urls: {
      pattern: RegExp;
      playlist: RegExp;
      video: RegExp;
   };
   constructor() {
      this.urls = {
         pattern:
            /((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu\.be))\/(watch\?v=(.+)&list=|(playlist)\?list=|watch\?v=)?([^&]+)/,
         playlist:
            /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu.be)?)\/(((watch\?v=)?(.+)(&|\?))?list=|(playlist)\?list=)([^&]+)/,
         video: /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu.be)?)(\/(watch\?v=|embed\/|v\/)?)([\w\-]+)/,
      };
   }
   async search(query: string) {
      console.log(`Searching YouTube for: ${query}`);
      const result = (await ytsr.YouTube.search(query, { limit: 1, type: 'video' }))[0];
      return {
         id: result.id,
         source: 'youtube',
         url: result.url,
         name: result.title,
         duration: result.duration,
         explicit: result.nsfw,
         thumbnail: result.thumbnail?.url,
         artist: {
            name: result.channel?.name,
            id: result.channel?.id,
            url: result.channel?.url,
            icon: result.channel?.icon,
         },
      } as TrackMetadata;
   }

   getStream(url: string) {
      try {
         const stream = ytdl.exec(
            url,
            {
               output: '-',
               format: 'bestaudio/best',
               audioFormat: 'opus',
               audioQuality: 0,
               quiet: true,
            },
            { stdio: ['ignore', 'pipe', 'ignore'] }
         );

         return stream.stdout;
      } catch (err) {
         console.error(err);
      }
   }
}
