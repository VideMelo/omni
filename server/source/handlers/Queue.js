const Discord = require('discord.js');
const {
   createAudioResource,
   createAudioPlayer,
   joinVoiceChannel,
   AudioPlayerStatus,
} = require('@discordjs/voice');

const ytdl = require('ytdl-core');

const fluentFfmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

const { Stream } = require('stream');

const { Result } = require('./Search');
const Track = require('./Track');

class Queue {
   constructor(client, player, guild) {
      this.node = player;
      this.client = client;

      this.player = createAudioPlayer();

      this.list = new Discord.Collection();
      this.current = { index: 0 };

      this.state = 'idle';
      this.metadata = {
         voice: null,
         channel: null,
         connection: null,
         guild,
      };
      this.config = {
         repeat: 'off', // Repeat the queue (off, track, queue)
         shuffle: false, // Shuffle the queue
         volume: 0.5,
      };

      this.duration = 0;
      this.time = 'no time';

      this.player.on(AudioPlayerStatus.Idle, () => {
         this.client.socket.to(this.metadata.guild.id).emit('update-player');
         this.state = 'idle';
         if (this.end()) {
            this.player.stop();
            this.list.clear();

            this.current = { index: 0 };
            this.metadata.connection.destroy();

            this.node.emit('queueEnd', this);
            return;
         }
         this.play(this.next(), { state: 'update', emit: true });
      });

      this.player.on(AudioPlayerStatus.Playing, () => {
         this.state = 'playing';
      });
   }

   /**
    * Connect to voice channel
    * @param {Discord.VoiceChannel} voice - Voice channel
    * @returns {Discord.VoiceConnection}
    */
   connect(voice) {
      const connection = joinVoiceChannel({
         channelId: voice.id,
         guildId: voice.guild.id,
         adapterCreator: voice.guild.voiceAdapterCreator,
      });
      this.data({ connection, voice });
      this.client.socket.to(this.metadata.guild.id).emit('update-player');
      return connection;
   }

   disconnect() {
      this.metadata.connection.destroy();
   }

   /**
    * Set queue metadata
    * @param {Discord.VoiceChannel} metadata.connection - Voice channel
    * @returns {Object} Metadata
    */
   data(metadata) {
      return (this.metadata = {
         ...this.metadata,
         ...metadata,
      });
   }

   /**
    * Play a track
    * @param {Track|Result|string} track The track to play
    * @param {object} metadata The metadata
    * @param {string} metadata.state The state of the player
    * @param {Discord.GuildMember} metadata.requester The member who requested the track
    * @param {Discord.TextChannel} metadata.channel The channel where the track was requested
    * @param {Discord.Message} metadata.message The message where the track was requested
    * @param {Discord.VoiceChannel} metadata.channel The voice channel where the track was requested
    * @param {Discord.Guild} metadata.guild The guild where the track was requested
    * @example
    * queue.play('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
    *   voice: message.member.voice.channel,
    *   requester: message.member,
    *   channel: message.channel,
    *   message: message,
    * });
    */
   async play(track, metadata = {}) {
      try {
         // Check if the track is valid
         if (!track) return;
         if (track instanceof Result) track = track.type == 'search' ? track.tracks[0] : track;
         if (track instanceof Object && track.type == 'track') track = new Track(track);
         if (track instanceof Track)
            if (!track?.url) track.set({ url: await this.node.search.getUrl(track) });
         if (typeof track == 'string') {
            const search = await this.node.search.track(track);
            track = search.tracks[0];
         }

         let state = metadata?.state || this.state; // set state

         // Add the queue only if the state is different from "update"
         if (state != 'update') {
            this.data({ ...metadata, connection: this.connect(metadata.voice) });
            track = this.new(track, {
               requester: metadata?.requester,
               type: track?.type,
            });
         }

         if (state == 'playing') return; // If the state is playing, return

         if (!track?.url) track.set({ url: await this.node.search.getUrl(track) }); // Set the track url if not defined

         if (!track?.builded) {
            const info = await ytdl.getInfo(track.url); // Get the video info
            track.set({ duration: info.videoDetails.lengthSeconds * 1000, builded: true }); // Set the track duration
         }

         // Create a new stream with the track url
         const stream = await ytdl(track.url, {
            highWaterMark: 1 << 25,
            filter: 'audioonly',
            quality: 'highestaudio',
         });

         let seek = metadata?.seek / 1000 || 0; // if seek is not defined, set to 0

         const bufferStream = new Stream.PassThrough(); // buffer the stream

         // Edit the stream
         const reStream = fluentFfmpeg({ source: stream })
            .setFfmpegPath(ffmpegPath)
            .format('opus')
            .seekInput(seek)
            .on('error', (err) => {
               if (err instanceof Error && err?.message?.includes('Premature close')) return;
               console.error(err);
            })
            .stream(bufferStream);

         // Create a new resource with the edited stream
         const resource = createAudioResource(reStream, {
            inlineVolume: true,
         });

         resource.volume.setVolume(this.config.volume); // Set the volume
         this.metadata.connection.subscribe(this.player); // Subscribe connection to the manager
         this.player.play(resource); // Play the resource

         track.set({ position: seek * 1000 }); // Set the track position
         this.current = track; // Set the current track

         if (state != 'update' || metadata?.emit) {
            this.node.emit('playing', this, this.current); // Emit playing event
            this.client.socket.to(this.metadata.guild.id).emit('update-player'); // Emit playing event to socket
         }
         this.state = 'playing'; // Set the state to playing
      } catch (erro) {
         throw new Error(erro);
      }
   }

   /**
    * Set a new track in queue
    * @param {Result | Track} body - Track or Serach Result
    * @param {Object} options - Options
    * @returns {Track} Track added
    */
   new(body, options = {}) {
      if (!body instanceof Track && !body instanceof Result) return;
      if (body instanceof Object && body.type == 'track') body = new Track(body);
      let track;
      if (options.type == 'list' || body.type == 'list') {
         body = { ...body, requester: options?.requester };
         body.items.forEach((track) => {
            track.set({
               index: this.list.size + 1,
               order: this.list.size + 1,
               requester: options?.requester,
            });
            this.list.set(this.list.size + 1, track);
         });
         this.node.emit('newList', this, body.data);
         track = this.list.find((track) => body.starter == track.id);
      } else if (options.type == 'track' || options.type == 'search' || body.type == 'track') {
         body.set({
            index: this.list.size + 1,
            order: this.list.size + 1,
            requester: options?.requester,
         });
         this.list.set(this.list.size + 1, body);
         this.node.emit('newTrack', this, body);
         track = body;
      }

      this.update();
      this.client.socket.to(this.metadata.guild.id).emit('update-player');
      return track;
   }

   /**
    * Next track in queue
    * @param {boolean} force - Force next track if in repeat mode
    * @returns {boolean | Track} null if queue is empty, Track if queue is not empty
    */
   next(force = false) {
      if (this.end()) return null;
      if (this.config.repeat == 'track' && !force) return this.current;
      if (this.current.index == this.list.size) {
         if (this.config.repeat == 'queue') {
            if (this.config.shuffle) {
               this.shuffle(true);
            }
            return this.list.get(1);
         }
      }
      return this.list.get(this.current.index + 1);
   }

   previous() {
      if (this.end()) return null;
      if (this.current.index == 1) {
         if (this.config.repeat == 'queue') {
            return this.list.get(this.list.size);
         }
      }
      return this.list.get(this.current.index - 1);
   }

   /**
    *
    * @param {number} index - Track index to skip
    * @returns {Track} Track skipped
    */
   skip(index) {
      return this.list.get(index);
   }

   /**
    * Remove track from queue
    * @param {number} index - Track index to remove
    * @returns {Track} Track removed
    */
   remove(index) {
      const track = this.list.get(index);
      this.list.delete(index);
      this.update();
      return track;
   }

   clear() {
      this.list.clear();
      this.current.index = 1;
      this.list.set(1, this.current);
      this.tim;
   }

   /**
    * Shuffle queue
    * @param {boolean} repeat - if true, the current track will be added to the first queue position
    * @returns {Discord.Collection} list of tracks
    */
   shuffle(repeat = true) {
      if (repeat) {
         this.list.delete(this.current.index);
         this.current.index = 1;
      }

      const tracks = this.list.map((track) => track);
      this.list.clear();

      if (repeat) this.list.set(1, this.current);

      tracks.sort(() => Math.random() - 0.5);
      tracks.forEach((track) => {
         track.index = this.list.size + 1;
         this.list.set(this.list.size + 1, track);
      });
      this.config.shuffle = true;
      this.client.socket.to(this.metadata.guild.id).emit('update-player');
      return this.list;
   }

   order() {
      const tracks = this.list.map((track) => track);
      this.list.clear();

      tracks.sort((a, b) => a.order - b.order);
      tracks.forEach((track) => {
         this.list.set(this.list.size + 1, track);
      });
      this.update();
      this.config.shuffle = false;
      this.client.socket.to(this.metadata.guild.id).emit('update-player');
      return this.list;
   }

   /**
    * Update queue
    * @returns {Discord.Collection} list of tracks
    */
   update() {
      const tracks = this.list.map((track) => track);
      this.list.clear();
      tracks.forEach((track) => {
         track.index = this.list.size + 1;
         this.list.set(this.list.size + 1, track);
      });
      this.duration = this.list.reduce((acc, track) => acc + track.duration, 0);
      this.time = this.MStoHMS(this.duration);
      return this.list;
   }

   /**
    * Check if queue is empty
    * @returns {boolean} true if queue is empty
    */
   end() {
      return this.config.repeat == 'queue' ? false : this.current.index == this.list.size;
   }

   /**
    * Seek to a position in the current track
    * @param {number} time - seek time in milliseconds
    */
   seek(time = 0) {
      this.play(this.current, { state: 'update', seek: time });
      this.client.socket.to(this.metadata.guild.id).emit('update-player');
   }

   getPosition() {
      return (
         this.player.state.playbackDuration + this.current?.position || this.current?.position || 0
      );
   }

   pause() {
      this.player.pause();
      this.state = 'paused';
      this.client.socket.to(this.metadata.guild.id).emit('update-player');
   }

   resume() {
      this.player.unpause();
      this.state = 'playing';
      this.client.socket.to(this.metadata.guild.id).emit('update-player');
   }

   setRepeat(mode) {
      this.config.repeat = mode;
      this.client.socket.to(this.metadata.guild.id).emit('update-player');
   }

   /**
    * Set volume of the queue
    * @param {number} volume - volume in number 0-1
    */
   volume(volume) {
      this.config.volume = volume;
      if (this.player.state.resource) this.player.state.resource.volume.setVolume(volume);
      this.client.socket.to(this.metadata.guild.id).emit('update-player');
   }

   /**
    * Convert milliseconds to hours, minutes and seconds
    * @param {number} ms - time in milliseconds
    * @returns {string} time in format 0h 0min 0s
    */
   MStoHMS(ms) {
      const seconds = Math.floor(ms / 1000) % 60;
      const minutes = Math.floor(ms / (1000 * 60)) % 60;
      const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;

      return `${hours ? `${hours}h ` : ''}${minutes}min ${
         !hours && seconds != 0 ? `${seconds}s` : ''
      }`;
   }
}

module.exports = Queue;
