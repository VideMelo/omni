import { Client as DeezerApi, Track as DeezerTrack } from 'deezer-ts';
import fs from 'node:fs/promises';
import Logger from '../utils/logger.js';
import { Track } from './Media.js';

export interface RadioPlaylist {
   genre: {
      name: string;
      id: number;
      icon: string;
   };
   playlists: {
      name: string;
      description: string;
      id: number;
      tracks?: Track[];
      icon: string;
   }[];
}

export default class Deezer {
   public api;
   constructor() {
      this.api = new DeezerApi({ headers: 'Accept-Language: en' });
   }

   async buildRadiosPlaylists(genres: number[]): Promise<RadioPlaylist[] | undefined> {
      if (!genres.length) return;
      const lists = await Promise.all(
         genres.map(async (id) => {
            const genre = await this.api.getGenre(id);
            const playlists = await this.api.getPlaylistsChart(id);
            return {
               genre,
               playlists,
            };
         })
      );

      const radios = lists.map((radio) => {
         return {
            genre: {
               name: radio.genre.name,
               id: radio.genre.id,
               icon: radio.genre.picture_medium,
            },
            playlists: radio.playlists.map((list) => {
               return {
                  name: list.title,
                  description: list.description,
                  id: list.id,
                  icon: list.picture_medium,
               };
            }),
         };
      });
      return radios;
   }

   async getPlaylistTracks(id: any): Promise<Track[]> {
      const tracks = (await this.api.request('GET', `playlist/${id}/tracks`, false)) as DeezerTrack[];
      return tracks.map((track) => {
         return new Track({
            id: String(track.id),
            name: track.title,
            source: 'deezer',
            url: track.link || '',
            icon: track.album.cover_medium,
            artist: {
               id: String(track.artist.id),
               name: track.artist.name,
               icon: track.artist.picture_medium,
               url: track.artist.link,
            },
            album: {
               id: String(track.album.id),
               name: track.album.title,
               icon: track.album.cover_medium,
            },
            duration: track.duration * 1000,
            explicit: !!track.explicit_content_lyrics,
         });
      });
   }
}
