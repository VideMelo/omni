import React from 'react';
import ReactDOM from 'react-dom/client';

import { Routers, Router } from './routes';

import './styles/globals.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
   <Router>
      <Routers />
   </Router>
);
