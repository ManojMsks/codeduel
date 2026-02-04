import io from 'socket.io-client';

// This automatically picks the URL from the .env file
const URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const socket = io(URL, {
    autoConnect: false // We connect manually in the component
});