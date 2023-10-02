import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import queryString from 'query-string';
import Cookies from 'js-cookie';

import socket from '../services/socket.js';
import Auth from '../hooks/auth.js';

import Player from 'components/Player.jsx';
import QueueItem from 'components/QueueItem.jsx';
import Icon from 'components/Icon.jsx';

export default function Dashboard() {
   const navigate = useNavigate();
   const location = useLocation();
   const invite = Auth({
      redirectUri: `${import.meta.env.VITE_API_URL}/auth-guild`,
      clientId: import.meta.env.VITE_DISCORD_ID,
      authUrl: 'https://discord.com/oauth2/authorize',
      scopes: ['bot', 'applications.commands'],
      auth: 'invite',
      onSuccess: (data) => {
         navigate(`/dashboard?guild=${data.guild}`);
      },
   });

   const [guilds, setGuilds] = useState(null);
   const [guild, setGuild] = useState(null);
   const token = Cookies.get('auth-token');

   const [showPlayer, setShowPlayer] = useState(false);

   useEffect(() => {
      const params = queryString.parse(location.search);
      const guild = params.guild;

      if (!guild) {
         if (!token) return;
         socket.emit('leave');
         socket.emit('get-guilds', token, (data) => {
            setGuilds(data);
         });
         return setShowPlayer(false);
      }

      console.log('guild', guild);
      socket.emit('leave-guild');
      socket.emit('get-guild', guild, (data) => {
         socket.emit('join-guild', { guild }, () => {
            socket.emit('get-voiceChannels', setChannels);
            socket.emit('get-queue', (data) => {
               setQueue(data);
               setShowPlayer(true);
            });

            console.log(guild);
         });
         setGuild(data);
      });
      socket.on('update-player', () => {
         socket.emit('get-queue', setQueue);
         socket.emit('get-voiceChannels', setChannels);
      });
   }, [location.search]);

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

   const [showEvent, setShowEvent] = useState(false);
   const [eventValue, setEventValue] = useState('Event');
   function Event(value) {
      setEventValue(value);
      setShowEvent(true);
      setTimeout(() => {
         setShowEvent(false);
      }, 2000);
   }

   if (!showPlayer) {
      if (!guilds) return null;
      return (
         <main className="flex min-h-max justify-center items-center p-24">
            <div className="flex w-[580px] flex-wrap gap-4 text-white bg-[#191919] py-5 px-6 border-[1.25px] border-[#393939] rounded-2xl">
               <h4 className="text-2xl font-medium w-full text-[#BBC1C4]">Your Servers</h4>
               <hr className="w-full border-[#393939] mb-5" />
               <ul className="flex w-full flex-col gap-4">
                  {guilds.map((guild, index) => (
                     <li
                        key={index}
                        className={
                           'w-full flex items-center cursor-pointer ' +
                           (guild.join ? 'opacity-50 hover:opacity-100' : '')
                        }
                        onClick={() => {
                           if (guild.join) {
                              invite({ guildId: guild.id });
                           } else {
                              navigate(`/dashboard?guild=${guild.id}`);
                           }
                        }}
                     >
                        <div
                           className="h-14 w-[8px] rounded-full mr-3"
                           style={{ backgroundColor: guild.color }}
                        />
                        <div className="flex flex-col w-full justify-between">
                           <span className="text-white text-xl font-bold">{guild.name}</span>
                           <span className="text-sm h-fit text-blue-600 mt-2 w-fit bg-blue-600 bg-opacity-10 font-semibold py-1 px-2 text-[16px] rounded-lg">
                              {guild.owner ? 'Owner' : 'Member'}
                           </span>
                        </div>
                        {guild.join ? (
                           <Icon
                              src="icons/plus.svg"
                              classNames={{ icon: 'h-6 w-6 text-[#BBC1C4]' }}
                           />
                        ) : (
                           <Icon
                              src="icons/arrow.svg"
                              classNames={{ icon: 'h-6 w-6 text-[#BBC1C4] -rotate-90' }}
                           />
                        )}
                     </li>
                  ))}
               </ul>
            </div>
         </main>
      );
   } else {
      return (
         <main className="flex min-h-max flex-col items-center justify-between">
            <div className="container flex justify-between w-full gap-8">
               <div className="flex flex-col w-80 items-center">
                  <div className="flex w-full cursor-pointer rounded-2xl bg-[#191919] border-[1.25px] px-4 py-3 border-[#393939] items-center bg-color ">
                     <img src={guild.icon} alt="Guild icon" className="rounded-full h-8 w-8" />
                     <span className="text-white w-full ml-5 font-bold">{guild.name}</span>
                     <Icon src="icons/arrow.svg" classNames={{ icon: 'w-6 h-6' }} />
                  </div>
                  <hr className="w-[85%] border-[#393939] my-5" />
                  {channels.map((channel, index) => (
                     <div key={index} className="flex flex-col w-full">
                        <div className="flex items-center mb-3 cursor-pointer">
                           <span
                              className={
                                 (channel.id === queue.metadata.voice?.id
                                    ? 'text-blue-600'
                                    : 'text-white') + ' flex items-center w-full text-[18px]'
                              }
                              onClick={() => {
                                 if (channel.id == queue.metadata.voice?.id)
                                    return socket.emit('leave-voiceChannel');

                                 socket.emit('join-voiceChannel', channel.id);
                              }}
                           >
                              <span className="text-3xl mr-2">•</span> {channel.name}
                           </span>
                        </div>
                     </div>
                  ))}
               </div>
               {queue.metadata.voice ? (
                  <div className="flex flex-col w-full">
                     <div className="flex items-center justify-between gap-2 w-full">
                        <span className="text-white text-2xl font-bold capitalize">{view}</span>

                        <div className="flex items-center">
                           <Icon
                              src="icons/plus.svg"
                              classNames={{
                                 icon:
                                    view === 'queue'
                                       ? 'hidden'
                                       : 'mr-5 w-6 h-6 cursor-pointer rotate-45',
                              }}
                              onClick={() => setView('queue')}
                           />
                           <div className="flex w-80 cursor-text rounded-2xl bg-[#191919] border-[1.25px] px-4 py-3 !outline-none border-[#393939] items-center bg-color">
                              <Icon
                                 src="icons/search.svg"
                                 classNames={{ icon: 'w-6 h-6 cursor-pointer' }}
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
                     <ul className="flex flex-col h-[30vw] overflow-y-auto gap-1">
                        {view === 'search'
                           ? search.data.type == 'track'
                              ? search?.items.map((track, index) => (
                                   <li
                                      key={index}
                                      className="flex hover:bg-white/10 p-2 rounded-lg items-center"
                                   >
                                      <QueueItem item={track} />
                                      <Icon
                                         src="icons/plus.svg"
                                         classNames={{
                                            icon: 'h-6 w-6 text-[#BBC1C4] cursor-pointer',
                                         }}
                                         onClick={() => {
                                            socket.emit('new-track', track, () => {
                                               Event('New Track Added!');
                                            });
                                         }}
                                      />
                                   </li>
                                ))
                              : null
                           : queue.list.map((track, index) => (
                                <li
                                   key={index}
                                   className="flex hover:bg-white/10 p-2 rounded-lg items-center"
                                >
                                   <QueueItem
                                      item={track}
                                      onClick={() => {
                                         socket.emit('skip-to', track.index);
                                      }}
                                   />
                                </li>
                             ))}
                     </ul>
                  </div>
               ) : (
                  <div className="flex justify-center items-center opacity-70 w-full">
                     Select a voice channel to start listening to music!
                  </div>
               )}
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
}
