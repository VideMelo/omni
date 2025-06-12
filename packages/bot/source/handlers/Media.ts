export interface Track {
   name: string;
   streamable?: string;
   duration: number;
   thumbnail?: string;
   artist: TrackArtist;
   id: string;
   url: string;
   source: 'spotify' | 'youtube' | 'cache';
   index?: number;
   ogidx?: number;
   requester?: string | null;
   explicit?: boolean;
   cached?: boolean;
   album?: {
      name: string;
      id: string;
      url?: string;
      thumbnail?: string;
      total: number;
   };
   metadata?: TrackMetadata;
}

export interface TrackMetadata {
   source: 'youtube';
   id: string;
   url: string;
   name: string;
   duration: number;
   explicit?: boolean;
   thumbnail?: string;
   artist: TrackArtist;
}

interface TrackArtist {
   name: string;
   id: string;
   url?: string;
   icon?: string;
}

export class Track implements Track {
   constructor({
      source,
      id,
      name,
      artist,
      thumbnail,
      explicit = false,
      duration,
      streamable,
      url,
      index,
      requester,
      cached = false,
      metadata,
      album,
   }: Track) {
      this.name = name;
      this.url = url;
      this.source = source;
      this.duration = duration;
      this.thumbnail = thumbnail;
      this.metadata = metadata ? new TrackMetadata(metadata) : undefined;
      this.artist = {
         name: artist.name ?? this.metadata?.artist.name ?? 'Unknown Artist',
         id: artist.id,
         url: artist.url,
         icon: artist.icon || this.metadata?.artist.icon || undefined,
      };
      this.album = album
         ? {
              name: album.name,
              id: album.id,
              url: album.url,
              thumbnail: album.thumbnail,
              total: album.total || 0,
           }
         : undefined;

      this.id = id;
      this.index = index;
      this.requester = requester;
      this.source = source;
      this.explicit = explicit;
      this.cached = cached;
      this.streamable = streamable;
   }
}

export class TrackMetadata implements TrackMetadata {
   constructor({
      source,
      id,
      url,
      name,
      duration,
      explicit = false,
      thumbnail,
      artist,
   }: TrackMetadata) {
      this.source = source;
      this.id = id;
      this.url = url;
      this.name = name;
      this.duration = duration;
      this.explicit = explicit;
      this.thumbnail = thumbnail;
      this.artist = {
         name: artist.name,
         id: artist.id,
         url: artist.url,
         icon: artist.icon,
      };
   }
}

export class Playlist {
   constructor(
      public id: string,
      public title: string,
      public description: string,
      public tracks: Track[]
   ) {}
}
