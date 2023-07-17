import 'source/styles/globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
   title: 'Jukebox',
};

import Header from 'components/Header';

export default function RootLayout({ children }) {
   return (
      <html lang="en" id="root">
         <body className={inter.className}>
            <Header />
            {children}
         </body>
      </html>
   );
}
