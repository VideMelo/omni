class Song {
   constructor({ name, authors, thumbnail, duration, url, live = false, query, source, id }) {
      this.source = source;
      this.name = name;
      this.authors = authors;
      this.thumbnail = thumbnail;
      this.duration =
         source == 'youtube' ? this.MStoHMS(this.ISOtoMS(duration)) : this.MStoHMS(duration);
      this.durationMS = source == 'youtube' ? this.ISOtoMS(duration) : duration;
      this.url = url;
      this.live = live;
      this.query = query;
      this.id = id;
   }

   set({ url, author }) {
      this.author = author;
      if (url) this.url = url;
   }

   MStoHMS(MS) {
      const sec = Math.floor((MS / 1000) % 60);
      const min = Math.floor((MS / 1000 / 60) % 60);
      const hrs = Math.floor((MS / 1000 / 60 / 60) % 24);

      return `${hrs ? `${hrs}:` : ''}${min <= 9 ? `0${min}` : min}:${sec <= 9 ? `0${sec}` : sec}`;
   }

   ISOtoMS(ISO) {
      const regex = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

      let match;
      if (!ISO.match(regex)) return NaN;
      match = regex.exec(ISO);

      const hrs = match[4] ? parseInt(match[4]) : 0;
      const min = match[5] ? parseInt(match[5]) : 0;
      const sec = match[6] ? parseInt(match[6]) : 0;

      const msHrs = hrs * 60 * 60 * 1000;
      const msMin = min * 60 * 1000;
      const msSec = sec * 1000;

      return msHrs + msMin + msSec;
   }
}

module.exports = Song;
