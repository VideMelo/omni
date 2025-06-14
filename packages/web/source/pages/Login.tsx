import { Link, useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';

import React, { useState, useEffect, useRef } from 'react';

import Discord from '../assets/icons/Discord.js';
import Scout from '../assets/icons/Scout.js';
import useAuth from '../hooks/useAuth.js';
import Status from '../components/Status.js';
import axios from 'axios';

export default function Page() {
   const [status, setStatus]: any = useState(null)

   const navigate = useNavigate();
   const getAuth = useAuth({
      redirectUri: `${window.location.origin}/redirect`,
      clientId: import.meta.env.VITE_DISCORD_ID,
      authUrl: 'https://discord.com/api/oauth2/authorize',
      scopes: ['identify', 'guilds'],

      onSuccess: (data: any) => {
         console.log(data);
         Cookies.set('auth-token', data.token, {
            expires: new Date(Date.now() + data.expires * 1000),
            path: '/',
            secure: false,
         });
         navigate('/');
         window.location.reload();
      },
      onError: (data: any) => {
         setStatus({ type: 'error', message: 'Error while authenticating with Discord, please try again later!'})
      },
   });

   const location = useLocation();
   useEffect(() => {
      const query = new URLSearchParams(location.search);
      const code = query.get('code');
      const state = query.get('state');

      if (code) {
         axios
            .get(`${import.meta.env.VITE_API_URL}/auth`, {
               params: {
                  code,
                  state,
               },
            })
            .then((res) => {
               console.log(res);
               window.close();
               window.opener.postMessage(res.data, '*');
               window.location.href = '/';
            })
            .catch((err) => console.log(err));
      }
   }, []);

   return (
      <main className="h-screen w-full min-w-0 flex flex-col justify-center items-center">
         <Scout className="w-16 h-16 shrink-0 -mt-8 mb-6" />
         <h1 className="text-3xl font-bold mb-2 text-center relative z-10 mt-12 opacity-100 will-change-transform transform-none">
            One account, a world of music!
         </h1>
         <p className="text-lg mb-8 opacity-70 w-full whitespace-nowrap text-center font-light relative z-10 will-change-transform">
            Connect with your friends and explore new tunes together.
         </p>
         <button
            className="font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-full sm:w-auto bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm sm:text-base p-7 flex items-center justify-center space-x-2 rounded-2xl"
            onClick={() => getAuth()}
         >
            <Discord className="w-7 h-7 flex-shrink-0" />
            <span className="whitespace-nowrap text-xl">Sign in with Discord</span>
         </button>
         <Status
            status={status}
            styles="absolute right-1/2 left-1/2 bottom-6"
            hidden={'opacity-0'}
            visible={'opacity-100'}
         />
      </main>
   );
}
