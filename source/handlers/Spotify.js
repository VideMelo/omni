const SpotifyWebApi = require('spotify-web-api-node');

const Logger = require('../utils/logger');
const Track = require('./Track');

class Spotify {
   constructor(client) {
      this.api = new SpotifyWebApi({
         clientId: client.config.SPOTIFY_ID,
         clientSecret: client.config.SPOTIFY_SECRET,
      });

      this.expiration;
      this.api
         .clientCredentialsGrant()
         .then((data) => {
            this.expiration = new Date().getTime() / 1000 + data.body['expires_in'];
            this.api.setAccessToken(data.body['access_token']);
         })
         .catch((err) => {
            Logger.erro('Something went wrong when retrieving an access token', err);
         });

      this.urls = {
         pattern: /https?:\/\/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]{22})/,
      };
   }

   async refreshAccessToken() {
      const data = await this.api.clientCredentialsGrant();

      this.api.setAccessToken(data.body['access_token']);
      this.expiration = new Date().getTime() / 1000 + data.body['expires_in'];

      return data.body['access_token'];
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
      if (this.expiration < new Date().getTime() / 1000) await this.refreshAccessToken();
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
      if (this.expiration < new Date().getTime() / 1000) await this.refreshAccessToken();
      const playlist = await this.api.getPlaylist(id).then((playlist) => playlist.body);

      const page = options?.page || 1;
      const offset = (page - 1) * 100 || 0;

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
   }

   async getTrack(id) {
      if (this.expiration < new Date().getTime() / 1000) await this.refreshAccessToken();
      const track = await this.api.getTrack(id);
      return new Track(this.build(track.body));
   }

   async getAlbum(id) {
      if (this.expiration < new Date().getTime() / 1000) await this.refreshAccessToken();
      const album = await this.api.getAlbum(id).then((album) => album.body);

      return {
         type: 'list',
         id: album.id,
         name: album.name,
         authors: album.artists,
         thumbnail: album.images[0].url,
         url: album.external_urls.spotify,
         total: album.tracks.total,
         tracks: album.tracks.items.map(
            (track) => new Track(this.build({ ...track, album: album }))
         ),
      };
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
