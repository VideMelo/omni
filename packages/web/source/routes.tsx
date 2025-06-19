import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';

import Layout from './layout.jsx';
import Home from './pages/Home.jsx';
import Search from './pages/Search.jsx';
import Login from './pages/Login.jsx';
import Queue from './pages/Queue.jsx';

import socket from './services/socket.js';
import { useAuth } from './contexts/AuthContext.jsx';

function RedirectRoute() {
   const navigate = useNavigate();

   useEffect(() => {
      const query = new URLSearchParams(location.search);

      const code = query.get('code');
      const state = query.get('state');

      window.close();
      window.opener.postMessage({ code, state, type: 'auth-success' }, '*');
   }, []);

   return null;
}

const Loading = () => {
   return 'loading...';
};

const Routers = () => {
   const { state: user, dispatch } = useAuth();
   const location = useLocation();

   const token = Cookies.get('auth-token');

   let [isAuth, setIsAuth] = useState(!!user.id);
   let [isLoading, setIsLoading] = useState(!!token && !isAuth);

   useEffect(() => {
      if (token) {
         socket.emit('user:set', token, (user: any) => {
            if (!user?.id) {
               Cookies.remove('auth-token');

               setIsLoading(false);
               setIsAuth(false);

               return dispatch({ type: 'RESET_USER' });
            }

            setIsAuth(true);
            setIsLoading(false);

            dispatch({ type: 'SET_USER', payload: user });
            console.log(`[WS]: user: ${user.username}, connected with socket: ${socket.id}`);
         });
      } else {
         setIsLoading(false);
         setIsAuth(false);
         dispatch({ type: 'RESET_USER' });
      }
   }, [location.pathname]);

   return (
      <Routes>
         <Route path="/login" element={isAuth ? <Navigate to="/" replace /> : <Login />} />
         <Route path="/redirect" element={<RedirectRoute />} />
         <Route path="/" element={isLoading ? <Loading /> : isAuth ? <Layout /> : <Navigate to="/login" replace />}>
            <Route index element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="*" element={<Navigate to="/" replace />} />
         </Route>
      </Routes>
   );
};

export { Routers, Router };
