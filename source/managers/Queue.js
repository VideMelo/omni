const Discord = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const { EventEmitter } = require('events');

const { Result, Track } = require('./Search');

class Queue extends EventEmitter {
   constructor(player) {
      super();
      this.player = player;

      this.list = new Discord.Collection();
      this.current = { index: 0 };

      this.config = {
         loop: false, // Loop the queue
         shuffle: false, // Shuffle the queue
         repeat: false, // Repeat the current track
         volume: 1,
      };

      this.state = 'idle';
      this.metadata = {
         voice: null,
         guild: null,
         channel: null,
         connection: null,
      };

      this.duration = 0;
      this.time = 'no time';
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
      return connection;
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
         connection: this.connect(metadata.voice),
      });
   }

   /**
    * Set a new track in queue
    * @param {Result | Track} body - Track or Serach Result
    * @param {Object} options - Options
    * @returns {Track} Track added
    */
   new(body, options = {}) {
      if (!body instanceof Track && !body instanceof Result) return;
      let track;
      if (options.type == 'list') {
         body = { ...body, requester: options?.requester };
         body.tracks.forEach((track) => {
            track.set({
               index: this.list.size + 1,
               requester: options?.requester,
            });
            this.list.set(this.list.size + 1, track);
         });
         this.emit('new', body, options.type);
         track = this.list.find((track) => body.starter == track.id);
      } else if (options.type == 'track' || options.type == 'search') {
         body.set({
            index: this.list.size + 1,
            requester: options?.requester,
         });
         this.list.set(this.list.size + 1, body);
         this.emit('new', this.list.get(body.index), options.type);
         track = body;
      }

      this.update();
      return track;
   }

   /**
    * Next track in queue
    * @returns {boolean | Track} null if queue is empty, Track if queue is not empty
    */
   next() {
      if (this.idle()) return null;
      if (this.current.index == this.list.size) {
         if (this.config.loop) {
            if (this.config.shuffle) {
               this.shuffle(true);
               return this.list.get(1);
            } else {
               return this.list.get(1);
            }
         }
      }
      return this.list.get(this.current.index + 1);
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
      return this.list;
   }

   order() {
      const tracks = this.list.map((track) => track);
      this.list.clear();

      tracks.sort((a, b) => a.order - b.order);
      tracks.forEach((track) => {
         this.list.set(this.list.size + 1, track);
      });
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
   idle() {
      return this.config.loop ? false : this.current.index == this.list.size;
   }

   /**
    * Seek to a position in the current track
    * @param {number} time - seek time in milliseconds
    */
   seek(time = 0) {
      this.player.play(this.current, { state: 'update', seek: time });
   }

   pause() {
      this.player.manager.pause();
      this.state = 'paused';
   }

   unpause() {
      this.player.manager.unpause();
      this.state = 'playing';
   }

   /**
    * Set volume of the queue
    * @param {number} volume - volume in number 0-1
    */
   volume(volume) {
      this.player.manager.state.resource.volume.setVolume(volume);
      this.config.volume = volume;
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
