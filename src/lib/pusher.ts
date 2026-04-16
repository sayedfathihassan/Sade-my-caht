import Pusher from 'pusher-js';

const pusherKey = import.meta.env.VITE_PUSHER_KEY;
const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER;

if (!pusherKey || !pusherCluster) {
  console.warn('Pusher credentials missing. Please check your environment variables.');
}

export const pusher = new Pusher(pusherKey || '', {
  cluster: pusherCluster || 'eu',
  authEndpoint: '/api/pusher/auth',
});

pusher.connection.bind('error', (err: any) => {
  console.error('Pusher connection error:', err);
});
