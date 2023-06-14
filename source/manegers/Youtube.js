const { google } = require('googleapis');
const Song = require('./Song');

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
}
module.exports = Youtube;
