import { io } from 'socket.io-client';

// Ajuste para a URL real do seu backend
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export const socket = io(BACKEND_URL, {
    autoConnect: false, // Só conecta quando o componente de chat for montado
    withCredentials: true
});