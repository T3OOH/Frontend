import { api } from '../lib/axios';

export type UserRole = 'USER' | 'ADMIN' | 'MANAGER' | 'COMERCIAL' | 'COMPANY';

export interface UserData {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt?: string;
}

export const usersService = {
    async getAllUsers(): Promise<UserData[]> {
        const response = await api.get('/users');
        return response.data;
    },

    async updateUserRole(id: string, role: UserRole): Promise<UserData> {
        const response = await api.patch(`/users/${id}/role`, { role });
        return response.data;
    }
};