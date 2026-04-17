import Pusher from 'pusher-js';

const pusherKey = import.meta.env.VITE_PUSHER_KEY;
const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER || 'mt1';

if (!pusherKey) {
  console.warn('Pusher key missing. Please check your environment variables.');
}

export const pusher = new Pusher(pusherKey || '', {
  cluster: pusherCluster,
  authEndpoint: '/api/pusher/auth',
  // Note: If you use private/presence channels, you'll need to pass the JWT in auth headers.
  // For now, these are public channels.
});

// Connection logging for debugging
pusher.connection.bind('state_change', (states: any) => {
  console.log('📡 Pusher Connection State:', states.current);
});

pusher.connection.bind('error', (err: any) => {
  console.error('❌ Pusher connection error:', err);
});

pusher.connection.bind('connected', () => {
  console.log('✅ Pusher Connected successfully to cluster:', pusherCluster);
});
