import Slider from '../components/Slider.js';

import socket from '../services/socket.js';

import Play from '../assets/icons/Play.js';
import Previous from '../assets/icons/Previous.js';
import Next from '../assets/icons/Next.js';
import Pause from '../assets/icons/Pause.js';
import VolumeLow from '../assets/icons/VolumeLow.js';
import Plus from '../assets/icons/Plus.js';
import Headphone from '../assets/icons/Headphone.js';
import { usePlayer } from '../contexts/PlayerContext.js';

export default function Page() {
   const { state, dispatch } = usePlayer();
   const { track, playing, paused, timer, palette, cover, volume, voice } = state;

   if (!track || !palette || !cover) return null;

   return (
      <main
         className="w-full h-full  flex p-6 gap-3 overflow-auto scrollbar-none justify-center"
         style={{ backgroundColor: palette?.alpha }}
      >
         <div className="flex flex-col gap-4 w-full h-full">
            <div className={`relative  scrollbar-none w-full h-full flex-col flex rounded-3xl`}>
               <div className="flax w-ful mb-5 rounded-[20px] px-6 py-4 justify-center gap-10 items-center bg-black bg-opacity-40">
                  <div className="font-medium uppercase text-sm text-white text-opacity-80">Playing From Party</div>
                  <div className="flex items-center gap-2">
                     <Headphone className="w-6 h-6 text-white text-opacity-50" />
                     <div className="font-normal text-lg text-white text-opacity-50">{voice}</div>
                  </div>
               </div>
               <div className={`flex flexduration-700 mb-9`}>
                  <img src={track.icon} className="w-[200px] h-[200px] object-cover rounded-3xl" />
                  <div className="flex w-full p-8 items-end justify-between">
                     <div>
                        <div className="font-semibold text-3xl font-poppins">{track.name}</div>
                        <div className="font-normal text-2xl font-poppins text-[#B3B3B3]">{track.artist.name}</div>
                     </div>
                  </div>
               </div>
               <div className="flex flex-col w-full gap-5">
                  <div className="flex flex-col gap-3">
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
                  <div className="flex">
                     <button className="w-1/5" onClick={() => socket.emit('')}>
                        <Plus className="w-6 h-6" />
                     </button>
                     <div className="flex w-full justify-center gap-10 items-center">
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
                     <div className="flex w-1/5 justify-center gap-2 items-center">
                        <button onClick={() => socket.emit('player:volume', 0)}>
                           <VolumeLow className="w-[30px] h-[30px] fill-white" />
                        </button>
                        <Slider
                           value={volume}
                           duration={100}
                           onChange={() => {}}
                           onCommit={(value: any) => socket.emit('player:volume', value.time)}
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
