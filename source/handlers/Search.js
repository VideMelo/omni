const Spotify = require('./Spotify');
const Youtube = require('./Youtube');

class Search {
   constructor(client, player) {
      this.spotify = new Spotify(client);
      this.youtube = new Youtube(client);
   }

   /**
    * Get a serach result from query input
    * @param {String} input - String query or url
    * @param {Object} options - Options for search
    * @returns {Result} Result
    * @throws {Error} Error
    * @example
    * const result = await search.list('You - Dontoliver');
    * console.log(result);
    * // Result { type: 'search', tracks: [ Tracks, ... ] }
    */
   async list(input, options = {}) {
      if (this.isUrl(input)) {
         let info = this.infoUrl(input);
         if (!info) return;
         if (info.stream == 'youtube') {
            const search = await this.youtube.search(input, options);
            return new Result(search);
         }
      }
      const search = await this.spotify.search(input, options);
      return new Result(search);
   }

   /**
    * Get a track from query input
    * @param {String} input - String query or url
    * @param {Object} options - Options for search
    * @returns {String} Url
    */
   async getUrl(track) {
      try {
         const id = await this.youtube.getId(track.query);
         return `https://youtu.be/${id}`;
      } catch (error) {
         throw new Error(error);
      }
   }

   isUrl(url) {
      const isUrl =
         /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/g;

      if (!url.match(isUrl)) return false;
      return true;
   }

   infoUrl(url) {
      if (this.spotify.urls.pattern.test(url)) {
         const match = this.spotify.urls.pattern.exec(url);

         return {
            stream: 'spotify',
            type: match[1],
            id: match[2],
         };
      }
      if (this.youtube.urls.pattern.test(url)) {
         url.match(this.youtube.urls.pattern);
         const match = this.youtube.urls.pattern.exec(url);

         return {
            stream: 'youtube',
            type: match[6] ? 'playlist' : 'track',
            id: match[6] ? match[7] : match[3],
         };
      }
   }
}

class Result {
   constructor(data) {
      this.data = data;
      this.type = data.type;
      this.items = Array.isArray(data) ? data : data.tracks || [data];
      this.starter = data.starter || this?.items[0]?.id || data?.id;
   }
}

module.exports = {
   Search,
   Result,
};
