import SpotifyWebApi from 'spotify-web-api-node';
import Logger from '../utils/logger.js';

interface SpotifyConfig {
   id: string;
   secret: string;
}

type SpotifySearchType = 'track' | 'album' | 'playlist' | 'artist';

interface SpotifySearchOptions {
   types: SpotifySearchType[];
   limit?: number;
   offset?: number;
   market?: string;
   include_external?: 'audio';
   [key: string]: any;
}

interface SpotifyTrack {
   type: 'track';
   source: 'spotify';
   id: string;
   name: string;
   artist: SpotifyArtist;
   duration: number;
   url: string;
   icon?: string;
   query?: string;
   album: SpotifyAlbum;
}

interface SpotifyAlbum {
   type?: 'album';
   id: string;
   name: string;
   artists?: Array<{ name: string; id: string }>;
   total: number;
   icon?: string;
   url: string;
   tracks?: SpotifyApi.TrackObjectSimplified[] | SpotifyApi.TrackObjectFull[];
   popularity?: number;
}

interface SpotifyPlaylist {
   type?: 'playlist';
   id: string;
   name: string;
   artist: string | { name: string; id: string } | undefined;
   icon: string;
   description: string | null;
   url: string;
   total: number;
   tracks: SpotifyTrack[];
}

interface SpotifyArtist {
   type?: 'artist';
   id: string;
   name: string;
   icon?: string;
   popularity?: number;
   url?: string;
   genres?: Array<string>;
   followers?: { total: number };
   query?: string;
}

type SpotifySearchResultType = 'tracks' | 'albums' | 'playlists' | 'artists';
interface SpotifySearchResult {
   type: SpotifySearchType | 'top' | 'search';
   items: {
      tracks: SpotifyTrack[];
      playlists: SpotifyPlaylist[];
      albums: SpotifyAlbum[];
      artists: SpotifyArtist[];
   };
}

export default class Spotify {
   private api: SpotifyWebApi;
   private expiration: number;
   public urls: {
      pattern: RegExp;
   };
   constructor({ id, secret }: SpotifyConfig) {
      this.api = new SpotifyWebApi({
         clientId: id,
         clientSecret: secret,
      });

      this.expiration = 0;
      this.api
         .clientCredentialsGrant()
         .then((data) => {
            this.expiration = new Date().getTime() / 1000 + data.body['expires_in'];
            this.api.setAccessToken(data.body['access_token']);
         })
         .catch((err) => {
            console.error('Something went wrong when retrieving an access token', err);
         });

      this.urls = {
         pattern: /https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist)\/([a-zA-Z0-9]{22})/,
      };
   }

   async refreshAccessToken() {
      const data = await this.api.clientCredentialsGrant();
      this.api.setAccessToken(data.body['access_token']);
      this.expiration = new Date().getTime() / 1000 + data.body['expires_in'];
      return data.body['access_token'];
   }

   async request<T>(call: () => Promise<T>, retries = 5): Promise<T> {
      for (let i = 0; i < retries; i++) {
         try {
            if (this.expiration < new Date().getTime() / 1000) await this.refreshAccessToken();
            return await call();
         } catch (err: any) {
            if (err.statusCode === 429) {
               const retryAfter = parseInt(err.headers?.['retry-after'], 10) || 5;
               Logger.warn(`Rate limit reached. Retrying in ${retryAfter} seconds...`);
               await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
            } else {
               Logger.error('[SPOTIFY] Request failed', err);
            }
         }
      }
      throw new Error('Maximum number of retry attempts reached.');
   }

   async search(query: string, options: SpotifySearchOptions = { types: ['track'] }): Promise<SpotifySearchResult> {
      if (this.urls.pattern.test(query)) {
         return await this.resolve(query);
      } else {
         let result = await this.request(() => this.api.search(query, options?.types, options));
         if (!result.body || !result.body.tracks || !result.body.tracks.items) {
            throw new Error('No results found for query: ' + query);
         }

         return {
            type: options.types.length > 1 ? 'search' : options.types[0],
            items: {
               tracks:
                  result.body.tracks.items.filter((track) => (track.album.album_type == 'single' ? null : track)).map((track) => this.build(track)) ||
                  [],
               artists:
                  result.body.artists?.items
                     .filter((artist) => artist.images?.[0]?.url)
                     .map((artist) => ({
                        type: 'artist',
                        id: artist.id,
                        name: artist.name,
                        icon: artist.images?.[0]?.url,
                        popularity: artist.popularity,
                        url: artist.external_urls?.spotify,
                        genres: artist.genres,
                        followers: artist.followers,
                     })) || [],
               albums:
                  result.body.albums?.items.map((album) => ({
                     type: 'album',
                     id: album.id,
                     name: album.name,
                     artists: album.artists.map((artist) => ({ name: artist.name, id: artist.id })),
                     total: album.total_tracks,
                     icon: album.images[0]?.url,
                     url: album.external_urls.spotify,
                     tracks: [],
                  })) || [],
               playlists: [],
            },
         };
      }
   }

   async resolve(url: string): Promise<SpotifySearchResult> {
      const match = this.urls.pattern.exec(url);
      if (!match) {
         throw new Error('Invalid Spotify URL: ' + url);
      }
      const type = match[1];
      const id = match[2];

      let result;
      switch (type) {
         case 'track':
            result = await this.getTrack(id);
            break;
         case 'album':
            result = await this.getAlbum(id);
            break;
         case 'playlist':
            result = await this.getPlaylist(id);
            break;
         default:
            throw new Error('Type not supported: ' + type);
      }

      if (!result) {
         throw new Error(`No results found for ${type} with ID: ${id}`);
      }

      return {
         type,
         items: {
            tracks: type === 'track' ? [result as SpotifyTrack] : [],
            albums: type === 'album' ? [result as SpotifyAlbum] : [],
            playlists: type === 'playlist' ? [result as SpotifyPlaylist] : [],
            artists: [],
         },
      };
   }

   async getPlaylist(id: string): Promise<SpotifyPlaylist | undefined> {
      let playlist;
      try {
         playlist = await this.request(() => this.api.getPlaylist(id).then((playlist) => playlist.body));
      } catch (err) {
         console.error('Failed to fetch playlist:', id, err);
         return;
      }

      if (playlist.tracks.total === 0) return;

      let items = [...playlist.tracks.items];
      const total = playlist.tracks.total;

      if (total > 100) {
         for (let offset = 100; offset < total; offset += 100) {
            const tracksPage = await this.request(() => this.api.getPlaylistTracks(id, { offset, limit: 100 }).then((res) => res.body.items)).catch(
               (error: any) => {
                  Logger.error('Failed to fetch playlist tracks:', error);
                  return [];
               }
            );

            items.push(...tracksPage);
         }
      }

      return {
         type: 'playlist',
         id: playlist.id,
         name: playlist.name,
         artist: playlist.owner.display_name,
         description: playlist.description,
         icon: playlist.images[0]?.url,
         url: playlist.external_urls.spotify,
         tracks: items.map((item) => (item.track ? this.build(item.track) : undefined)).filter(Boolean) as SpotifyTrack[],
         total,
      };
   }

   async getTrack(id: string): Promise<SpotifyTrack | undefined> {
      const track = await this.request(() => this.api.getTrack(id).then((track) => track.body));
      return this.build(track);
   }

   async getAlbum(id: string): Promise<SpotifyAlbum | undefined> {
      const album = await this.request(() => this.api.getAlbum(id).then((album) => album.body));

      return {
         type: 'album',
         id: album.id,
         name: album.name,
         artists: album.artists,
         icon: album.images[0].url,
         url: album.external_urls.spotify,
         total: album.tracks.total,
         tracks: album.tracks.items,
      };
   }

   async getTopResults(query: string) {
      const { artists, albums, tracks } = await this.search(query, {
         types: ['artist', 'album', 'track'],
         limit: 15,
      }).then(async (res) => {
         const tracks = res.items.tracks;
         const albums = await Promise.all(
            (res.items.albums ?? [])
               .filter((item) => item.type == 'album')
               .map(async (item, index) => {
                  if (index > 0) return item;
                  const album = await this.getAlbum(item.id);
                  return album;
               })
         );
         const artists = res.items.artists;

         return { artists, albums, tracks };
      });
      if (!tracks || !albums || !artists) return null;

      type ItemType = 'album' | 'artist' | 'track';
      const priority: Record<ItemType, number> = {
         album: 1.3,
         artist: 1.1,
         track: 1.2,
      };
      let mathes: { name: string; type: ItemType; popularity: number }[] = [];
      let result = [tracks[0], albums[0], artists[0]] as {
         name: string;
         type: ItemType;
         popularity: number;
      }[];
      result = result.map((item) => {
         if (item?.name.toLowerCase().includes(query.toLowerCase())) mathes.push(item);
         return item;
      });

      if (mathes.length > 1) {
         result = mathes.sort((a, b) => b.popularity * priority[b.type] - a.popularity * priority[a.type]);
      } else if (mathes.length == 1) {
         result = mathes;
      } else {
         result = result.sort((a, b) => b.popularity * priority[b.type] - a.popularity * priority[a.type]);
      }

      return {
         tracks: tracks,
         albums: albums,
         artists: artists,
         top: { ...result[0] },
      };
   }

   build(track: SpotifyApi.TrackObjectFull): SpotifyTrack {
      return {
         type: 'track',
         source: 'spotify',
         id: track.id,
         name: track.name,
         url: track.external_urls.spotify,
         artist: {
            name: track.artists[0].name,
            id: track.artists[0].id,
            url: track.artists[0].external_urls.spotify,
         },
         duration: track.duration_ms,
         icon: track?.album?.images[0]?.url || undefined,
         album: {
            name: track.album.name,
            id: track.album.id,
            url: track.album.external_urls.spotify,
            icon: track.album.images[0]?.url,
            total: track.album.total_tracks,
         },
      };
   }
}
