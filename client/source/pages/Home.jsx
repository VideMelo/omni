import { Link } from 'react-router-dom';

import Discord from '../assets/icons/Discord';

export default function Page() {
   return (
      <main className="flex min-h-max flex-col p-24 justify-center">
         <h1 className="text-6xl font-bold text-white w-[50vw] max-w-2xl mb-6">
            Omni, listen music with your friends!
         </h1>
         <p className="text-white text-2xl font-light w-[50vw] max-w-2xl mb-11">
            Omni is a discord music bot that allows you to listen to music with your friends in a
            voice channel.
         </p>
         <div className="flex gap-4">
            <Link to={`/dashboard`}>
               <button className="h-[60px] px-7 rounded-xl cursor-pointer bg-blue-500 shadow-2xl shadow-[rgba(89,116,236,0.2)] max-sm:px-5 max-sm:w-full">
                  <span className="flex items-center justify-center text-white w-full font-medium text-right whitespace-nowrap text-lg max-sm:text-[13px]">
                     <Discord className="w-6 h-6 mr-5" /> Invite to Discord
                  </span>
               </button>
            </Link>
            <button className="text-white rounded-xl flex text-lg justify-center items-center bg-opacity-10 hover:bg-opacity-[15%] bg-white text-[16px] py-3 px-5">
               Learn More
            </button>
         </div>
      </main>
   );
}
