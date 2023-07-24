import { io } from 'socket.io-client';

export default io(`${process.env.NEXT_PUBLIC_SERVER_URL}`, {
   path: '/api/socket.io',
});
