'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import GuildCard from 'components/GuildCard';
import { getCookie } from 'cookies-next';
import Link from 'next/link';

import { socket } from 'source/services/socket';

export default function Dashboard() {
   const { push } = useRouter();
   function handleSelectGuild(guild) {
      if (guild.join) return;
      push(`/dashboard/${guild.id}`);
   }

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
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
         <div className="flex flex-wrap gap-4">
            {guilds.map((guild, index) => {
               if (!guild.join)
                  return (
                     <Link href={`/dashboard/${guild.id}`} key={index}>
                        <GuildCard data={guild} />
                     </Link>
                  );
               return (
                  <GuildCard key={index} data={guild} onClick={() => handleSelectGuild(guild)} />
               );
            })}
         </div>
      </main>
   );
}
