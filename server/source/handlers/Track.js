class Track {
   constructor({
      source,
      name,
      authors = [],
      thumbnail,
      duration = 0,
      url,
      live = false,
      query,
      id,
      requester = {},
      index,
      order,
   }) {
      this.source = source;
      this.name = name;
      this.authors = authors;
      this.thumbnail = thumbnail;
      this.duration = duration;
      this.time = this.MStoHMS(duration);
      this.url = url;
      this.requester = requester;
      this.index = index;
      this.order = order;
      this.live = live;
      this.query = query;
      this.id = id;
      this.type = 'track';
      this.builded = false;
      this.artists = authors.map((author) => author.name).join(', ');
   }

   set(attrs) {
      Object.keys(attrs).forEach((key) => {
         this[key] = attrs[key];
      });
   }

   MStoHMS(MS) {
      const sec = Math.floor((MS / 1000) % 60);
      const min = Math.floor((MS / 1000 / 60) % 60);
      const hrs = Math.floor((MS / 1000 / 60 / 60) % 24);

      return `${hrs ? `${hrs}:` : ''}${min <= 9 ? `0${min}` : min}:${sec <= 9 ? `0${sec}` : sec}`;
   }
}

module.exports = Track;
