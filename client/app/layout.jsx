import 'source/styles/globals.css';

export const metadata = {
   title: 'Omni - Listen music with your friends!',
   description: 'Omni is a discord music bot that allows you to listen to music with your friends in a voice channel.',
};

import HomeHeader from 'source/components/Header';

export default function RootLayout({ children }) {
   return (
      <html lang="en" id="root">
         <body>
            <HomeHeader />
            {children}
         </body>
      </html>
   );
}
