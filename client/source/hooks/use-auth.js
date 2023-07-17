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

const getAuthUrl = ({ authUrl, clientId, redirectUri, scopes, state }) => {
   scopes = scopes.join(' ');
   return `${authUrl}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}`;
};

export default function useOAuth2(props) {
   const getAuth = useCallback(() => {
      const state = randomString();
      localStorage.setItem('auth-state', state);

      openPopup(getAuthUrl({ ...props, state }));
   }, [props]);

   if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
         console.log('OAuth2: Message received');
         if (event.data.type === 'auth-success') {
            console.log('OAuth2: Success');
            const { token, expires } = event.data;
            localStorage.removeItem('auth-state');

            props.onSuccess(token, expires);
         } else if (event.data.type === 'auth-error') {
            console.error('OAuth2: Error');
            props.onError();
         }
      });
   }

   return getAuth;
}
