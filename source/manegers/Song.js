const Discord = require('discord.js');

class Song {
   constructor(body, type = '') {
      switch (type) {
         case 'youtube':
            this.youtube(body);
            break;
         case 'spotify':
            this.spotify(body);
            break;
      }
   }

   spotify(body) {
      this.builder = 'spotify';
      this.name = body.name;
      const authors = body?.artists?.map((author) => author.name);
      this.authors = [authors, ...body.artists];
      this.thumbnail = body.album.images[2];
      this.search = `${this.authors[1].name} - ${body.name} (Audio)`;
      this.duration = this.MStoMIN(body.duration_ms);
   }

   youtube(body) {
      this.builder = 'youtube';
      this.name = body.snippet.title;
      this.authors = [[body.snippet.channelTitle], { name: body.snippet.channelTitle }];
      this.thumbnail = body.snippet.thumbnails.high;
      this.duration = this.MStoMIN(this.ISOtoMS(body.contentDetails.duration));
      this.url = `https://youtu.be/${body.id}`;
   }

   build({ url, author }) {
      this.author = author;
      if (url) this.url = url;
   }

   MStoMIN(MS) {
      const sec = Math.floor((MS / 1000) % 60);
      const min = Math.floor((MS / 1000 / 60) % 60);
      return `${min <= 9 ? `0${min}` : min}:${sec <= 9 ? `0${sec}` : sec}`;
   }

   ISOtoMS(ISO) {
      const regex = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
      const match = regex.exec(ISO);

      const hours = match[4] ? parseInt(match[4]) : 0;
      const minutes = match[5] ? parseInt(match[5]) : 0;
      const seconds = match[6] ? parseInt(match[6]) : 0;

      const msHours = hours * 60 * 60 * 1000;
      const msMinutes = minutes * 60 * 1000;
      const msSeconds = seconds * 1000;

      return msHours + msMinutes + msSeconds;
   }
}

module.exports = Song;
