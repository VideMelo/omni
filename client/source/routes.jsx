import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';

import Layout from './layout';

import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';

const Routers = () => {
   const location = useLocation();
   const [token, setToken] = useState(Cookies.get('auth-token'));

   useEffect(() => {
      if (!token) setToken(Cookies.get('auth-token'));
      console.log(location.pathname, token);
   }, [location.pathname, token]);

   return (
      <Routes>
         <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route
               path="dashboard"
               element={!token ? <Navigate to="/" replace /> : <Dashboard />}
            />
            <Route path="/*" element={<Navigate to="/" replace />} />
         </Route>
      </Routes>
   );
};

export { Router, Routers };
