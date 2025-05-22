const fs = require('fs');

const Discord = require('discord.js');

const ytdl = require('youtube-dl-exec');
const ytsr = require('youtube-sr').default;

class YouTube {
   constructor() {
      this.urls = {
         pattern:
            /((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu\.be))\/(watch\?v=(.+)&list=|(playlist)\?list=|watch\?v=)?([^&]+)/,
         playlist:
            /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu.be)?)\/(((watch\?v=)?(.+)(&|\?))?list=|(playlist)\?list=)([^&]+)/,
         video: /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu.be)?)(\/(watch\?v=|embed\/|v\/)?)([\w\-]+)/,
      };
   }
   async get(query, options = {}) {
      return await ytsr.search(query, { limit: 1, type: 'video', ...options });
   }

   stream(url) {
      try {
         const stream = ytdl.exec(
            url,
            {
               output: '-',
               format: 'bestaudio/best',
               audioFormat: 'opus',
               audioQuality: 0,
               quiet: true,
            },
            { stdio: ['ignore', 'pipe', 'ignore'] }
         );

         return stream.stdout;
      } catch (err) {
         console.log(err);
      }
   }

   async upload({ chunks, buffer, track, client }) {
      await new Promise((resolve, reject) => {
         buffer.on('end', resolve);
         buffer.on('error', reject);
      });

      const buffered = Buffer.concat(chunks);
      const channel = client.channels.cache.get('1343313574898040862');

      if (!channel) throw new Error('Canal não encontrado!');

      const attachment = new Discord.AttachmentBuilder(buffered, { name: `${track.id}.opus` });
      const message = await channel.send({
         content: `${track.name} - ${track.artist}`,
         files: [attachment],
      });

      const data = {
         id: track.id,
         track: track,
         message: message.id,
      };

      const file = 'tracks.json';
      try {
         const json = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
         fs.writeFileSync(file, JSON.stringify([...json, data], null, 2));
      } catch (error) {
         console.error('Erro:', error);
      }
   }
}

module.exports = YouTube;
