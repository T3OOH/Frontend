import { io } from 'socket.io-client';
import { validToken } from './session';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export const socket = io(BACKEND_URL, {
    autoConnect: false, // Só conecta quando o componente de chat for montado
    // O backend exige o JWT da equipe no handshake
    // A cada (re)conexão pega um token válido: o de acesso dura 15 min e é renovado
    auth: (cb) => {
        validToken().then((token) => cb(token ? { token } : {})).catch(() => cb({}));
    },
});
