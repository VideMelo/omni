import { ChildProcess } from 'child_process';
import ytex from 'youtube-dl-exec';
import ytsr from 'youtube-sr';
import ytdl from '@distube/ytdl-core';
import { TrackMetadata } from './Media.js';

export default class YouTube {
   urls: {
      pattern: RegExp;
      playlist: RegExp;
      video: RegExp;
   };

   private concurrencyLimit = 15;
   private activeCount = 0;
   private queue: (() => void)[] = [];

   constructor() {
      this.urls = {
         pattern: /((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu\.be))\/(watch\?v=(.+)&list=|(playlist)\?list=|watch\?v=)?([^&]+)/,
         playlist: /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu.be)?)\/(((watch\?v=)?(.+)(&|\?))?list=|(playlist)\?list=)([^&]+)/,
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
         icon: result.thumbnail?.url,
         artist: {
            name: result.channel?.name,
            id: result.channel?.id,
            url: result.channel?.url,
            icon: result.channel?.icon,
         },
      } as TrackMetadata;
   }

   private async enqueue<T>(task: () => Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
         const run = () => {
            this.activeCount++;
            task()
               .then(resolve)
               .catch(reject)
               .finally(() => {
                  this.activeCount--;
                  if (this.queue.length > 0) {
                     const next = this.queue.shift();
                     if (next) next();
                  }
               });
         };

         if (this.activeCount < this.concurrencyLimit) {
            run();
         } else {
            this.queue.push(run);
         }
      });
   }

   public getAudioStream(url: string): Promise<NodeJS.ReadableStream> {
      return this.enqueue(() => this.#getAudioStreamWithFallback(url));
   }

   #getAudioStreamWithFallback(url: string): Promise<NodeJS.ReadableStream> {
      return new Promise<NodeJS.ReadableStream>((resolve, reject) => {
         const stream = ytdl(url, {
            quality: 'highestaudio',
            filter: 'audioonly',
            highWaterMark: 1 << 25,
         });

         stream.once('error', (err) => {
            try {
               const fallback = this.#getAudioStream(url);
               resolve(fallback);
            } catch (fallbackErr) {
               reject(fallbackErr);
            }
         });
         stream.once('readable', () => resolve(stream));
      });
   }

   #getAudioStream(url: string): NodeJS.ReadableStream {
      const subprocess: ChildProcess = ytex.exec(
         url,
         {
            output: '-',
            format: 'bestaudio/best',
            audioFormat: 'opus',
            audioQuality: 0,
            quiet: true,
            noWarnings: true,
            preferFreeFormats: true,
            cookies: "C:/Users/vinic/Downloads/www.youtube.com_cookies.txt"
         },
         { stdio: ['ignore', 'pipe', 'pipe'] }
      );

      subprocess.stderr?.on('data', (chunk) => {
         console.error(`youtube-dl stderr: ${chunk}`);
      });

      subprocess.on('close', (code) => {
         if (code !== 0) {
            console.error(`youtube-dl exited with code ${code}`);
         }
      });

      subprocess.on('error', (err) => {
         console.error('Error to execute youtube-dl:', err);
      });

      if (!subprocess.stdout) {
         throw new Error('Error to create stdout subprocess');
      }

      return subprocess.stdout;
   }

   getAudioBuffer(url: string): Promise<Buffer> {
      return this.enqueue(() => this.#getAudioBuffer(url));
   }

   #getAudioBuffer(url: string): Promise<Buffer> {
      return new Promise((resolve, reject) => {
         const subprocess = ytex.exec(
            url,
            {
               output: '-',
               format: 'bestaudio/best',
               audioFormat: 'opus',
               audioQuality: 0,
               quiet: true,
            },
            { stdio: ['ignore', 'pipe', 'pipe'] }
         );

         const chunks: Buffer[] = [];
         const stdout = subprocess.stdout as NodeJS.ReadableStream;

         stdout.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
         stdout.on('error', reject);

         subprocess.on('error', reject);
         subprocess.on('close', (code) => {
            if (code === 0) resolve(Buffer.concat(chunks));
            else reject(new Error(`youtube‑dl exited with code ${code}`));
         });
      });
   }
}
