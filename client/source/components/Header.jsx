import React from 'react';
import Cookies from 'js-cookie';
import { Link, useNavigate } from 'react-router-dom';

import socket from 'source/services/socket.js';

import Auth from 'hooks/auth.js';

import Scout from '../assets/icons/Scout';
import Arrow from '../assets/icons/Arrow';

export default function Header() {
   const navigate = useNavigate();
   const options = [
      { name: 'About', url: '/about' },
      { name: 'Dashboard', url: '/dashboard', isPrivate: true },
      { name: 'GitHub', url: 'https://github.com/VideMelo/omni' },
   ];

   const auth = Auth({
      redirectUri: `${import.meta.env.VITE_API_URL}/auth-login`,
      clientId: import.meta.env.VITE_DISCORD_ID,
      authUrl: 'https://discord.com/api/oauth2/authorize',
      scopes: ['identify', 'guilds'],

      onSuccess: (data) => {
         Cookies.set('auth-token', data.token, {
            expires: new Date(data.expires),
            path: '/',
         });
         navigate('/dashboard');
         window.location.reload();
      },
      oneError: () => {
         console.error('Error in login');
      },
   });

   const token = Cookies.get('auth-token');
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
               <Link to="/" className="flex">
                  <Scout className="w-16 h-16 absolute" />
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
                              to={option.url}
                              className="text-[14px] uppercase hover:opacity-90 tracking-widest opacity-70 py-2 px-4 font-medium hover:border-transparent rounded-lg"
                           >
                              {option.name}
                           </Link>
                        </li>
                     );
                  })}
                  <li className="mx-2">
                     {!isLogged ? (
                        <button
                           className="text-blue-500 hover:bg-[rgba(79,126,255,0.21)] bg-[rgba(79,126,255,0.13)] text-[16px] font-semibold py-3 px-5 hover:border-transparent rounded-xl"
                           onClick={() => isLogged}
                        >
                           Sing In
                        </button>
                     ) : (
                        <div className="flex items-center cursor-pointer">
                           {user ? (
                              <img
                                 src={user.avatar}
                                 alt="avatar"
                                 className="w-8 h-8 rounded-full"
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
