import { Outlet, useLocation } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Header from './components/Header';
import { useEffect, useState } from 'react';
import socket from './services/socket';

import Status from './components/Status';

export default function RootLayout() {
   const [metadata, setMetadata] = useState(null)
   const [status, setStatus] = useState()

   useEffect(() => {
      let cont = 0
      socket.on('status', (item) => {
         setStatus({ ...item, index: cont++ })
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
               <Status status={status} styles='absolute right-1/2 left-1/2 bottom-6' hidden={'opacity-0'} visible={'opacity-100'} />
            </div>
            <Player metadata={metadata} setMetadata={setMetadata} />
         </div>
      </div>
   );
}
