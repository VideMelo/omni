import { useState, useRef, useEffect } from 'react';

const Slider = ({
   value = 0,
   duration = 0,
   onChange,
   onCommit,
   trackColor = 'bg-[#797878]',
   progressColor = 'bg-white',
   thumbColor = 'bg-white',
   showThumbOnHover = true,
   showTimers = true
}) => {
   const [internalProgress, setInternalProgress] = useState(value);
   const [isDragging, setIsDragging] = useState(false);
   const sliderRef = useRef(null);
   const inputRef = useRef(null);

   useEffect(() => {
      const progress = duration > 0 ? (value / duration) * 100 : 0;
      setInternalProgress(progress);
   }, [value, duration]);

   const formatTime = (seconds) => {
      const totalSeconds = Math.floor(seconds);
      return `${Math.floor(totalSeconds / 60)}:${Math.abs(totalSeconds % 60).toString().padStart(2, '0')}`;
   };

   const updateProgress = (clientX) => {
      const rect = sliderRef.current.getBoundingClientRect();
      let newProgress = ((clientX - rect.left) / rect.width) * 100;
      newProgress = Math.min(Math.max(newProgress, 0), 100);
      return newProgress;
   };

   const handleInputChange = (e) => {
      const newProgress = Number(e.target.value);
      handleProgressChange(newProgress);
   };

   const handleProgressChange = (newProgress) => {
      const progress = Math.min(Math.max(newProgress, 0), 100);
      const currentTime = (progress / 100) * duration;

      setInternalProgress(progress);
      onChange?.({ progress, time: currentTime, formattedTime: formatTime(currentTime) });
   };

   const handleMouseDown = (e) => {
      setIsDragging(true);
      const newProgress = updateProgress(e.clientX);
      handleProgressChange(newProgress);
   };

   const handleMouseMove = (e) => {
      if (isDragging) {
         const newProgress = updateProgress(e.clientX);
         handleProgressChange(newProgress);
      }
   };

   const handleMouseUp = () => {
      if (isDragging) {
         setIsDragging(false);
         const currentTime = (internalProgress / 100) * duration;
         onCommit?.({ progress: internalProgress, time: currentTime, formattedTime: formatTime(currentTime) });
      }
   };

   useEffect(() => {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
         document.removeEventListener('mousemove', handleMouseMove);
         document.removeEventListener('mouseup', handleMouseUp);
      };
   }, [isDragging, internalProgress]);

   return (
      <div className="w-full group">
         <div className="flex flex-col items-center text-xs text-gray-400 font-medium">
            <div
               className="relative w-full h-4 cursor-pointer"
               ref={sliderRef}
               onMouseDown={handleMouseDown}
               onMouseMove={handleMouseMove}
            >
               <input
                  ref={inputRef}
                  type="range"
                  min="0"
                  max="100"
                  value={internalProgress}
                  onChange={handleInputChange}
                  className="absolute opacity-0 w-full h-full cursor-pointer z-20"
               />
               {/* Track */}
               <div className={`absolute w-full h-1 ${trackColor} rounded-full top-1/2 -translate-y-1/2 z-10`} />

               {/* Progress */}
               <div
                  className={`absolute h-1 ${progressColor} rounded-full top-1/2 -translate-y-1/2 z-10`}
                  style={{ width: `${internalProgress}%` }}
               />

               {/* Thumb */}

               <div
                  className={`
              absolute top-1/2 -translate-y-1/2 h-3 w-3
              ${thumbColor} rounded-full shadow-lg z-20
              transition-opacity duration-150
              ${isDragging ? 'opacity-100' : 'opacity-0'}
              ${showThumbOnHover && 'group-hover:opacity-100'}
              scale-50 group-hover:scale-100
            `}
                  style={{
                     left: `${internalProgress}%`,
                     transform: 'translate(-50%, -50%)',
                     pointerEvents: 'none'
                  }}
               />
            </div>
            <div className='flex w-full justify-between'>
               {showTimers && (
                  <span className="select-none cursor-auto w-12">
                     {formatTime((internalProgress / 100) * duration)}
                  </span>
               )}
               {showTimers && (
                  <span className="select-none cursor-auto w-12 text-right">
                     -{formatTime(Math.max(0, duration - (internalProgress / 100) * duration))}
                  </span>
               )}
            </div>
         </div>
      </div>
   );
};

export default Slider;