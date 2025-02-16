import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';

import Cookies from 'js-cookie';
import axios from 'axios'

import Layout from './layout';
import Home from './pages/Home.jsx';
import Search from './pages/Search.jsx';
import Login from './pages/Login.jsx';
import Queue from './pages/Queue.jsx';
import socket from './services/socket.js';


const Routers = () => {
   const location = useLocation();
   const [token, setToken] = useState(Cookies.get('auth-token'));
   const [isAuth, setIsAuth] = useState(!!token)

   useEffect(() => {
      setToken(Cookies.get('auth-token'))
      if (token) {
         axios
            .get('https://discord.com/api/users/@me', {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            })
            .then((res) => {
               socket.emit('set-user', res.data.id)
               console.log(res.data)
               setIsAuth(true)
            })
            .catch((error) => {
               console.log(error)
            });
      }
   }, [location.pathname]);

   return (
      <Routes>
         <Route path="/login" element={isAuth ? <Navigate to="/" replace /> : <Login />} />
         <Route path="/" element={!isAuth ? <Navigate to="/login" replace /> : <Layout />}>
            <Route path='/' element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/*" element={<Navigate to="/" replace />} />
         </Route>
      </Routes>
   );
};

export { Router, Routers };
