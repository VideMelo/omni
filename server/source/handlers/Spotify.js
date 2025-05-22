const SpotifyWebApi = require('spotify-web-api-node');
const Logger = require('../utils/logger');

class Spotify {
   constructor({ id, secret }) {
      this.api = new SpotifyWebApi({
         clientId: id,
         clientSecret: secret,
      });

      this.expiration;
      this.api
         .clientCredentialsGrant()
         .then((data) => {
            this.expiration = new Date().getTime() / 1000 + data.body['expires_in'];
            this.api.setAccessToken(data.body['access_token']);
            console.log(data.body['access_token']);
         })
         .catch((err) => {
            console.error('Something went wrong when retrieving an access token', err);
         });

      this.urls = {
         pattern:
            /https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist)\/([a-zA-Z0-9]{22})/,
      };
   }

   async refreshAccessToken() {
      const data = await this.api.clientCredentialsGrant();
      this.api.setAccessToken(data.body['access_token']);
      this.expiration = new Date().getTime() / 1000 + data.body['expires_in'];
      return data.body['access_token'];
   }

   async requestWithRetry(apiCall, retries = 5) {
      for (let i = 0; i < retries; i++) {
         try {
            return await apiCall();
         } catch (err) {
            if (err.statusCode === 429) {
               const retryAfter = parseInt(err.headers?.['retry-after'], 10) || 5;
               console.warn(`Rate limit atingido. Tentando novamente em ${retryAfter} segundos...`);
               await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
            } else {
               throw err;
            }
         }
      }
      throw new Error('Número máximo de tentativas atingido.');
   }

   async get(query, options = { types: ['track'] }) {
      if (this.expiration < new Date().getTime() / 1000) await this.refreshAccessToken();

      if (this.urls.pattern.test(query)) {
         const match = this.urls.pattern.exec(query);
         const type = match[1];
         const id = match[2];

         let result;
         switch (type) {
            case 'track':
               result = await this.getTrack(id);
               break;
            case 'album':
               result = await this.getAlbum(id);
               break;
            case 'playlist':
               result = await this.getPlaylist(id, { page: options?.page });
               break;
         }

         return {
            type,
            items: [result],
         };
      } else {
         return await this.requestWithRetry(() => this.api.search(query, options.types, options));
      }
   }

   async getList(query, results = 5, options) {
      if (this.expiration < new Date().getTime() / 1000) await this.refreshAccessToken();

      const search = await this.requestWithRetry(() =>
         this.api.searchTracks(query, { limit: results, ...options })
      );

      if (search.body.tracks.total === 0) return;
      return {
         type: 'search',
         tracks: search.body.tracks.items.map((track) => new Track(this.build(track))),
      };
   }

   async getPlaylist(id) {
      if (this.expiration < new Date().getTime() / 1000) await this.refreshAccessToken();

      let playlist
      try {
         const playlist = await this.requestWithRetry(() =>
         this.api.getPlaylist(id).then((playlist) => playlist.body)
      );
      } catch (err) {
         console.error('não foi possivel buscar', id, err)
      }

      if (playlist.tracks.total === 0) return;

      let allItems = [...playlist.tracks.items];
      const totalTracks = playlist.tracks.total;

      if (totalTracks > 100) {
         for (let offset = 100; offset < totalTracks; offset += 100) {
            const tracksPage = await this.requestWithRetry(() =>
               this.api.getPlaylistTracks(id, { offset, limit: 100 }).then((res) => res.body.items)
            ).catch((error) => {
               Logger.error('Erro ao buscar faixas:', error);
               return [];
            });

            allItems.push(...tracksPage);
         }
      }
      return {
         type: 'playlist',
         id: playlist.id,
         name: playlist.name,
         artist: playlist.owner.display_name,
         thumbnail: playlist.images[0]?.url,
         url: playlist.external_urls.spotify,
         total: totalTracks,
         tracks: allItems.map((item) => this.build(item.track)),
      };
   }

   async getTrack(id) {
      if (this.expiration < new Date().getTime() / 1000) await this.refreshAccessToken();
      const track = await this.requestWithRetry(() =>
         this.api.searchTracks(id, { limit: 1, offset: 1 })
      );
      return new Track(track.body.tracks.items[0]);
   }

   async getAlbum(id) {
      if (this.expiration < new Date().getTime() / 1000) await this.refreshAccessToken();
      const album = await this.requestWithRetry(() =>
         this.api.getAlbum(id).then((album) => album.body)
      );

      return {
         type: 'list',
         id: album.id,
         name: album.name,
         artists: album.artists,
         thumbnail: album.images[0].url,
         url: album.external_urls.spotify,
         total: album.tracks.total,
         tracks: album.tracks.items.map((track) => this.build({ ...track, album })),
      };
   }

   build(track) {
      return {
         type: 'track',
         id: track.id,
         source: 'spotify',
         name: track.name,
         artist: track.artists[0].name,
         duration: track.duration_ms,
         thumbnail: track?.album?.images[0]?.url,
         query: `${track.artists[0].name} - ${track.name} Auto-generated by YouTube.`,
      };
   }
}

module.exports = Spotify;
