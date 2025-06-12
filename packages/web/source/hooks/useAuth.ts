import { useCallback, useEffect } from 'react';

const randomString = (length = 40) => {
   const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   const array = new Uint8Array(length);
   window.crypto.getRandomValues(array);
   return Array.from(array, (x) => validChars[x % validChars.length]).join('');
};

const openPopup = (url: any) => {
   const popupHeight = 600;
   const popupWidth = 400;

   const top = window.outerHeight / 2 + window.screenY - popupHeight / 2;
   const left = window.outerWidth / 2 + window.screenX - popupWidth / 2;

   return window.open(
      url,
      'OAuth2 Popup',
      `height=${popupHeight},width=${popupWidth},top=${top},left=${left}`
   );
};

const getAuthUrl = ({ authUrl, clientId, redirectUri, scopes, guildId, state, auth = 'login' }: any) => {
   const scopeString = scopes.join('+');
   if (auth === 'invite') {
      return `${authUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopeString}&guild_id=${guildId}&disable_guild_select=true&permissions=8`;
   }
   return `${authUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopeString}&state=${state}`;
};

export default function useAuth({ authUrl, clientId, redirectUri, scopes, onSuccess, onError }: any) {
   const getAuth = useCallback(
      (data = {}) => {
         const state = randomString();
         localStorage.setItem('auth-state', state);

         const url = getAuthUrl({
            authUrl,
            clientId,
            redirectUri,
            scopes,
            state,
            ...data,
         });

         openPopup(url);
      },
      [authUrl, clientId, redirectUri, scopes]
   );

   useEffect(() => {
      const handleMessage = (event: any) => {
         if (event.data?.type === 'auth-success') {
            const savedState = localStorage.getItem('auth-state');
            if (savedState !== event.data.state) {
               console.error('OAuth2: Invalid state');
               return;
            }

            localStorage.removeItem('auth-state');
            onSuccess?.(event.data);
         } else if (event.data?.type === 'auth-error') {
            console.error('OAuth2: Error');
            onError?.(event.data);
         }
      };

      window.addEventListener('message', handleMessage);
      return () => {
         window.removeEventListener('message', handleMessage);
      };
   }, [onSuccess, onError]);

   return getAuth;
}
