'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getCookie } from 'cookies-next';

import socket from 'source/services/socket';

import useAuth from 'source/hooks/use-auth';

export default function Dashboard() {
   const { push } = useRouter();
   const invite = useAuth({
      redirectUri: `${process.env.NEXT_PUBLIC_API_URL}/auth-guild`,
      clientId: process.env.NEXT_PUBLIC_DISCORD_ID,
      authUrl: 'https://discord.com/oauth2/authorize',
      scopes: ['bot', 'applications.commands'],
      auth: 'invite',
      onSuccess: (data) => {
         push(`/dashboard/${data.guild}`);
      }
   });

   const [guilds, setGuilds] = useState(null);
   const token = getCookie('auth-token');

   useEffect(() => {
      if (!token) return;
      socket.emit('leave');
      socket.emit('get-guilds', token, (data) => {
         setGuilds(data);
      });
   }, [token]);

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
                           push(`/dashboard/${guild.id}`);
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
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           className="h-6 w-6 text-[#BBC1C4]"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                           />
                        </svg>
                     ) : (
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           className="h-6 w-6 ml-auto text-[#BBC1C4]"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                           />
                        </svg>
                     )}
                  </li>
               ))}
            </ul>
         </div>
      </main>
   );
}
