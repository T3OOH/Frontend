import { api } from '../lib/axios';
import { deviceId } from '../lib/session';
import type { LoginResponse } from '@/contexts/AuthContext';

export interface LoginData {
    email: string;
    password: string;
    captchaToken?: string | null;
    /** "Manter conectado": sessão de 30 dias neste aparelho (senão, até fechar a aba). */
    remember?: boolean;
}

export const authService = {
    async register(data: { name: string; email: string; password: string }) {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    async login(data: LoginData): Promise<LoginResponse> {
        // O id do aparelho permite avisar por e-mail quando a conta entra em um aparelho novo
        const response = await api.post<LoginResponse>('/auth/login', { ...data, deviceId: deviceId() });
        return response.data;
    },
};
