import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function QueueItem(props) {
   const { item, ...inlineProps } = props;
   return (
      <div className="flex flex-col w-full" {...inlineProps}>
         <div className="flex gap-2 items-center">
            <img
               src={item.thumbnail}
               alt="Track thumbnail"
               className="rounded-[3px] w-[55px] h-[55px] object-cover"
            />
            <div className="flex flex-col w-full">
               <span className="text-white text-base font-bold">{item.name}</span>
               <span className="text-white text-sm opacity-50">{item.artists}</span>
            </div>
         </div>
      </div>
   );
}

QueueItem.propTypes = {
   item: PropTypes.object.isRequired,
};

export default QueueItem;
