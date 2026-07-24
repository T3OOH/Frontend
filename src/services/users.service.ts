import { api } from '../lib/axios';

export interface UserData {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN' | 'MANAGER' | 'COMERCIAL';
    createdAt?: string;
}

export const usersService = {
    async getAllUsers(): Promise<UserData[]> {
        const response = await api.get('/users');
        return response.data;
    },

    async updateUserRole(id: string, role: 'USER' | 'ADMIN' | 'MANAGER' | 'COMERCIAL'): Promise<UserData> {
        const response = await api.patch(`/users/${id}/role`, { role });
        return response.data;
    }
};