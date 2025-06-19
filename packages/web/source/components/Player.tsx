import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import axios from 'axios';

import Slider from './Slider.js';
import Vibrant from 'node-vibrant';

import socket from '../services/socket.js';

import Play from '../assets/icons/Play.js';
import Previous from '../assets/icons/Previous.js';
import Next from '../assets/icons/Next.js';
import Pause from '../assets/icons/Pause.js';
import Shuffle from '../assets/icons/Shuffle.js';
import Repeat from '../assets/icons/Repeat.js';
import RepeatOnce from '../assets/icons/RepeatOnce.js';
import VolumeHigh from '../assets/icons/VolumeHigh.js';
import VolumeLow from '../assets/icons/VolumeLow.js';
import Plus from '../assets/icons/Plus.js';
import Headphone from '../assets/icons/Headphone.js';
import List from '../assets/icons/List.js';
import Lyrics from '../assets/icons/Lyrics.js';
import { usePlayer } from '../contexts/PlayerContext.js';

function Player() {
   const location = useLocation();
   const { state, dispatch } = usePlayer();
   const { track, playing, paused, timer, palette, cover, repeat, shuffled, volume, queue, voice } = state;

   useEffect(() => {
      if (!playing) return;
      const interval = setInterval(() => {
         if (!paused) {
            dispatch({ type: 'SET_TIMER', payload: timer + 1 });
         }
      }, 1000);
      return () => clearInterval(interval);
   }, [playing, paused, track, timer]);

   useEffect(() => {
      if (!track) return;
      fetchTrackAnimatedCover(track);
   }, [track]);

   useEffect(() => {
      socket.emit('voice:sync', updatePlayer);

      socket.on('user:voice.update', () => socket.emit('voice:sync', updatePlayer));
      socket.on('bot:voice.update', () => socket.emit('voice:sync', updatePlayer));
      socket.on('player:update', updatePlayer);

      return () => {
         socket.off('user:voice.update');
         socket.off('bot:voice.update');
         socket.off('player:update');
      };
   }, []);

   function updatePlayer() {
      socket.emit('queue:get', (data: any) => {
         if (!data) return dispatch({ type: 'RESET' });
         dispatch({ type: 'SET_QUEUE', payload: data.list });
         dispatch({ type: 'SET_TRACK', payload: { ...data.current, duration: data.current?.duration || 0 } });
         dispatch({ type: 'SET_COVER', payload: data.current?.thumbnail });
         dispatch({ type: 'SET_REPEAT', payload: data.repeat });
         dispatch({ type: 'SET_SHUFFLED', payload: data.shuffled });
         handlePalette(data.current?.thumbnail);
      });

      socket.emit('player:get', (data: any) => {
         if (!data) return dispatch({ type: 'RESET' });
         dispatch({ type: 'SET_PLAYING', payload: data.playing });
         dispatch({ type: 'SET_PAUSED', payload: data.paused });
         dispatch({ type: 'SET_VOLUME', payload: data.volume });
         dispatch({ type: 'SET_TIMER', payload: data.position / 1000 });
         dispatch({ type: 'SET_VOICE', payload: data.metadata?.voice.name });
      });
   }

   async function fetchTrackAnimatedCover(track: any) {
      try {
         if (!track.album || !track.artist) return;
         const response = await axios.get('https://ws.audioscrobbler.com/2.0/', {
            params: {
               method: 'album.search',
               album: `${track.album.name} ${track.artist.name}`,
               api_key: 'ce49f501a7fc72f53ad8a9b0e3bfd86c',
               format: 'json',
            },
         });

         const albums = response.data.results.albummatches.album;
         if (albums.length > 0) {
            const image = albums[0]?.image[3]['#text'];
            const fetch = await axios.head(image);
            const contentType = fetch.headers['content-type'];

            if (contentType === 'image/gif') dispatch({ type: 'SET_COVER', payload: image });
         }
      } catch (error: any) {
         console.error('Error fetching album:', error.message);
      }
   }

   function handlePalette(image: any) {
      if (!image) return;
      function calculateResultingColor(upperColor: any, lowerColor: any, alpha: any) {
         function calculateChannel(upperChannel: any, lowerChannel: any, alpha: any) {
            return Math.round(upperChannel * alpha + lowerChannel * (1 - alpha));
         }

         return [
            calculateChannel(upperColor[0], lowerColor[0], alpha), // R
            calculateChannel(upperColor[1], lowerColor[1], alpha), // G
            calculateChannel(upperColor[2], lowerColor[2], alpha), // B
         ];
      }

      const vibrant = new Vibrant(image);
      vibrant.getPalette().then((palette) => {
         const color = palette.Vibrant!.rgb;
         const alphaArr = calculateResultingColor(color, [0, 0, 0], 0.25);
         const alpha =
            '#' +
            alphaArr
               .map((canal) => {
                  const hex = canal.toString(16);
                  return hex.length === 1 ? '0' + hex : hex;
               })
               .join('');
         dispatch({
            type: 'SET_PALETTE',
            payload: {
               ...palette,
               alpha,
            },
         });
      });
   }

   function handleItemClick(item: any) {
      socket.emit('player:play', item);
   }

   if (!state || !track || !palette || !cover) return null;
   return (
      <div className={`flex min-w-[400px] max-w-[400px] flex-col gap-3 h-full`}>
         <div
            className={`relative overflow-auto scrollbar-none h-full flex-col items-center flex rounded-3xl`}
            style={{ backgroundColor: palette.alpha }}
         >
            <div
               className={`relative w-[400px] h-[400px] duration-700 transi ease-out delay-75 ${location.pathname == '/queue' ? '-mt-[730px]' : ''}`}
            >
               <img src={cover} className="w-full h-full object-cover rounded-t-3xl" />
               <div
                  className="absolute"
                  style={{
                     inset: 0,
                     backgroundImage: `linear-gradient(to bottom, transparent 35%, ${palette.alpha} 100%)`,
                  }}
               ></div>
            </div>
            <div className={`flex flex-col w-full gap-5 px-6 z-[1] -mt-[25px] ${!playing ? 'cursor-wait' : ''}`}>
               <div className={`flex flex-col gap-3 ${!playing ? 'animate-pulse pointer-events-none' : ''}`}>
                  <div className="flex w-full px-1 items-center justify-between">
                     <div className="w-[85%]">
                        <div className="font-semibold text-lg font-poppins truncate">{track.name}</div>
                        <div className="font-normal text-lg font-poppins text-[#B3B3B3]">{track.artist.name}</div>
                     </div>
                     <button onClick={() => socket.emit('')}>
                        <Plus className="w-6 h-6" />
                     </button>
                  </div>
                  <Slider
                     value={timer}
                     duration={track.duration / 1000}
                     onChange={(value: any) => {
                        dispatch({ type: 'SET_TIMER', payload: value.time });
                     }}
                     onCommit={(value: any) => {
                        dispatch({ type: 'SET_TIMER', payload: value.time });
                        socket.emit('player:seek', value.time);
                     }}
                  />
               </div>
               <div className={`flex w-full justify-center gap-10 items-center ${!playing ? 'animate-pulse pointer-events-none' : ''}`}>
                  <button onClick={() => socket.emit('player:previous')}>
                     <Previous className="w-[50px] h-[50px] fill-white" />
                  </button>
                  {paused ? (
                     <button onClick={() => socket.emit('player:resume')}>
                        <Play className="w-16 h-16 fill-white" />
                     </button>
                  ) : (
                     <button onClick={() => socket.emit('player:pause')}>
                        <Pause className="w-16 h-16 fill-white" />
                     </button>
                  )}
                  <button onClick={() => socket.emit('player:next')}>
                     <Next className="w-[50px] h-[50px] fill-white" />
                  </button>
               </div>
               <div className="flex w-full justify-center gap-2 items-center">
                  <button onClick={() => socket.emit('player:volume', volume >= 10 ? volume - 10 : volume)}>
                     <VolumeLow className="w-[30px] h-[30px] fill-white" />
                  </button>
                  <Slider
                     value={volume}
                     duration={100}
                     onChange={() => {}}
                     onCommit={(value: any) => socket.emit('player:volume', value.time)}
                     showTimers={false}
                  />
                  <button onClick={() => socket.emit('player:volume', volume <= 90 ? volume + 10 : volume)}>
                     <VolumeHigh className="w-[30px] h-[30px] fill-white" />
                  </button>
               </div>
               <div
                  className="flax w-full rounded-[20px] px-6 py-4 justify-center gap-10 items-center"
                  style={{ backgroundColor: palette.LightVibrant.hex }}
               >
                  <div className="font-medium uppercase text-sm text-black text-opacity-50">Playing From Party</div>
                  <div className="flex items-center gap-2">
                     <Headphone className="w-6 h-6 text-black text-opacity-80" />
                     <div className="font-medium text-lg text-black text-opacity-80">{voice}</div>
                  </div>
               </div>
            </div>
            <div className="mt-8 w-full flex flex-1 p-4 flex-col bg-black bg-opacity-50 rounded-[20px]">
               <div className="flex w-full justify-between px-6 py-2">
                  <div className="flex gap-4 ">
                     <button className={`p-2 rounded-md hover:bg-white hover:bg-opacity-10`} onClick={() => {}}>
                        <Lyrics className="w-6 h-6 fill-white" />
                     </button>
                     <button
                        className={`p-2 rounded-md hover:bg-white hover:bg-opacity-10`}
                        onClick={() => socket.emit('queue:repeat', repeat === 'off' ? 'queue' : repeat === 'queue' ? 'track' : 'off')}
                     >
                        {repeat == 'track' ? (
                           <RepeatOnce className="w-6 h-6 fill-white" style={{ fill: palette.Vibrant.hex }} />
                        ) : (
                           <Repeat className={`w-6 h-6`} style={{ fill: repeat !== 'off' ? palette.Vibrant.hex : 'white' }} />
                        )}
                     </button>
                  </div>
                  <div className="flex gap-4">
                     <button className={`p-2 rounded-md hover:bg-white hover:bg-opacity-10`} onClick={() => socket.emit('queue:shuffle', !shuffled)}>
                        <Shuffle className="w-6 h-6" style={{ fill: shuffled ? palette.Vibrant.hex : 'white' }} />
                     </button>
                     <button className={`p-2 rounded-md hover:bg-white hover:bg-opacity-10`} onClick={() => {}}>
                        <List className="w-6 h-6 fill-white" />
                     </button>
                  </div>
               </div>
               <div className="flex flex-col overflow-hidden gap-1 justify-between mt-6">
                  {queue.map((item: any) => (
                     <div
                        key={item.id}
                        className={`flex w-full items-center gap-3 cursor-pointer hover:bg-white hover:bg-opacity-5 rounded-md p-2 ${
                           item.id == track.id ? 'bg-white bg-opacity-5 hover:bg-opacity-10' : ''
                        }`}
                        onClick={() => handleItemClick(item)}
                     >
                        <img src={item.thumbnail} className="h-[50px] w-[50px] rounded-md" />
                        <div className="w-full">
                           <div className="font-medium text-sm font-poppins text-white w-1/2 truncate">{item.name}</div>
                           <div className="font-normal text-xs font-poppins text-[#B3B3B3]">{item.artist.name}</div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
}

export default Player;
