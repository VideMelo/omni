import { io } from 'socket.io-client';

const socket = io(`${import.meta.env.VITE_SERVER_URL}`);

socket.on('connect', () => {
  console.log('Socket connected:', socket.id, import.meta.env.VITE_SERVER_URL);
});

export default socket
