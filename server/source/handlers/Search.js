const Spotify = require('./Spotify');

class Search {
   constructor(client) {
      this.spotify = new Spotify({
         id: client.config.SPOTIFY_ID,
         secret: client.config.SPOTIFY_SECRET,
      });

      this.client = client;
   }

   async list(query, options = { type: 'searchTrack' }) {
      if (options.type == 'searchTrack') {
         const result = await this.spotify.search(query, { types: ['track'], limit: 5 })
         return {
            type: 'search',
            items: result.body.tracks.items.map((track) => {
               return {
                  type: 'track',
                  id: track.id,
                  name: track.name,
                  artist: track.artists[0].name,
                  album: track.album.name,
                  duration: track.duration_ms,
                  thumbnail: track.album.images[0].url,
                  popularity: track.popularity, 
               };
            }).sort((a, b) => b.popularity - a.popularity)
         }
      } else if (options.type == 'topResult') {
         return await this.topResults(query);
      }
   }

   async topResults(query) {
      const [artists, albums, tracks] = await this.spotify
         .search(query, { types: ['artist', 'album', 'track'], limit: 15 })
         .then(async (res) => {
            const tracks = res.body.tracks.items.map((track) => {
               return {
                  type: 'track',
                  id: track.id,
                  name: track.name,
                  artist: track.artists[0].name,
                  album: track.album.name,
                  duration: track.duration_ms,
                  thumbnail: track.album.images[0].url,
                  popularity: track.popularity,
               };
            }).sort((a, b) => b.popularity - a.popularity);

            const albums = await Promise.all(
               res.body.albums.items
                  .filter((item) => item.album_type == 'album')
                  .map(async (item, index) => {
                     if (index > 0)
                        return {
                           type: 'album',
                           id: item.id,
                           name: item.name,
                           artist: item.artists[0].name,
                           thumbnail: item.images[0].url,
                           popularity: 0,
                        };
                     const album = await this.spotify.getAlbum(item.id);
                     return {
                        type: 'album',
                        id: album.id,
                        name: album.name,
                        artist: album.artists[0].name,
                        tracks: album.tracks.items.map((track) => { 
                           return {
                              type: 'track',
                              id: track.id,
                              name: track.name,
                              artist: track.artists[0].name,
                              album: album.name,
                              duration: track.duration_ms,
                              thumbnail: album.images[0].url,
                              popularity: track.popularity,
                           };
                        }),
                        thumbnail: album.images[0].url,
                        popularity: album.popularity,
                     };
                  })
            );

            const artists = res.body.artists.items
               .map((artist) => {
                  return {
                     type: 'artist',
                     id: artist.id,
                     name: artist.name,
                     thumbnail: artist?.images[0]?.url,
                     popularity: artist.popularity,
                  };
               })
            
            return [artists, albums, tracks];
         });

      const priority = {
         album: 1.3,
         artist: 1.1,
         track: 1.2,
      };
      let mathes = [];
      let result = [tracks[0], albums[0], artists[0]]
         .map((item) => {
            if (item.name.toLowerCase().includes(query.toLowerCase())) mathes.push(item); 
            return item;
         })
      
      if (mathes.length > 1) {
         result = mathes.sort(
            (a, b) => b.popularity * priority[b.type] - a.popularity * priority[a.type]
         );
      } else if (mathes.length == 1) {
         result = mathes;
      } else {
         result = result.sort((a, b) => b.popularity * priority[b.type] - a.popularity * priority[a.type]);
      }
      
      return {
         type: 'search',
         tracks: tracks,
         albums: albums,
         artists: artists,
         top: {...result[0]}, 
      }
   }

   async getUrl(track) {
      try {
         const id = await this.youtube.getId(track.query);
         return `https://youtu.be/${id}`;
      } catch (error) {
         console.error(error);
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
            id: match[7],
         };
      }
   }
}

module.exports = {
   Search,
};
