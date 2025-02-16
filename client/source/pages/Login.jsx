import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

import Discord from '../assets/icons/Discord';
import Scout from '../assets/icons/Scout';
import useAuth from '../hooks/useAuth';

export default function Page() {
   const navigate = useNavigate();
   const getAuth = useAuth({
      redirectUri: `${import.meta.env.VITE_API_URL}/auth-login`,
      clientId: import.meta.env.VITE_DISCORD_ID,
      authUrl: 'https://discord.com/api/oauth2/authorize',
      scopes: ['identify', 'guilds'],

      onSuccess: (data) => {
         Cookies.set('auth-token', data.token, {
            expires: new Date(data.expires),
            path: '/',
         });
         navigate('/');
         window.location.reload();
      },
      oneError: () => {
         console.error('Error in login');
      },
   })

   return (
      <main className="h-screen w-full min-w-0 flex flex-col justify-center items-center">
         <Scout className='w-16 h-16 shrink-0 -mt-8 mb-6' />
         <h1 className="text-3xl font-bold mb-2 text-center relative z-10 mt-12 opacity-100 will-change-transform transform-none">One account, a world of music!</h1>
         <p className="text-lg mb-8 opacity-70 w-full whitespace-nowrap text-center font-light relative z-10 will-change-transform">Connect with your friends and explore new tunes together.</p>
         <button className='font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-full sm:w-auto bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm sm:text-base p-7 flex items-center justify-center space-x-2 rounded-2xl' onClick={() => getAuth()}>
            <Discord className="w-7 h-7 flex-shrink-0" />
            <span className="whitespace-nowrap text-xl">Sign in with Discord</span>
         </button>
      </main>
   );
}
