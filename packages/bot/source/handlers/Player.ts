import Bot from '../core/Bot.js';
import { Track } from './Media.js';

import fs from 'node:fs';
import { Stream } from 'node:stream';

import * as Discord from 'discord.js';
import * as Voice from '@discordjs/voice';

import type { VoiceConnection, AudioPlayer } from '@discordjs/voice';

import ffmpeg from 'ffmpeg-static';
import fluent from 'fluent-ffmpeg';

import Queue from './Queue.js';
import logger from '../utils/logger.js';
import EventEmitter from 'node:events';

interface PlayerOptions {
   voice: string;
   guild: string;
   channel?: string;
   volume?: number;
   autoplay?: boolean;
   autoleave?: boolean;
}

export default class Player extends EventEmitter {
   public client: Bot;

   public voice: string;
   public guild: string;
   public channel?: string;
   public volume: number;
   public autoplay: boolean;
   public autoleave: boolean;

   public queue: Queue;

   private connection?: VoiceConnection;
   private audioplayer?: AudioPlayer;
   private audioresource?: Voice.AudioResource;

   public playing: boolean;
   public paused: boolean;
   public buffering: boolean;

   public current?: Track;
   public metadata: any;

   public position: number;

   constructor(client: Bot, { guild, voice, channel, volume, autoplay, autoleave }: PlayerOptions) {
      super();

      this.client = client;

      this.guild = guild;
      this.voice = voice;
      this.channel = channel;
      this.volume = volume || 100;
      this.autoplay = autoplay || false;
      this.autoleave = autoleave || false;

      this.playing = false;
      this.paused = false;

      this.buffering = false;

      this.queue = new Queue(guild, this);

      this.position = 0;
   }

   public socket() {
      this.client.socket.to(this.guild).emit('player:update');
   }

   public async connect(channel: string) {
      try {
         const voice = (await this.client.channels.fetch(channel)) as Discord.VoiceBasedChannel;
         if (!voice) throw new Error('Invalid VoiceChannel');

         this.connection = Voice.joinVoiceChannel({
            channelId: voice.id,
            guildId: voice.guild.id,
            adapterCreator: voice.guild.voiceAdapterCreator,
         });
         this.voice = voice.id;

         this.metadata = {
            voice,
         };

         this.audioplayer = Voice.createAudioPlayer({
            behaviors: { noSubscriber: Voice.NoSubscriberBehavior.Play },
         });
         this.audioplayer
            .on(Voice.AudioPlayerStatus.Playing, () => {
               this.playing = true;
               this.paused = false;
               this.emit('nowPlaying', this, this.current);
               this.socket();
            })
            .on(Voice.AudioPlayerStatus.Idle, () => {
               this.playing = false;

               const next = this.queue.next();
               if (!next) return this.emit('queueEnd', this);
               this.socket();
               this.play(next);
            })
            .on(Voice.AudioPlayerStatus.Buffering, () => {
               this.playing = false;
            });
         this.socket();
      } catch (error: any) {
         logger.error(error);
      }
   }

   public disconnect() {
      if (this.connection) {
         this.connection.destroy();
         this.socket();
      }
   }

   public destroy() {}

   public async play(
      track: Track,
      metadata: { seek?: number; builded?: boolean; force?: boolean; requester?: string } = {
         seek: 0,
         builded: false,
         force: false,
      }
   ): Promise<Track | undefined> {
      try {
         if (!(track instanceof Track)) return;
         if (!this.audioplayer || !this.connection) return;
         if (this.buffering) return;
         this.buffering = true;

         track = metadata.builded ? track : await this.handleTrackData(track);
         if (this.playing || this.queue.tracks.size === 0) track = this.queue.new(track, metadata)!;
         if (this.playing) if (!metadata.seek && !metadata.force) return track;

         const stream = await this.getAudioStream(track, metadata);
         if (!stream) return;

         this.audioresource = Voice.createAudioResource(stream.opus, {
            inlineVolume: true,
            inputType: Voice.StreamType.OggOpus,
            metadata: track,
         });

         this.audioresource.volume?.setVolume(this.volume ? this.volume / 100 : 1);

         if (this.playing) this.stopAudioPlayer();
         this.audioplayer.play(this.audioresource);
         this.connection.subscribe(this.audioplayer);
         this.current = track;

         if (!track.cached) this.archiveTrackData(track, stream.opus, stream.chunks);
         this.buffering = false;
         return track;
      } catch (erro: any) {
         logger.error('error', erro);
      }
   }

   stopAudioPlayer() {
      if (!this.audioplayer) return;
      this.audioplayer.stop();
      this.playing = false;
      this.socket();
   }

   async archiveTrackData(track: Track, stream: Stream.PassThrough, chunks: Buffer[]) {
      if (!stream) return;
      const channel = (await this.client.channels.fetch(
         '1343313574898040862'
      )) as Discord.TextChannel;
      await new Promise((resolve, reject) => {
         stream.on('end', resolve);
         stream.on('error', reject);
      });

      const buffered = Buffer.concat(chunks);

      if (!channel) throw new Error('Channel not found!');

      const attachment = new Discord.AttachmentBuilder(buffered, {
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

   private async loadCachedTrack(track: Track): Promise<Track | undefined> {
      const tracks = (() => {
         try {
            return JSON.parse(fs.readFileSync('tracks.json', 'utf8'));
         } catch {
            return [];
         }
      })() as { id: string; track: Track; message: string }[];

      const cache = tracks.find((item) => item.id === track.id);
      if (!cache) return;

      const channel = (await this.client.channels.fetch(
         '1343313574898040862'
      )) as Discord.TextChannel;
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

   private async getCachedStream(url: string) {
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

   private async handleTrackData(track: Track): Promise<Track> {
      const cached = await this.loadCachedTrack(track);
      if (cached?.source === 'spotify') cached.source = 'cache';
      if (cached) return cached;

      const existing = this.queue.tracks.get(track.id);
      if (existing) if (existing.metadata?.id) return existing;

      const query = `${track.artist.name} - ${track.name} Auto-generated by YouTube`;
      const result = await this.client.search.youtube.search(query);
      if (!result) throw new Error('No search results found');

      return new Track({
         ...track,
         metadata: {
            ...result,
         },
      });
   }

   private async getAudioStream(track: Track, metadata: any = { seek: 0 }) {
      const stream = new Stream.PassThrough();
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));

      if (track.cached) {
         if (!track.streamable) {
            stream.destroy(new Error('Track is cached but has no streamable URL.'));
            return;
         }

         const streamable = await this.getCachedStream(track.streamable);
         if (streamable) streamable.pipe(stream);
         else {
            stream.destroy(new Error('Failed to create Cache Stream.'));
            return;
         }
      } else if (track.metadata?.url) {
         const streamable = this.client.search.youtube.getStream(track.metadata.url);
         if (streamable) streamable.pipe(stream);
         else {
            stream.destroy(new Error('Failed to create YouTube Stream.'));
            return;
         }
      }

      this.position = metadata.seek * 1000 || 0;
      const opus = fluent({ source: stream })
         .setFfmpegPath(ffmpeg as unknown as string)
         .format('opus')
         .seek(metadata.seek || 0)
         .on('error', (err: any) => {
            if (err instanceof Error && err?.message?.includes('Premature close')) return;
            logger.error('Erro:', err);
         });

      process.once('uncaughtException', (err: any) => {
         if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') return;
         logger.error('Uncaught Exception:', err);
         process.exit(1);
      });

      const opusStream = new Stream.PassThrough();
      opus.pipe(opusStream);

      return { opus: opusStream, chunks };
   }

   public async seek(time: number) {
      if (!this.current) return;
      await this.play(this.current!, { seek: time, builded: true });

      this.socket();
   }

   public pause() {
      if (this.audioplayer) {
         this.audioplayer.pause();
         this.paused = true;
         this.socket();
      } else {
         logger.warn('Audio player is not initialized.');
      }
   }

   public resume() {
      if (this.audioplayer) {
         this.audioplayer.unpause();
         this.paused = false;
         this.socket();
      } else {
         logger.warn('Audio player is not initialized.');
      }
   }

   public setVoiceChannel(id: string) {}
   public setTextChannel(id: string) {
      this.channel = id;
   }

   public getPosition() {
      return this.audioresource?.playbackDuration! + this.position;
   }

   public setVolume(value: number) {
      if (isNaN(value)) return;
      if (value < 0 || value > 100) return;
      if (value == this.volume) return;
      if (this.audioresource) {
         const volume = this.audioresource.volume;
         if (volume) {
            volume.setVolume(value / 100);
            this.volume = value;
            this.socket();
         } else {
            logger.warn('Audio resource volume is not set.');
         }
      }
   }

   public setAutoplay(value: boolean) {
      this.autoplay = value;
   }
   public setAutoleave(value: boolean) {
      this.autoleave = value;
   }
}
