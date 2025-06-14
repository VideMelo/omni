import { useState, useEffect, useRef } from 'react';
import Omni from '../assets/icons/Omni.js';
import Loading from '../assets/icons/Loading.js';

function Status({ status, styles, visible, hidden }) {
   const [queue, setQueue] = useState([]);
   const timersRef = useRef({});
   const pendingAsync = useRef({});

   useEffect(() => {
      return () => {
         Object.values(timersRef.current).forEach(({ exitTimer, removalTimer }) => {
            clearTimeout(exitTimer);
            clearTimeout(removalTimer);
         });
      };
   }, []);

   useEffect(() => {
      if (!status && !status?.respond) return;

      const newStatus = {
         id: Date.now(),
         message: status?.message,
         type: status?.type,
         asyncId: status?.async,
         respondId: status?.respond,
         createdAt: Date.now(),
         isExiting: false
      };
      console.log(newStatus)

      setQueue(prevQueue => {
         let updatedQueue = [...prevQueue];

         if (newStatus.respondId) {
            const targetIndex = updatedQueue.findIndex(
               item => item.asyncId === newStatus.respondId
            );

            if (targetIndex > -1) {
               const target = updatedQueue[targetIndex];
               const timeDisplayed = Date.now() - target.createdAt;
               const remainingTime = Math.max(1000 - timeDisplayed, 0);

               if (!newStatus.message) {
                  clearExistingTimers(target.id);
                  updatedQueue = updatedQueue.filter((_, i) => i !== targetIndex);
               } else if (remainingTime > 0) {
                  setTimeout(() => {
                     setQueue(prev => {
                        const newQueue = [...prev];
                        const newTargetIndex = newQueue.findIndex(
                           item => item.id === target.id
                        );

                        if (newTargetIndex > -1) {
                           newQueue[newTargetIndex] = {
                              ...newQueue[newTargetIndex],
                              message: newStatus.message,
                              type: newStatus.type,
                              asyncId: newStatus.asyncId || null,
                              isExiting: false,
                              createdAt: Date.now()
                           };

                           if (!newStatus.asyncId) {
                              startTimer(newQueue[newTargetIndex]);
                           }
                        }
                        return newQueue.slice(-3);
                     });
                  }, remainingTime);
                  return prevQueue;
               } else {
                  updatedQueue[targetIndex] = {
                     ...target,
                     message: newStatus.message,
                     type: newStatus.type,
                     asyncId: newStatus.asyncId || null,
                     isExiting: false,
                     createdAt: Date.now()
                  };

                  if (!newStatus.asyncId) {
                     startTimer(updatedQueue[targetIndex]);
                  }
               }
               return updatedQueue.slice(-3);
            }
         }

         if (newStatus.message) {
            updatedQueue = [...updatedQueue, newStatus].slice(-3);

            if (!newStatus.asyncId) {
               startTimer(newStatus);
            } else {
               pendingAsync.current[newStatus.asyncId] = newStatus.id;
            }
         }

         return updatedQueue;
      });
   }, [status]);

   const startTimer = (status) => {
      clearExistingTimers(status.id);

      const minDisplayTime = status.type === 'async' ? 2000 : 0;
      const timerDuration = Math.max(3000, minDisplayTime);

      const exitTimer = setTimeout(() => {
         setQueue(prev => prev.map(item =>
            item.id === status.id ? { ...item, isExiting: true } : item
         ));

         const removalTimer = setTimeout(() => {
            setQueue(prev => prev.filter(item => item.id !== status.id));
            if (status.asyncId) delete pendingAsync.current[status.asyncId];
         }, 500);

         timersRef.current[status.id] = { exitTimer, removalTimer };
      }, timerDuration);

      timersRef.current[status.id] = { exitTimer };
   };

   const clearExistingTimers = (id) => {
      if (timersRef.current[id]) {
         clearTimeout(timersRef.current[id].exitTimer);
         clearTimeout(timersRef.current[id].removalTimer);
         delete timersRef.current[id];
      }
   };

   const processMessage = (message) => {
      if (!message) return null;

      const regex = /\[([^\]]+)\]/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(message)) !== null) {
         if (match.index > lastIndex) {
            parts.push(message.slice(lastIndex, match.index));
         }
         parts.push(
            <span key={lastIndex} className="bg-white bg-opacity-20 rounded-full px-2 mx-1">
               {match[1]}
            </span>
         );
         lastIndex = regex.lastIndex;
      }

      if (lastIndex < message.length) {
         parts.push(message.slice(lastIndex));
      }

      return parts;
   };

   return (
      <div className={`${styles} items-center flex flex-col-reverse gap-2`}>
         {queue.map((item) => (
            <div
               key={item.id}
               className={`w-max rounded-full p-2 flex justify-center gap-3 items-center ease-in duration-500
            ${item.type === 'error' ? 'bg-red-600' :
                     item.type === 'warn' ? 'bg-yellow-600' :
                        item.type === 'async' ? 'bg-blue-600' :
                           item.type === 'done' ? 'bg-green-600' : 'bg-gray-600'}
            ${item.isExiting ? hidden : visible}`}
            >
               <Omni />
               <div className="text-sm text-white text-opacity-80 flex flex-wrap items-center">
                  {processMessage(item.message)}
               </div>
               {item.type === 'async' && (
                  <div className='bg-white bg-opacity-10 rounded-full px-3'>
                     <Loading className='w-6 h-6' />
                  </div>
               )}
            </div>
         ))}
      </div>
   );
}

export default Status;