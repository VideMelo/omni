'use client';

import React from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { getCookie } from 'cookies-next';

import socket from 'source/services/socket';
import Logo from 'assets/scout.svg';
import Arrow from 'assets/icons/arrow.svg';
import SingInButton from './SingInButton';

export default function Header() {
   const { push } = useRouter();

   const options = [
      { name: 'GitHub', url: 'https://github.com/VideMelo/omni' },
      { name: 'About', url: '/about' },
      { name: 'Dashboard', url: '/dashboard', isPrivate: true },
   ];

   const token = getCookie('auth-token');
   const [isLogged, setIsLogged] = React.useState(true);
   const [user, setUser] = React.useState(null);

   React.useEffect(() => {
      setIsLogged(!!token);
      if (!token) return;
      socket.emit('get-user', token, (data) => {
         setUser({
            id: data.id,
            username: data.username,
            discriminator: data.discriminator,
            avatar: `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`,
         });
      });
   }, [isLogged, token]);

   return (
      <header className="w-full h-16 my-6 mb-24 text-white flex items-center justify-center">
         <div className="container px-6 flex items-center justify-between">
            <div className="w-16 h-16 relative before:left-1/4 before:absolute before:rounded-full before:block before:top-1/4 before:opacity-20 before: before:w-10 before:h-10 before:shadow-indigo-300 before:shadow-3xl before:animate-pulse-size">
               <Link href={'/'} className="flex">
                  <Logo className="w-16 h-16 absolute" />
               </Link>
            </div>
            <nav className="flex items-center justify-between">
               <ul className="flex items-center">
                  {options.map((option, index) => {
                     if ((option?.isPrivate && !isLogged && !user) || (option?.isPrivate && !user))
                        return null;
                     return (
                        <li key={index} className="mx-2">
                           <Link
                              href={option.url}
                              className="text-[14px] uppercase hover:opacity-90 tracking-widest opacity-70 py-2 px-4 font-medium hover:border-transparent rounded-lg"
                           >
                              {option.name}
                           </Link>
                        </li>
                     );
                  })}
                  <li className="mx-2">
                     {!isLogged ? (
                        <SingInButton
                           onSuccess={() => {
                              push('/dashboard');
                              setIsLogged(true);
                           }}
                           onError={() => setIsLogged(false)}
                        />
                     ) : (
                        <div className="flex items-center cursor-pointer">
                           {user ? (
                              <Image
                                 src={user.avatar}
                                 alt="avatar"
                                 className="w-8 h-8 rounded-full"
                                 width={32}
                                 height={32}
                              />
                           ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-500 opacity-40 animate-pulse" />
                           )}
                           <Arrow className="h-4 w-4 ml-2" />
                        </div>
                     )}
                  </li>
               </ul>
            </nav>
         </div>
      </header>
   );
}
