import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import axios from 'axios';

import Slider from './Slider';
import Vibrant from 'node-vibrant';

import socket from '../services/socket';

import Play from '../assets/icons/Play';
import Previous from '../assets/icons/Previous';
import Next from '../assets/icons/Next';
import Pause from '../assets/icons/Pause';
import Shuffle from '../assets/icons/Shuffle';
import Repeat from '../assets/icons/Repeat';
import RepeatOnce from '../assets/icons/RepeatOnce';
import VolumeHigh from '../assets/icons/VolumeHigh';
import VolumeLow from '../assets/icons/VolumeLow';
import Plus from '../assets/icons/Plus';
import Headphone from '../assets/icons/Headphone';
import List from '../assets/icons/List';
import Lyrics from '../assets/icons/Lyrics';

function Player({ metadata, setMetadata }) {
   const location = useLocation()

   const [queue, setQueue] = useState([])
   const [track, setTrack] = useState(null);
   const [cover, setCover] = useState(null);

   const [palette, setPalette] = useState(null);
   const [timer, setTimer] = useState(0)
   const [playing, setPlaying] = useState(false)

   const [player, setPlayer] = useState(null)

   useEffect(() => {
      if (!playing) return;
      const interval = setInterval(() => {
         setTimer((prev) => {
            if (prev >= track.duration) {
               clearInterval(interval);
               setPlaying(false);
               return 0;
            }
            return prev + 1;
         });
      }, 900);
      return () => clearInterval(interval);
   }, [playing, track, timer]);

   useEffect(() => {
      setMetadata({ queue, player, palette, track, timer })
   }, [queue, player, palette, track, timer])

   useEffect(() => {
      if (!track) return
      fetchTrackCover(track)
   }, [track])

   useEffect(() => {
      socket.emit('syncVoiceChannel', updatePlayer)

      socket.on('userVoiceUpdate', () => {
         socket.emit('syncVoiceChannel', updatePlayer)
      })

      socket.on('botVoiceUpdate', () => {
         socket.emit('syncVoiceChannel', updatePlayer)
      })

      socket.on('updatePlayer', updatePlayer)

   }, []);

   function setInitialState() {
      setQueue([])
      setTrack(null)
      setCover(null)
      setPlayer(null)
      setPlaying(false)
      setTimer(0)
      setPalette(null)
   }

   function updatePlayer() {
      socket.emit('getQueue', (data) => {
         if (!data) return setInitialState()
         setQueue(data.list)
         setTrack({ ...data.current, duration: data.current?.duration | 0 })
         setCover(data.current?.thumbnail)
         handlePalette(data.current?.thumbnail)
         console.log(data)
      })

      socket.emit('getPlayer', (data) => {
         if (!data) return setInitialState()
         setPlayer(data)
         setPlaying(data.playing)
         setTimer(data.position / 1000)
         console.log(data)
      })

   }

   async function fetchTrackCover(track) {
      try {
         const response = await axios.get('https://ws.audioscrobbler.com/2.0/', {
            params: {
               method: 'album.search',
               album: `${track.album} ${track.artist}`,
               api_key: 'ce49f501a7fc72f53ad8a9b0e3bfd86c',
               format: 'json'
            }
         });

         const albums = response.data.results.albummatches.album;
         if (albums.length > 0) {
            const image = albums[0]?.image[3]['#text'];
            const fetch = await axios.head(image);
            const contentType = fetch.headers['content-type'];

            if (contentType === 'image/gif') setCover(image);

         }
      } catch (error) {
         console.error('Error fetching album:', error.message);

      }
   } 

   function handlePalette(image) {
      if (!image) return
      function calculateResultingColor(upperColor, lowerColor, alpha) {
         function calculateChannel(upperChannel, lowerChannel, alpha) {
            return Math.round(upperChannel * alpha + lowerChannel * (1 - alpha));
         }

         return [
            calculateChannel(upperColor[0], lowerColor[0], alpha), // R
            calculateChannel(upperColor[1], lowerColor[1], alpha), // G
            calculateChannel(upperColor[2], lowerColor[2], alpha)  // B
         ];
      }

      const vibrant = new Vibrant(image);
      vibrant.getPalette().then((palette) => {
         const color = palette.Vibrant.rgb;
         let alpha = calculateResultingColor(color, [0, 0, 0], 0.25);
         alpha = '#' + alpha
            .map(canal => {
               const hex = canal.toString(16);
               return hex.length === 1 ? '0' + hex : hex;
            })
            .join('');
         setPalette({
            ...palette,
            alpha
         });
      });
   }

   function handleItemClick(item) {
      socket.emit('play', item);
   }

   if (!track || !palette || !player) return null;
   return (
      <div className={`flex min-w-[400px] max-w-[400px] flex-col gap-3 h-full`}>
         <div className={`relative overflow-auto scrollbar-none h-full flex-col items-center flex rounded-3xl`} style={{ backgroundColor: palette.alpha }}>
            <div className={`relative w-[400px] h-[400px] duration-700 transi ease-out delay-75 ${location.pathname == '/queue' ? '-mt-[730px]' : ''}`}>
               <img
                  src={cover}
                  className="w-full h-full object-cover rounded-t-3xl"
               />
               <div className="absolute" style={{
                  inset: 0,
                  backgroundImage: `linear-gradient(to bottom, transparent 35%, ${palette.alpha} 100%)`
               }}></div>
            </div>
            <div className={`flex flex-col w-full gap-5 px-6 z-[1] -mt-[25px] ${!track?.initied ? 'cursor-wait' : ''}`}>
               <div className={`flex flex-col gap-3 ${!track?.initied ? 'animate-pulse pointer-events-none' : ''}`}>
                  <div className="flex w-full px-1 items-center justify-between">
                     <div className='w-[85%]'>
                        <div className="font-semibold text-lg font-poppins truncate">{track.name}</div>
                        <div className="font-normal text-lg font-poppins text-[#B3B3B3]">
                           {track.artist}
                        </div>
                     </div>
                     <button onClick={() => socket.emit('',)}>
                        <Plus className="w-6 h-6" />
                     </button>
                  </div>
                  <Slider value={timer} duration={track.duration / 1000} onChange={(value) => { setTimer(value.time) }} onCommit={(value) => { setTimer(value.time) }} />
               </div>
               <div className={`flex w-full justify-center gap-10 items-center ${!track?.initied ? 'animate-pulse pointer-events-none' : ''}`}>
                  <button onClick={() => socket.emit('previous',)}>
                     <Previous className="w-[50px] h-[50px] fill-white" />
                  </button>
                  {!playing ? (
                     <button
                        onClick={() => socket.emit('resume')}
                     >
                        <Play className="w-16 h-16 fill-white" />
                     </button>
                  ) : (
                     <button
                        onClick={() => socket.emit('pause')}
                     >
                        <Pause className="w-16 h-16 fill-white" />
                     </button>
                  )}
                  <button onClick={() => socket.emit('next',)}>
                     <Next className="w-[50px] h-[50px] fill-white" />
                  </button>
               </div>
               <div className="flex w-full justify-center gap-2 items-center">
                  <button onClick={() => socket.emit('',)}>
                     <VolumeLow className="w-[30px] h-[30px] fill-white" />
                  </button>
                  <Slider
                     value={60}
                     duration={100}
                     onChange={() => { }}
                     onCommit={() => { }}
                     showTimers={false}
                  />
                  <button onClick={() => socket.emit('',)}>
                     <VolumeHigh className="w-[30px] h-[30px] fill-white" />
                  </button>
               </div>
               <div className="flax w-full rounded-[20px] px-6 py-4 justify-center gap-10 items-center" style={{ backgroundColor: palette.LightVibrant.hex }}>
                  <div className="font-medium uppercase text-sm text-black text-opacity-50">
                     Playing From Party
                  </div>
                  <div className="flex items-center gap-2">
                     <Headphone className="w-6 h-6 text-black text-opacity-80" />
                     <div className="font-medium text-lg text-black text-opacity-80">{player.metadata.voice.name}</div>
                  </div>
               </div>
            </div>
            <div className="mt-8 w-full flex flex-1 p-4 flex-col bg-black bg-opacity-50 rounded-[20px]">
               <div className="flex w-full justify-between px-6 py-2">
                  <div className="flex gap-4 ">
                     <button className={`p-2 rounded-md hover:bg-white hover:bg-opacity-10`} onClick={() => { }}>
                        <Lyrics className="w-6 h-6 fill-white" />
                     </button>
                     <button className={`p-2 rounded-md hover:bg-white hover:bg-opacity-10`} onClick={() => socket.emit('repeat', 'queue')}>
                        <Repeat className="w-6 h-6 fill-white" />
                     </button>
                  </div>
                  <div className="flex gap-4">
                     <button className={`p-2 rounded-md hover:bg-white hover:bg-opacity-10`} onClick={() => socket.emit('shuffle')}>
                        <Shuffle className="w-6 h-6 fill-white" />
                     </button>
                     <button className={`p-2 rounded-md hover:bg-white hover:bg-opacity-10`} onClick={() => { }}>
                        <List className="w-6 h-6 fill-white" />
                     </button>
                  </div>
               </div>
               <div className="flex flex-col overflow-hidden gap-1 justify-between mt-6">
                  {queue.map((item) => (
                     <div key={item.id} className={`flex w-full items-center gap-3 cursor-pointer hover:bg-white hover:bg-opacity-5 rounded-md p-2 ${item.id == track.id ? 'bg-white bg-opacity-5 hover:bg-opacity-10' : ''}`} onClick={() => handleItemClick(item)}>
                        <img
                           src={item.thumbnail}
                           className="h-[50px] w-[50px] rounded-md"
                        />
                        <div className='w-full'>
                           <div className="font-medium text-sm font-poppins text-white w-1/2 truncate">{item.name}</div>
                           <div className="font-normal text-xs font-poppins text-[#B3B3B3]">
                              {item.artist}
                           </div>
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
