import React from 'react';
import ReactDOM from 'react-dom/client';

import { Routers, Router } from './routes.js';

import './styles/globals.css';

const container = document.getElementById('root')!;
const root = ReactDOM.createRoot(container);

root.render(
   <Router>
      <Routers />
   </Router>
);
