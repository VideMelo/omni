import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import ItemList from '../components/ItemList.js';
import socket from '../services/socket.js';

type Artist = {
   id: string;
   name: string;
   thumbnail?: string;
   icon?: string;
   type: 'artist';
};

type Album = {
   id: string;
   name: string;
   thumbnail?: string;
   artist: Artist;
   type: 'album';
};

type Track = {
   id: string;
   name: string;
   thumbnail?: string;
   artist: Artist;
   type: 'track';
};

type TopResult = {
   id: string;
   name: string;
   thumbnail?: string;
   icon?: string;
   type: 'artist' | 'album' | 'track';
   artists?: Artist[];
   artist?: Artist;
};

type SearchResult = {
   items: {
      tracks: Track[];
      albums: Album[];
      artists: Artist[];
      top: TopResult;
   };
};

export default function Page() {
   const [searchParams] = useSearchParams();
   const query = searchParams.get('q');
   const navigate = useNavigate();

   const [loading, setLoading] = useState<boolean>(true);
   const [tracks, setTracks] = useState<Track[]>([]);
   const [albums, setAlbums] = useState<Album[]>([]);
   const [artists, setArtists] = useState<Artist[]>([]);
   const [top, setTop] = useState<TopResult | null>(null);

   useEffect(() => {
      setLoading(true);
      if (query) {
         socket.emit('search:top', query, (result: SearchResult) => {
            setTracks(result.items.tracks);
            setAlbums(result.items.albums);
            setArtists(result.items.artists);
            setTop(result.items.top);
            setLoading(false);
         });
      } else navigate('/');
   }, [navigate, query]);

   function handleItemClick(item: Track | Album | Artist) {
      socket.emit('player:play', item);
   }

   if (loading)
      return (
         <main className="w-full flex flex-col p-6 gap-3">
            <div className="flex flex-col w-full gap-3">
               <div className="flex items-center shrink-0 font-medium text-2xl text">Searching...</div>
               <div className="flex gap-6">
                  <div className="flex flex-col gap-2 w-full">
                     <div className="flex gap-1 p-4 w-full bg-black animate-pulse bg-opacity-40 hover:bg-opacity-50 rounded-2xl cursor-pointer">
                        <div className="flex w-full gap-4">
                           <div className={`h-[135px] w-[135px] shrink-0 animate-pulse bg-white bg-opacity-5 rounded-md`} />
                           <div className="flex flex-col py-1 w-full"></div>
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col w-full">
                     {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 cursor-pointer p-1 rounded-md">
                           <div className="h-[50px] w-[50px] rounded-md animate-pulse bg-white bg-opacity-5" />
                           <div className="flex flex-col gap-1">
                              <div className="font-medium h-3 w-40 animate-pulse bg-white bg-opacity-5"></div>
                              <div className="font-normal h-3 w-20 animate-pulse bg-white bg-opacity-5"> </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
            <div className="flex flex-col gap-5">
               <ItemList />
               <ItemList />
            </div>
         </main>
      );
   if (!top?.id || !tracks.length || !artists.length || !albums.length) return null;
   return (
      <main className="w-full flex flex-col p-6 gap-3">
         <div>
            <div className="flex flex-col w-full gap-3">
               <div className="flex items-center shrink-0 font-medium text-2xl text">Top Result</div>
               <div className="flex gap-6">
                  <div className="flex flex-col gap-2 w-full">
                     <div className="flex gap-1 p-4 w-full bg-black bg-opacity-40 hover:bg-opacity-50 rounded-2xl cursor-pointer">
                        <div className="flex w-full gap-4">
                           <img
                              src={top?.thumbnail || top?.icon}
                              className={`h-[135px] w-[135px] shrink-0 ${top?.type == 'artist' ? 'rounded-full' : 'rounded-md'}`}
                           />
                           <div className="flex flex-col py-1 w-full">
                              <div className="font-poppins font-bold text-3xl mb-2">{top?.name}</div>
                              {top?.type === 'artist' ? (
                                 <div className="font-poppins font-normal text-base text-[#B3B3B3] capitalize">{top.type}</div>
                              ) : (
                                 <div className="font-poppins font-normal text-base text-[#B3B3B3]">
                                    <span className="capitalize text-white">{top?.type}</span> -{' '}
                                    {top?.artists ? top.artists[0].name : top?.artist?.name}
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="flex flex-col w-full">
                  {tracks.slice(0, 3).map(({ name, artist, thumbnail, id }) => (
                     <div key={id} className="flex items-center gap-3 cursor-pointer hover:bg-white hover:bg-opacity-5 p-1 rounded-md">
                        <img src={thumbnail} className="h-[50px] w-[50px] rounded-md" />
                        <div>
                           <div className="font-medium text-sm font-poppins text-white">{name}</div>
                           <div className="font-normal text-xs font-poppins text-[#B3B3B3]">{artist.name}</div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
         <div className="flex flex-col gap-5">
            <ItemList
               data={tracks}
               onClick={(event: React.MouseEvent, item: Track) => handleItemClick(item)}
               newTrack={(event: React.MouseEvent, track: Track) => {
                  event.stopPropagation();
                  socket.emit('queue:new', track);
               }}
            />
            <ItemList data={albums} />
            <ItemList data={artists} />
         </div>
      </main>
   );
}
