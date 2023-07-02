import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './Layout';
import Home from './Home';

const Router = () => {
   return (
      <BrowserRouter>
         <Routes>
            <Route element={<Layout />}>
               <Route path="/" element={<Home />}></Route>
            </Route>
         </Routes>
      </BrowserRouter>
   );
};

export default Router;
