import { useEffect, useState } from 'react';

function Error({ erro, visible, notVisible, styles}) {
   const [isVisible, setIsVisible] = useState(false);

   useEffect(() => {
      setIsVisible(false);
      if (erro) {
         setIsVisible(true);

         const timer = setTimeout(() => {
            setTimeout(() => {
               setIsVisible(false);
            }, 500);
         }, 3000);

         return () => clearTimeout(timer);
      }
   }, [erro]);

   return (
      <div className={`${styles} w-max rounded-[20px] px-6 py-4 flex justify-center gap-10 items-center bg-red-600 ease-in duration-100 ${isVisible ? visible : notVisible}`}>
         <div className="text-sm text-white text-opacity-80">
            Error: {erro?.erro}
         </div>
      </div>
   );
}

export default Error;
