import React from 'react';
import { setCookie } from 'cookies-next';

import useAuth from 'hooks/use-auth';

function SingInButton(props) {
   const login = useAuth({
      redirectUri: `${process.env.NEXT_PUBLIC_API_URL}/auth`,
      clientId: process.env.NEXT_PUBLIC_DISCORD_ID,
      authUrl: 'https://discord.com/api/oauth2/authorize',
      scopes: ['identify', 'guilds'],

      onSuccess: (token, expires) => {
         setCookie('auth-token', token, {
            expires: new Date(expires),
            path: '/',
         });
         props.onSuccess();
      },
      oneError: () => props.onError(),
   });

   return (
      <button
         className="text-blue-500 hover:bg-[rgba(79,126,255,0.21)] bg-[rgba(79,126,255,0.13)] text-[16px] font-semibold py-3 px-5 hover:border-transparent rounded-xl"
         onClick={() => {
            login();
         }}
      >
         Sing In
      </button>
   );
}

export default SingInButton;
