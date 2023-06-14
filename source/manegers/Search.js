const Spotify = require('./Spotify');
const Youtube = require('./Youtube');

class Search {
   constructor(client, player) {
      this.spotify = new Spotify(client);
      this.youtube = new Youtube(client);
   }

   async list(input, options = {}) {
      try {
         if (this.isUrl(input)) {
            const info = this.infoUrl(input);
            switch (info.stream) {
               case 'spotify':
                  switch (info.type) {
                     case 'playlist':
                        const playlist = await this.spotify.getPlaylist(info.id, {
                           page: options?.page || 1,
                        });
                        return this.result(playlist, 'list', playlist.songs[0].id);
                     case 'track':
                        return this.result(await this.spotify.getTrack(info.id), 'track');
                  }
            }
         } else {
            return this.result(await this.spotify.search(input), 'search');
         }
      } catch (error) {
         throw new Error(error);
      }
   }

   async getUrl(track) {
      try {
         const id = await this.youtube.getId(track.query);
         return `https://youtu.be/${id}`;
      } catch (error) {
         throw new Error(error);
      }
   }

   result(body, type, starter) {
      return {
         type,
         starter,
         ...body,
      };
   }

   isUrl(url) {
      const isUrl =
         /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/g;

      if (!url.match(isUrl)) return false;
      return true;
   }

   infoUrl(url) {
      if (this.spotify.urls.pattern.test(url)) {
         this.spotify.urls.pattern.test(url);
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

module.exports = Search;
