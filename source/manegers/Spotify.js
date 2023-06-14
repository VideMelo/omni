const SpotifyWebApi = require('spotify-web-api-node');
const Song = require('./Song');

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
         songs: search.body.tracks.items.map((track) => {
            return new Song(this.build(track));
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
            id: playlist.body.id,
            name: playlist.body.name,
            authors: playlist.body.owner.display_name,
            thumbnail: playlist.body.images[0].url,
            songs:
               options.page == 1
                  ? tracks.body.tracks.items.map((track) => {
                       return new Song(this.build(track.track));
                    })
                  : tracks.body.items.map((track) => {
                       return new Song(this.build(track.track));
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
      return new Song(this.build(track.body));
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

module.exports = Spotify;
