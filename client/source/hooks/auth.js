import { useCallback } from 'react';

const randomString = (lenght = 40) => {
   const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   let array = new Uint8Array(lenght);
   window.crypto.getRandomValues(array);
   array = array.map((x) => validChars.codePointAt(x % validChars.length));
   const randomState = String.fromCharCode.apply(null, array);
   return randomState;
};

const openPopup = (url) => {
   const popupHeight = 700;
   const popupWidth = 500;

   const top = window.outerHeight / 2 + window.screenY - popupHeight / 2;
   const left = window.outerWidth / 2 + window.screenX - popupWidth / 2;

   return window.open(
      url,
      'OAuth2 Popup',
      `height=${popupHeight},width=${popupWidth},top=${top},left=${left}`
   );
};

const getAuthUrl = ({ authUrl, clientId, redirectUri, scopes, guildId, state, auth = 'login' }) => {
   scopes = scopes.join('+');
   if (auth === 'invite') {
      return `${authUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&guild_id=${guildId}&disable_guild_select=true&permissions=8`;
   } else if (auth == 'login') {
      return `${authUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&state=${state}`;
   }
};

export default function Auth(props) {
   function getAuth(data = {}) {
      const state = randomString();
      localStorage.setItem('auth-state', state);

      const url = getAuthUrl({ ...props, ...data, state });
      openPopup(url);
   }

   if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
         if (event.data.type === 'auth-success') {
            localStorage.removeItem('auth-state');

            if (props?.onSuccess) props?.onSuccess(event.data);
            window.removeEventListener('message', () => {});
         } else if (event.data.type === 'auth-error') {
            console.error('OAuth2: Error');
            if (props?.onError) props?.onError(event.data);
            window.removeEventListener('message', () => {});
         }
      });
   }

   return getAuth;
}
