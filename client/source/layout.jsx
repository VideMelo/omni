import { Outlet, useLocation } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Header from './components/Header';
import { useEffect, useState } from 'react';
import socket from './services/socket';

import Error from './components/Error';

export default function RootLayout() {
   const [metadata, setMetadata] = useState(null)
   const [error, setError] = useState()

   useEffect(() => {
      socket.on('error', (erro) => {
         setError({ erro, index: error?.index + 1 | 0 })
      })
   }, [])

   return (
      <div className='main overflow-hidden scrollbar-none'>
         <Header />
         <div className="flex w-full min-w-0 p-[15px] pl-0 gap-[15px] h-[calc(100vh-65px)] max-h-[calc(100vh-65px)]">
            <Sidebar />
            <div className='relative min-w-0 w-full flex flex-col gap-3'>
               <div className='min-w-0 w-full box-border overflow-auto scrollbar-none h-full bg-opacity-10 flex-col items-center flex rounded-3xl bg-white'>
                  <Outlet context={{ metadata, setMetadata }} />
               </div>
               <Error erro={error} styles='absolute left-6 bottom-6' notVisible={'opacity-0'} visible={'opacity-100'} />
            </div>
            <Player metadata={metadata} setMetadata={setMetadata} />
         </div>
      </div>
   );
}
