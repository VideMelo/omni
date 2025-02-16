import React from 'react'
import Plus from '../assets/icons/Plus'
import socket from '../services/socket'

export default function ItemList({ data, onClick }) {
   if (!data?.length) return (
      <div className='flex flex-col gap-5' >
         <div className='flex flex-col w-full gap-3 flex-grow'>
            <div className='flex items-center shrink-0 bg-white bg-opacity-5 h-6 w-32 animate-pulse'>
            </div>
            <div className="overflow-x-auto -mx-6 scrollbar-none" style={{
               WebkitMaskImage:
                  "linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 5%, rgba(0, 0, 0, 1) 95%, rgba(0, 0, 0, 0))",
               maskImage:
                  "linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 5%, rgba(0, 0, 0, 1) 95%, rgba(0, 0, 0, 0))",
            }}>

               <ul
                  className='flex gap-1 mt-2 scrollbar-none flex-grow'>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                     <li key={i} className='flex flex-col gap-1 first:ml-6 last:mr-6 p-4 rounded-md'>
                        <div className={`h-[140px] w-[140px] bg-white bg-opacity-5 rounded-md animate-pulse`} />
                        <div className='flex flex-col gap-1 w-[140px]'>
                           <div className='h-4 w-28 bg-white bg-opacity-5 animate-pulse'></div>
                           <div className=' h-4 w-10 bg-white bg-opacity-5 animate-pulse'></div>
                        </div>
                     </li>
                  ))}
               </ul>
            </div>
         </div>
      </div >
   )
   return (
      <div className='flex flex-col gap-5'>
         <div className='flex flex-col w-full gap-3 flex-grow'>
            <div className='flex items-center shrink-0 font-medium text-2xl text capitalize'>
               {`${data[0].type}s`}
            </div>
            <div className="overflow-x-auto -mx-6 scrollbar-none" style={{
               WebkitMaskImage:
                  "linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 5%, rgba(0, 0, 0, 1) 95%, rgba(0, 0, 0, 0))",
               maskImage:
                  "linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 5%, rgba(0, 0, 0, 1) 95%, rgba(0, 0, 0, 0))",
            }}>

               <ul
                  className='flex gap-1 mt-2 scrollbar-none flex-grow'>
                  {data.map((track, index) => (
                     <li key={track.id} className='flex flex-col gap-1 first:ml-6 last:mr-6 hover:bg-white hover:bg-opacity-5 p-4 rounded-md' onClick={() => onClick ? onClick(data[index]) : null}>
                        <div className='group flex flex-col items-end'>
                           <img src={track.thumbnail} className={`h-[140px] w-[140px] ${data[index].type === 'artist' ? 'rounded-full' : 'rounded-md'}`} />
                           {
                              track.type == 'track' ? (
                                 <button className='p-2 opacity-0 cursor-pointer -mt-[46px] hover:bg-opacity-100 mr-[5px] group-hover:opacity-100 group-hover:bg-black w-[41px] h-[41px] inline-block group-hover:bg-opacity-70 rounded-md' onClick={(event) => {
                                 event.stopPropagation();
                                 socket.emit('new-track', track);
                              }}>
                                 <Plus className="w-7 h-7" />
                              </button>
                              ) : null
                           }
                        </div>
                        <div className='flex mt-2 flex-col w-[140px]'>
                           <div className='font-poppins font-medium text-base truncate'>{track.name}</div>
                           <div className='font-poppins font-normal text-sm text-[#B3B3B3] truncate'>{track.artist ? track.artist : 'Artist'}</div>
                        </div>
                     </li>
                  ))}
               </ul>
            </div>
         </div>
      </div>
   )
}
