/*
 * This saves the data of the songs the bot has already played
 * in a text channel you choose — like on a dev server, for example —
 * so it doesn’t have to download them from YouTube again.
 *
 * If you’re planning to run the bot in production, pick a private channel
 * where only the bot can access.
 *
 * Soon I’ll drop a link to a public channel where multiple bots
 * can share their played songs data.
 *
 * If you’re reading this, yeah… we’re not there yet.
 */

import fs from 'node:fs';
import Stream from 'stream';

import { Track } from './Media.js';
import { AttachmentBuilder, TextChannel } from 'discord.js';

import Bot from '../core/Bot.js';
import logger from '../utils/logger.js';

export default class Cache {
   private client: Bot;
   public channel: string;
   constructor(client: Bot, channel: string) {
      this.client = client;
      this.channel = channel;
   }

   async archive(track: Track, stream: Stream.PassThrough, chunks: Buffer[]) {
      if (!stream) return;
      const channel = (await this.client.channels.fetch(this.channel)) as TextChannel;
      await new Promise((resolve, reject) => {
         stream.on('end', resolve);
         stream.on('error', reject);
      });

      const buffered = Buffer.concat(chunks);

      if (!channel) throw new Error('Channel not found!');

      const attachment = new AttachmentBuilder(buffered, {
         name: `${track.id}.opus`,
      });
      const message = await channel.send({
         content: `${track.name} - ${track.artist.name}`,
         files: [attachment],
      });

      const data = {
         id: track.id,
         track: {
            ...track,
            source: 'cache',
         },
         message: message.id,
      };

      const file = 'tracks.json';
      try {
         const json = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
         fs.writeFileSync(file, JSON.stringify([...json, data], null, 2));
      } catch (error: any) {
         logger.error('Erro:', error);
      }
   }

   public async getTrackData(track: Track): Promise<Track | undefined> {
      const tracks = (() => {
         try {
            return JSON.parse(fs.readFileSync('tracks.json', 'utf8'));
         } catch {
            return [];
         }
      })() as { id: string; track: Track; message: string }[];

      const cache = tracks.find((item) => item.id === track.id);
      if (!cache) return;

      const channel = (await this.client.channels.fetch(this.channel)) as TextChannel;
      if (!channel) return;

      const message = await channel.messages.fetch(cache.message);
      const url = message.attachments.first()?.url;
      if (!url) return;
      return new Track({
         ...cache.track,
         cached: true,
         streamable: url,
      });
   }

   public async getAudioStream(url: string) {
      if (url?.includes('.opus')) {
         const response = await fetch(url).catch((err) => {
            logger.error('Error fetching audio:', err);
            return undefined;
         });

         if (!response || !response.body) {
            logger.error('No response or response body when fetching audio.');
            return;
         }

         const reader = response.body.getReader();
         const nodeStream = new Stream.Readable({
            async read() {
               const { done, value } = await reader.read();
               if (done) this.push(null);
               else this.push(Buffer.from(value));
            },
         });

         return nodeStream;
      }
   }

   encode() {
      
   }
}
