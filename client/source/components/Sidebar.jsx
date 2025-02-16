import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import Scout from '../assets/icons/Scout';
import Home from '../assets/icons/Home';
import Queue from '../assets/icons/Queue';
import Like from '../assets/icons/Like';
import Feed from '../assets/icons/Feed';

const icons = { Home, Queue, Liked: Like, Feed };
const items = [
  { name: 'Home', url: '/' },
  { name: 'Queue', url: '/queue' },
  { name: 'Liked', url: '/liked' },
  { name: 'Feed', url: '/feed' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className='flex flex-col items-center gap-3 h-full max-h-[calc(100vh-45px)]'>
      <div className='w-[76px] p-[10px] bg-opacity-10 flex-col items-center flex rounded-r-3xl bg-white h-full'>
        {items.map(({ name, url }) => {
          const Icon = icons[name];
          return (
            <Link
              to={url}
              key={name}
              className={`flex w-[50px] h-[50px] rounded-2xl items-center justify-center ${location.pathname === url ? 'bg-white bg-opacity-[15%] text-white' : ''}`}
            >
              <Icon />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
