import { api } from '../lib/axios';
import type { User } from '@/contexts/AuthContext';

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export const authService = {
    async register(data: { name: string; email: string; password: string }) {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    async login(data: LoginData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', data);
        return response.data;
    },
};
