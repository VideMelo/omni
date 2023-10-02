const youtube = require('youtube-sr').default;

const Track = require('./Track');

class Youtube {
   constructor() {
      this.urls = {
         pattern:
            /((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu\.be))\/(watch\?v=(.+)&list=|(playlist)\?list=|watch\?v=)?([^&]+)/,
         playlist:
            /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu.be)?)\/(((watch\?v=)?(.+)(&|\?))?list=|(playlist)\?list=)([^&]+)/,
         video: /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu.be)?)(\/(watch\?v=|embed\/|v\/)?)([\w\-]+)/,
      };
   }

   async search(query, options = {}) {
      if (this.urls.pattern.test(query)) {
         if (this.urls.playlist.test(query)) {
            const match = this.urls.playlist.exec(query);
            return await this.getPlaylist(query, { ...options, starter: match[7] });
         } else if (this.urls.video.test(query)) {
            return await this.getVideo(query, options);
         }
      }
   }

   async getVideo(url, options = {}) {
      const video = await youtube.getVideo(url, options);
      console.log(video);
      return new Track(await this.build(video));
   }

   async getPlaylist(id, options = {}) {
      const playlist = await youtube.getPlaylist(id, options).then((playlist) => playlist.fetch());
      const videos = playlist.videos;
      let tracks = videos.map(async (video) => {
         return new Track(await this.build(video));
      });
      tracks = Promise.all(tracks);

      return {
         type: 'list',
         id: playlist.id,
         name: playlist.title,
         starter: options?.starter || this.urls.video.exec(playlist.link)[6],
         authors: [
            {
               name: playlist.channel.name,
               id: playlist.channel.id,
            },
         ],
         thumbnail: playlist.thumbnail.url,
         url: playlist.url,
         total: playlist.videoCount,
         tracks,
      };
   }

   async getId(input) {
      if (this.urls.video.test(input)) {
         const match = this.urls.video.exec(input);
         return match[6];
      } else {
         const search = await youtube.searchOne(input);
         return search.id;
      }
   }

   async build(video) {
      let match = video.thumbnail.url.match(/(.*\.jpg)/);
      let thumbnail = match ? match[0] : video.thumbnail.url;

      // this crop the thumbnail 1:1
      // const response = await axios.get(thumbnail, {
      //    responseType: 'arraybuffer',
      // });

      // thumbnail = await sharp(response.data).resize(200, 200).toBuffer();
      // thumbnail = `data:image/jpeg;base64, ${Buffer.from(thumbnail).toString('base64')}`;

      return {
         type: 'track',
         id: video.id,
         name: video.title,
         source: 'youtube',
         authors: [
            {
               name: video.channel.name,
               id: video.channel.id,
            },
         ],
         thumbnail: thumbnail,
         url: video.url,
         duration: video.duration,
         query: video.title,
      };
   }
}

module.exports = Youtube;
