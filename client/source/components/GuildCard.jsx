import Image from 'next/image';
import React from 'react';

function GuildCard({ data, onClick }) {
   return (
      <div className="w-[250px] h-[150px] flex flex-col cursor-pointer" onClick={onClick}>
         <div
            className="bg-red-600 w-full rounded-lg h-40"
            style={{ backgroundColor: data.color }}
         />
         <div className="flex relative">
            <div className="relative w-20 h-20">
               <Image
                  src={data.icon}
                  alt="guild-icon"
                  width={80}
                  height={80}
                  className="rounded-full absolute -top-10 left-3 border-black border-4"
               />
            </div>
            <div className="flex flex-col justify-center ml-5">
               <span className="text-white text-[16px] font-semibold">{data.name}</span>
               <span className="text-white text-[12px] font-light">
                  {data.owner ? 'Owner' : 'Member'}
               </span>
            </div>
         </div>
      </div>
   );
}

export default GuildCard;
