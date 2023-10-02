import React from 'react';

import { Slider } from '@mui/material';

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
import VolumeMute from '../assets/icons/VolumeMute';
import VolumeNormal from '../assets/icons/VolumeNormal';

function Player(props) {
   const [playing, setPlaying] = React.useState(false);
   const [shuffle, setShuffle] = React.useState(false);
   const [repeat, setRepeat] = React.useState('off');
   const [duration, setDuration] = React.useState(0);
   const [position, setPosition] = React.useState(0);
   const [volume, setVolume] = React.useState(0.5);
   const [idle, setIdle] = React.useState(true);

   function formatDuration(value) {
      if (isNaN(value)) return '-:--';
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value - hours * 3600) / 60);
      const seconds = Math.floor(value - hours * 3600 - minutes * 60);
      return `${hours ? hours + ':' : ''}${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
   }

   React.useEffect(() => {
      socket.on('disconnect', () => setPlaying(false));
   }, []);

   React.useEffect(() => {
      if (!props.data) return;
      const { config, playing, state, current } = props.data;

      setShuffle(config.shuffle);
      setRepeat(config.repeat);
      setVolume(config.volume);

      setDuration(current?.duration / 1000 || 0);
      setPosition(current?.position / 1000 || 0);

      setPlaying(playing);
      setIdle(state == 'idle');
   }, [props.data]);

   React.useEffect(() => {
      if (!playing) return;
      const interval = setInterval(() => {
         setPosition((prev) => {
            if (prev >= duration) {
               clearInterval(interval);
               setIdle(true);
               setPlaying(false);
               return 0;
            }
            return prev + 1;
         });
      }, 1000);
      return () => clearInterval(interval);
   }, [playing, duration]);

   return (
      <div className=" h-[90px] bg-black w-full flex flex-row justify-end items-center gap-[20vw] fill-white p-11">
         <div className="flex flex-col items-center">
            <div className={'flex items-center gap-7' + (idle ? ' opacity-40' : '')}>
               <button
                  onClick={() => socket.emit('shuffle', !shuffle)}
                  className={idle ? ' cursor-default' : 'hover:opacity-75 active:opacity-100'}
               >
                  <Shuffle
                     className={'stroke-neutral-400 w-5 h-5' + (shuffle ? ' stroke-red-600' : '')}
                  />
               </button>
               <div className="flex items-center gap-2">
                  <button
                     onClick={() => socket.emit('previous')}
                     className={idle ? ' cursor-default' : 'hover:opacity-75 active:opacity-100'}
                  >
                     <Previous />
                  </button>
                  {!playing ? (
                     <button
                        className={idle ? ' cursor-default' : 'hover:opacity-75 active:opacity-100'}
                        onClick={() => socket.emit('resume')}
                     >
                        <Play />
                     </button>
                  ) : (
                     <button
                        className={idle ? ' cursor-default' : 'hover:opacity-75 active:opacity-100'}
                        onClick={() => socket.emit('pause')}
                     >
                        <Pause />
                     </button>
                  )}
                  <button
                     onClick={() => socket.emit('next')}
                     className={idle ? ' cursor-default' : 'hover:opacity-75 active:opacity-100'}
                  >
                     <Next />
                  </button>
               </div>
               {repeat == 'queue' ? (
                  <button
                     className={idle ? ' cursor-default' : 'hover:opacity-75 active:opacity-100'}
                     onClick={() => socket.emit('repeat', 'track')}
                  >
                     <Repeat className="stroke-red-600 w-6 h-6" />
                  </button>
               ) : repeat == 'track' ? (
                  <button
                     className={idle ? ' cursor-default' : 'hover:opacity-75 active:opacity-100'}
                     onClick={() => socket.emit('repeat', 'off')}
                  >
                     <RepeatOnce className="stroke-red-600 w-6 h-6" />
                  </button>
               ) : (
                  <button
                     className={idle ? ' cursor-default' : 'hover:opacity-75 active:opacity-100'}
                     onClick={() => socket.emit('repeat', 'queue')}
                  >
                     <Repeat className="stroke-neutral-400 w-6 h-6-6" />
                  </button>
               )}
            </div>
            <div className={'flex items-center gap-2 w-[50vw]' + (idle ? ' opacity-40' : '')}>
               <span className="block w-5 text-neutral-400 font-semibold align-middle text-[9px]">
                  {formatDuration(position)}
               </span>
               <Slider
                  aria-label="progress-bar"
                  step={1}
                  min={0}
                  max={duration}
                  value={position}
                  onChange={(e, value) => setPosition(value)}
                  onChangeCommitted={(e, value) => socket.emit('seek', value * 1000)}
                  disabled={!duration}
                  slotProps={{
                     root: { className: 'group !cursor-default !text-white !py-1 !h-1' },
                     thumb: {
                        className: '!h-2 !w-2 !hidden group-hover:!flex !bg-white !shadow-none',
                     },
                     track: { className: position ? '!bg-white !flex' : '!hidden' },
                     rail: { className: '!bg-neutral-400' },
                  }}
               />
               <span className="block w-5 text-neutral-400 font-semibold text-[9px] align-middle">
                  {formatDuration(duration)}
               </span>
            </div>
         </div>
         <div className="flex items-center gap-1">
            <button>
               {volume == 0 ? (
                  <VolumeMute className="stroke-neutral-200 w-[18px] h-[18px]" />
               ) : volume < 0.33 ? (
                  <VolumeLow className="stroke-neutral-200 w-[18px] h-[18px]" />
               ) : volume < 0.66 ? (
                  <VolumeNormal className="stroke-neutral-200 w-[18px] h-[18px]" />
               ) : (
                  <VolumeHigh className="stroke-neutral-200 w-[18px] h-[18px]" />
               )}
            </button>
            <Slider
               aria-label="volume-bar"
               step={0.01}
               min={0}
               max={1}
               value={volume}
               onChange={(e, value) => setVolume(value)}
               onChangeCommitted={(e, value) => socket.emit('volume', value)}
               slotProps={{
                  root: { className: 'group !cursor-default !text-white !py-1 !h-1 !w-16' },
                  thumb: {
                     className: '!h-2 !w-2 !hidden group-hover:!flex !bg-white !shadow-none',
                  },
                  track: { className: volume ? '!bg-white !flex' : '!hidden' },
                  rail: { className: '!bg-neutral-400' },
               }}
            />
         </div>
      </div>
   );
}

export default Player;
