import { Link, useOutletContext } from 'react-router-dom';

import Discord from '../assets/icons/Discord';
import { useEffect, useState, useContext } from 'react';

import Slider from '../components/Slider';

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

export default function Page() {
   const { metadata, setMetadata } = useOutletContext()
   const [queue, setQueue] = useState([])
   const [track, setTrack] = useState(null);

   const [palette, setPalette] = useState(null);
   const [timer, setTimer] = useState(0)
   const [playing, setPlaying] = useState(false)

   const [player, setPlayer] = useState(null)

   useEffect(() => {
      if (!metadata?.player || !metadata?.queue || !metadata?.track || !metadata?.palette) return
      setPlayer(metadata.player)
      setPlaying(metadata.player.playing)
      setTimer(metadata.player.position / 1000)
      setQueue(metadata.queue)
      setPalette(metadata.palette)
      setTrack({ ...metadata.track, duration: metadata.track?.duration - 2500 | 0 })
      setTimer(metadata.timer)
   }, [metadata])

   if (!track || !palette || !player) return null;
   return (
      <main className="w-full h-full flex p-6 gap-3 overflow-auto scrollbar-none justify-center" style={{ backgroundColor: metadata?.palette?.alpha }}>
         <div className="flex flex-col gap-4 w-full h-full">
            <div className={`relative  scrollbar-none w-full h-full flex-col flex rounded-3xl`}>
               <div className="flax w-ful mb-5 rounded-[20px] px-6 py-4 justify-center gap-10 items-center bg-black bg-opacity-40" >
                  <div className="font-medium uppercase text-sm text-white text-opacity-80">
                     Playing From Party
                  </div>
                  <div className="flex items-center gap-2">
                     <Headphone className="w-6 h-6 text-white text-opacity-50" />
                     <div className="font-normal text-lg text-white text-opacity-50">{metadata?.player.metadata.voice.name}</div>
                  </div>
               </div>
               <div className={`flex flexduration-700 mb-9`}>
                  <img
                     src={track.thumbnail}
                     className="w-[200px] h-[200px] object-cover rounded-3xl"
                  />
                  <div className="flex w-full p-8 items-end justify-between">
                     <div>
                        <div className="font-semibold text-3xl font-poppins">{track.name}</div>
                        <div className="font-normal text-2xl font-poppins text-[#B3B3B3]">
                           {track.artist}
                        </div>
                     </div>
                  </div>
               </div>
               <div className="flex flex-col w-full gap-5">
                  <div className="flex flex-col gap-3">
                     <Slider value={timer} duration={track.duration / 1000} onChange={(value) => { setTimer(value.time) }} onCommit={(value) => { setTimer(value.time) }} />
                  </div>
                  <div className='flex'>
                     <button className='w-1/5' onClick={() => socket.emit('',)}>
                        <Plus className="w-6 h-6" />
                     </button>
                     <div className="flex w-full justify-center gap-10 items-center">
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
                     <div className="flex w-1/5 justify-center gap-2 items-center">
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
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </main>
   );
}
