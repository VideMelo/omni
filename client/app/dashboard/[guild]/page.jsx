'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

import socket from 'source/services/socket';

import Player from 'components/Player';

import Arrow from 'assets/icons/arrow.svg';
import VolumeHigh from 'assets/icons/volume-high.svg';
import Search from 'assets/icons/search.svg';

export default function Guild() {
   const [guild, setGuild] = useState(null);
   const [channels, setChannels] = useState(null);
   const [queue, setQueue] = useState(null);

   const [search, setSearch] = useState(null);
   const [view, setView] = useState('queue'); // 'queue' | 'search

   function handleSearch(query) {
      if (!query) return setSearch(null);
      socket.emit('search', query, (data) => {
         setSearch(data);
         setView('search');
      });
   }

   useEffect(() => {
      const id = window.location.pathname.split('/')[2];
      socket.emit('leave-guild');
      socket.emit('get-guild', id, (guild) => {
         socket.emit('join-guild', { guild: id }, () => {
            socket.emit('get-voiceChannels', setChannels);
            socket.emit('get-queue', setQueue);
         });
         setGuild(guild);
      });
      socket.on('update-player', () => {
         socket.emit('get-queue', setQueue);
         socket.emit('get-voiceChannels', setChannels);
      });
   }, []);

   const [showEvent, setShowEvent] = useState(false);
   const [eventValue, setEventValue] = useState('Event');
   function Event(value) {
      setEventValue(value);
      setShowEvent(true);
      setTimeout(() => {
         setShowEvent(false);
      }, 2000);
   }

   if (!guild || !channels || !queue) return null;
   console.log(guild, channels, queue, search);
   return (
      <main className="flex min-h-max flex-col items-center justify-between">
         <div className="container flex justify-between w-full gap-8">
            <div className="flex flex-col w-80 items-center">
               <div className="flex w-full cursor-pointer rounded-2xl bg-[#191919] border-[1.25px] px-4 py-3 border-[#393939] items-center bg-color ">
                  <Image
                     src={guild.icon}
                     alt="Guild icon"
                     width={32}
                     height={32}
                     className="rounded-full"
                  />
                  <span className="text-white w-full ml-5 font-bold">{guild.name}</span>
                  <Arrow className="w-6 h-6" />
               </div>
               <hr className="w-[85%] border-[#393939] my-5" />
               {channels.map((channel, index) => (
                  <div key={index} className="flex flex-col w-full">
                     <div className="flex items-center mb-3 cursor-pointer">
                        <VolumeHigh className="w-7 h-7 mr-2 opacity-80 stroke-white" />
                        <span
                           className={
                              (channel.id === queue.metadata.voice?.id
                                 ? 'text-blue-600'
                                 : 'text-white') + ' flex items-center w-full text-[18px]'
                           }
                           onClick={() => {
                              if (channel.id == queue.metadata.voice?.id)
                                 return socket.emit('leave-VoiceChannel');
                              socket.emit('join-voiceChannel', channel.id);
                           }}
                        >
                           {channel.name}
                        </span>
                     </div>
                  </div>
               ))}
            </div>
            <div className="flex flex-col w-full">
               <div className="flex items-center justify-between gap-2 w-full">
                  <span className="text-white text-2xl font-bold capitalize">{view}</span>

                  <div className="flex items-center">
                     <svg
                        className={view === 'queue' ? 'hidden' : 'mr-5 cursor-pointer'}
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        onClick={() => setView('queue')}
                     >
                        <path
                           d="M6 6L18 18M6 18L18 6L6 18Z"
                           stroke="#FFFFFF"
                           strokeWidth="2"
                           strokeLinecap="round"
                           strokeLinejoin="round"
                        />
                     </svg>
                     <div className="flex w-80 cursor-text rounded-2xl bg-[#191919] border-[1.25px] px-4 py-3 !outline-none border-[#393939] items-center bg-color">
                        <Search
                           className="w-6 h-6 cursor-pointer"
                           onClick={(event) => {
                              handleSearch(event.target.value);
                           }}
                        />
                        <input
                           type="text"
                           id="search"
                           autoComplete="off"
                           placeholder="Search a track"
                           className="!bg-transparent !text-white w-full ml-5 !outline-none placeholder:opacity-50"
                           onKeyUp={(event) => {
                              if (event.key === 'Enter') handleSearch(event.target.value);
                           }}
                        />
                     </div>
                  </div>
               </div>
               <hr className="w-full border-[#393939] my-7" />
               <ul className="flex flex-col h-[30vw] overflow-y-auto gap-4">
                  {view === 'search'
                     ? search.data.type == 'track'
                        ? search?.items.map((track, index) => (
                             <li
                                key={index}
                                className="flex flex-col cursor-pointer w-full"
                                onClick={() => {
                                   socket.emit('new-track', track, () => {
                                      Event('New Track Added!');
                                   });
                                }}
                             >
                                <div className="flex gap-2 items-center">
                                   <Image
                                      src={track.thumbnail}
                                      alt="Track thumbnail"
                                      width={55}
                                      height={55}
                                      className="rounded-[3px]"
                                   />
                                   <div className="flex flex-col w-full">
                                      <span className="text-white text-base font-bold">
                                         {track.name}
                                      </span>
                                      <span className="text-white text-sm opacity-50">
                                         {track.artists}
                                      </span>
                                   </div>
                                   <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-6 w-6 text-[#BBC1C4]"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                   >
                                      <path
                                         strokeLinecap="round"
                                         strokeLinejoin="round"
                                         strokeWidth={2}
                                         d="M12 4v16m8-8H4"
                                      />
                                   </svg>
                                </div>
                                <hr className="w-full border-[#393939] my-5" />
                             </li>
                          ))
                        : null
                     : queue.list.map((track, index) => (
                          <li
                             key={index}
                             className="flex flex-col cursor-pointer w-full"
                             onClick={() => {
                                socket.emit('skip-to', track);
                             }}
                          >
                             <div className="flex gap-2 items-center">
                                <Image
                                   src={track.thumbnail}
                                   alt="Track thumbnail"
                                   width={55}
                                   height={55}
                                   className="rounded-[3px]"
                                />
                                <div className="flex flex-col">
                                   <span className="text-white text-base font-bold">
                                      {track.name}
                                   </span>
                                   <span className="text-white text-sm opacity-50">
                                      {track.artists}
                                   </span>
                                </div>
                             </div>
                             <hr className="w-full border-[#393939] my-5" />
                          </li>
                       ))}
               </ul>
            </div>
         </div>
         <div className="flex flex-wrap justify-center gap-4 fixed bottom-0 left-0 w-full">
            {showEvent && (
               <button className="h-[60px] px-7 rounded-lg cursor-pointer bg-blue-500 shadow-2xl max-sm:px-5 max-sm:w-full">
                  <span className="flex items-center justify-center text-white w-full font-medium text-right whitespace-nowrap text-lg max-sm:text-[13px]">
                     {eventValue}
                  </span>
               </button>
            )}
            <Player data={queue} />
         </div>
      </main>
   );
}
