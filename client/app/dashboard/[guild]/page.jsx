'use client';

import React, { useEffect, useState } from 'react';
import { socket } from 'source/services/socket';
import Player from 'components/Player';
import { getCookie } from 'cookies-next';

export default function Guild() {
   const [guild, setGuild] = useState(null);
   useEffect(() => {
      const token = getCookie('auth-token');
      const id = window.location.pathname.split('/')[2];
      socket.emit('get-user', token, (user) => {
         socket.emit('leave-guild');
         socket.emit('get-guild', id, (guild) => {
            socket.emit('join-guild', { guild: id, user: user.id });
            setGuild(guild);
         });
      });
   }, []);

   if (!guild) return null;
   return (
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
         <div className="flex flex-wrap gap-4">
            <Player />
         </div>
      </main>
   );
}
