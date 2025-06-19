import { io } from 'socket.io-client';

const socket = io(`${import.meta.env.VITE_SERVER_URL}`);

socket.on('connect', () => {
  console.log('[WS]: connected:', socket.id);
});

export default socket
