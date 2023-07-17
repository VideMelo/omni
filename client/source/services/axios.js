import axios from 'axios';

const api = axios.create({
   baseURL: process.env.NEXT_API_URL,
});

export const getAuth = (code) => {
   if (!code) return;
   return api.post('/auth', { code });
};

export default api;
