const Song = require('./Song');
const { google } = require('googleapis');

const SpotifyWebApi = require('spotify-web-api-node');

class Search {
   constructor(client, player) {
      this.spotify = {
         async api(id, secret) {
            const spotify = new SpotifyWebApi({
               clientId: id || client.config.SPOTIFY_ID,
               clientSecret: secret || client.config.SPOTIFY_SECRET,
            });

            const response = await spotify.clientCredentialsGrant();
            spotify.setAccessToken(response.body['access_token']);
            return spotify;
         },
         url: {
            playlist: /s/,
            track: /s/,
         },
      };

      this.youtube = {
         api(key) {
            const youtube = google.youtube('v3');
            google.options({
               auth: key || client.config.YOUTUBE_KEY,
            });

            return youtube;
         },
         async search(input, results = 1, part = 'id', ...options) {
            return await this.api().search.list({
               maxResults: results,
               part: part,
               q: input,
               ...options,
            });
         },
         url: {
            playlist:
               /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu.be))(\/playlist\?list=)([\w\-]+)(\S+)?$/gm,
            track: /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gm,
         },
      };
   }

   async list(input) {
      try {
         if (this.url(input)) {
            const info = this.url(input);
            switch (info.stream) {
               case 'youtube':
                  switch (info.type) {
                     case 'playlist':
                        break;
                     case 'track':
                        const res = await this.youtube.api().videos.list({
                           part: 'snippet,contentDetails',
                           id: info.id,
                        });
                        return new Song(res.data.items[0], 'youtube');
                  }
                  break;
               case 'spotify':
                  switch (info.type) {
                     case 'playlist':
                        break;
                     case 'track':
                        break;
                  }
            }
         }
         const spotify = await this.spotify.api();

         const search = await spotify.searchTracks(input, {
            limit: 5,
         });
         if (search.body.tracks.total == 0) return;
         return search.body.tracks.items.map((track) => {
            return new Song(track, 'spotify');
         });
      } catch (error) {
         throw new Error(error);
      }
   }

   async result(song) {
      if (song.builder == 'spotify') {
         let spotify = await this.spotify.api();
         let author = await spotify.getArtist(song.authors[1].id);
         let res = await this.youtube.search(song.search);
         song.build({
            url: `https://youtu.be/${res.data.items[0].id.videoId}`,
            author: author,
         });
      } else if (song.builder == 'youtube') {
         song.build({
            author: authors[0],
         });
      }

      return song;
   }

   url(url) {
      const isUrl =
         /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/gm;

      if (!url.match(isUrl)) return;

      if (url.match(this.youtube.url.playlist)) {
         const regex = this.youtube.url.playlist.exec(url);
         return {
            stream: 'youtube',
            type: 'playlist',
            id: regex[5],
         };
      } else if (url.match(this.youtube.url.track)) {
         const regex = this.youtube.url.track.exec(url);
         return {
            stream: 'youtube',
            type: 'track',
            id: regex[5],
         };
      }
   }
}

module.exports = Search;
