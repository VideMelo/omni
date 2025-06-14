import React, { useEffect, useState } from 'react';
import {
   BrowserRouter as Router,
   Route,
   Routes,
   Navigate,
   useLocation,
   useNavigate,
} from 'react-router-dom';

import Cookies from 'js-cookie';
import axios from 'axios';

import Layout from './layout.jsx';
import Home from './pages/Home.jsx';
import Search from './pages/Search.jsx';
import Login from './pages/Login.jsx';
import Queue from './pages/Queue.jsx';

import socket from './services/socket.js';

function RedirectRoute({ setStatus }: any) {
   const navigate = useNavigate();

   useEffect(() => {
      const query = new URLSearchParams(location.search);
      const code = query.get('code');
      const state = query.get('state');

      if (code) {
         try {
            axios
               .get(`${import.meta.env.VITE_API_URL}/auth`, {
                  params: {
                     code,
                     state,
                  },
               })
               .then((res) => {
                  window.close();
                  window.opener.postMessage(res.data, '*');
                  window.location.href = '/';
               })
               .catch((err) => {
                  window.close();
                  window.opener.postMessage({ type: 'auth-error' }, '*');
                  window.location.href = '/';
               });
         } catch (err: any) {
            window.close();
            window.opener.postMessage({ type: 'auth-error' }, '*');
            window.location.href = '/';
         }
      }
   }, []);

   return null;
}

const Routers = () => {
   const location = useLocation();
   const [token, setToken] = useState(Cookies.get('auth-token'));
   const [isAuth, setIsAuth] = useState(!!token);

   useEffect(() => {
      setToken(Cookies.get('auth-token'));
      if (token) {
         axios
            .get('https://discord.com/api/users/@me', {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            })
            .then((res) => {
               socket.emit('user:set', res.data.id);
               console.log(res.data);
               setIsAuth(true);
            })
            .catch((error) => {
               console.log(error);
            });
      }
   }, [location.pathname]);

   return (
      <Routes>
         <Route path="/login" element={isAuth ? <Navigate to="/" replace /> : <Login />} />
         <Route path="/redirect" element={<RedirectRoute setStatus />} />
         <Route path="/" element={!isAuth ? <Navigate to="/login" replace /> : <Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/*" element={<Navigate to="/" replace />} />
         </Route>
      </Routes>
   );
};

export { Router, Routers };
