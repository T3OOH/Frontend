import { io } from 'socket.io-client';
import { AUTH_STORAGE_KEY } from './axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export const socket = io(BACKEND_URL, {
    autoConnect: false, // Só conecta quando o componente de chat for montado
    // O backend exige o JWT da equipe no handshake
    auth: (cb) => {
        try {
            const session = JSON.parse(window.sessionStorage.getItem(AUTH_STORAGE_KEY) ?? 'null');
            cb({ token: session?.token });
        } catch {
            cb({});
        }
    },
});
