const SpotifyWebApi = require('spotify-web-api-node');
const { google } = require('googleapis');

class Search {
   constructor(client) {
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
         const info = this.infoUrl(input);
         switch (info.stream) {
            case 'spotify':
               switch (info.type) {
                  case 'playlist':
                     const playlist = await this.spotify.getPlaylist(info.id, {
                        page: options?.page || 1,
                     });
                     return new Result(playlist, playlist.tracks[0].id);
                  case 'track':
                     return new Result(await this.spotify.getTrack(info.id));
               }
         }
      } else {
         const search = await this.spotify.search(input);
         return new Result(search, search.starter);
      }
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
   constructor(data, starter) {
      Object.assign(this, data);

      this.type = data.type;
      this.tracks = Array.isArray(data) ? data : data.tracks;
      this.starter = starter || this.tracks[0].id;
   }
}

class Spotify {
   constructor(client) {
      this.api = new SpotifyWebApi({
         clientId: client.config.SPOTIFY_ID,
         clientSecret: client.config.SPOTIFY_SECRET,
      });

      this.api
         .clientCredentialsGrant()
         .then((data) => {
            this.api.setAccessToken(data.body['access_token']);
         })
         .catch((err) => {
            client.log.erro('Something went wrong when retrieving an access token', err);
         });

      this.urls = {
         pattern: /https?:\/\/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]{22})/,
      };
   }

   async search(input, results = 5, ...options) {
      const search = await this.api.searchTracks(input, {
         limit: results,
         ...options,
      });
      if (search.body.tracks.total == 0) return;
      return {
         type: 'search',
         tracks: search.body.tracks.items.map((track) => {
            return new Track(this.build(track));
         }),
      };
   }

   async getPlaylist(id, { ...options }) {
      try {
         const offset = (options.page - 1) * 100 || 0;
         const playlist = await this.api.getPlaylist(id);
         const tracks =
            options.page == 1 ? playlist : await this.api.getPlaylistTracks(id, { offset });
         if (playlist.body.tracks.total == 0) return;
         if (offset > playlist.body.tracks.total) return;

         return {
            type: 'list',
            id: playlist.body.id,
            name: playlist.body.name,
            authors: playlist.body.owner.display_name,
            thumbnail: playlist.body.images[0].url,
            tracks:
               options.page == 1
                  ? tracks.body.tracks.items.map((track) => {
                       return new Track(this.build(track.track));
                    })
                  : tracks.body.items.map((track) => {
                       return new Track(this.build(track.track));
                    }),
            total: playlist.body.tracks.total,
            page: options.page || 1,
            url: playlist.body.external_urls.spotify,
         };
      } catch (err) {
         console.log(err);
      }
   }

   async getTrack(id) {
      const track = await this.api.getTrack(id);
      return new Track(this.build(track.body));
   }

   getId(url) {
      const match = url.match(this.urls.pattern);
      if (!match) return;
      return match[2];
   }

   build(track) {
      return {
         id: track.id,
         source: 'spotify',
         name: track.name,
         authors: track.artists.map((artist) => {
            return {
               name: artist.name,
               id: artist.id,
            };
         }),
         duration: track.duration_ms,
         thumbnail: track?.album?.images[2]?.url,
         query: `${track.artists[0].name} - ${track.name} (Audio)`,
      };
   }
}

class Youtube {
   constructor(client) {
      this.client = client;

      this.api = google.youtube({
         version: 'v3',
         auth: client.config.YOUTUBE_KEY,
      });

      this.urls = {
         pattern: /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
         video: /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
         playlist:
            /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu.be))\/(watch\?v=(.+)&list=|(playlist)\?list=)([^&]+)/,
         track: /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu.be))(\/(watch\?v=|embed\/|v\/))([\w\-]+)/,
      };
   }

   async getId(input) {
      const match = input.match(this?.urls?.pattern);
      if (match) {
         return match[2];
      } else {
         const search = await this.api.search.list({
            part: 'snippet,id',
            q: input,
            maxResults: 1,
            type: 'video',
         });
         if (search.data.pageInfo.totalResults == 0) return;
         return search.data.items[0].id.videoId;
      }
   }

   ISOtoMS(ISO) {
      const regex = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

      let match;
      if (!ISO.match(regex)) return NaN;
      match = regex.exec(ISO);

      const hrs = match[4] ? parseInt(match[4]) : 0;
      const min = match[5] ? parseInt(match[5]) : 0;
      const sec = match[6] ? parseInt(match[6]) : 0;

      const msHrs = hrs * 60 * 60 * 1000;
      const msMin = min * 60 * 1000;
      const msSec = sec * 1000;

      return msHrs + msMin + msSec;
   }
}

class Track {
   constructor({
      source = '',
      name = '',
      authors = [],
      thumbnail = '',
      duration = 0,
      url,
      live = false,
      query = '',
      id = '',
   }) {
      this.source = source;
      this.name = name;
      this.authors = authors;
      this.thumbnail = thumbnail;
      this.duration = duration;
      this.time = this.MStoHMS(duration);
      this.url = url;
      this.requester = {};
      this.index;
      this.live = live;
      this.query = query;
      this.id = id;
      this.type = 'track';
   }

   set(attrs) {
      Object.keys(attrs).forEach((key) => {
         this[key] = attrs[key];
      });
   }

   MStoHMS(MS) {
      const sec = Math.floor((MS / 1000) % 60);
      const min = Math.floor((MS / 1000 / 60) % 60);
      const hrs = Math.floor((MS / 1000 / 60 / 60) % 24);

      return `${hrs ? `${hrs}:` : ''}${min <= 9 ? `0${min}` : min}:${sec <= 9 ? `0${sec}` : sec}`;
   }
}

module.exports = {
   Search,
   Result,
   Spotify,
   Youtube,
   Track,
};
