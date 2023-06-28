const SpotifyWebApi = require('spotify-web-api-node');

const Track = require('./Track');

class Spotify {
   constructor(client) {
      this.api = new SpotifyWebApi({
         clientId: client.config.SPOTIFY_ID,
         clientSecret: client.config.SPOTIFY_SECRET,
         redirectUri: client.config.SPOTIFY_REDIRECT,
      });

      // const scopes = ['user-read-private', 'user-read-email', 'playlist-read-private'];
      // this.auth = this.api.createAuthorizeURL(scopes);
      // console.log(this.auth);

      let expiration;
      this.api
         .clientCredentialsGrant()
         .then((data) => {
            this.api.setAccessToken(data.body['access_token']);
            this.api.setRefreshToken(client.config.SPOTIFY_REFRESH);

            expiration = new Date().getTime() / 1000 + data.body['expires_in'];
            client.log.info('Retrieved Spotify Token.');
         })
         .catch((err) => {
            client.log.erro('Something went wrong when retrieving an access token', err);
         });

      const api = this.api;
      let updates = 0;

      setInterval(function () {
         if (++updates > 5) {
            clearInterval(this);
            api.refreshAccessToken()
               .then(() => {
                  let time = Math.floor((expiration - new Date().getTime() / 1000) / 60);
                  client.log.info(`Refreshed Spotify Token. It now expires in ${time} minutes!`);
               })
               .catch((err) => {
                  client.log.error('Something went wrong when refreshing an access token', err);
               });
         }
      }, 1000);

      this.urls = {
         pattern: /https?:\/\/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]{22})/,
      };
   }

   async search(input, options) {
      if (this.urls.pattern.test(input)) {
         const match = this.urls.pattern.exec(input);

         const type = match[1];
         const id = match[2];

         switch (type) {
            case 'track':
               return await this.getTrack(id);
            case 'album':
               return await this.getAlbum(id);
            case 'playlist':
               return await this.getPlaylist(id, {
                  page: options?.page,
               });
         }
      } else {
         return await this.getList(input);
      }
   }

   async getList(input, results = 5, options) {
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
         const page = options?.page || 1;
         const offset = (page - 1) * 100 || 0;

         const playlist = await this.api.getPlaylist(id).then((playlist) => playlist.body);
         const tracks =
            page === 1
               ? playlist.tracks
               : await this.api.getPlaylistTracks(id, { offset }).then((tracks) => tracks.body);

         if (playlist.tracks.total == 0) return;
         if (offset > playlist.tracks.total) return;

         return {
            type: 'list',
            id: playlist.id,
            name: playlist.name,
            authors: playlist.owner.display_name,
            thumbnail: playlist.images[0].url,
            url: playlist.external_urls.spotify,
            total: playlist.tracks.total,
            tracks: tracks.items.map((track) => new Track(this.build(track.track))),
            page,
         };
      } catch (err) {
         throw new Error(err);
      }
   }

   async getTrack(id) {
      const track = await this.api.getTrack(id);
      return new Track(this.build(track.body));
   }

   build(track) {
      return {
         type: 'track',
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

module.exports = Spotify;
