import { api } from '../lib/axios';

export const profileService = {
    async getProfile() {
        const response = await api.get('/profile');
        return response.data;
    },
    async updateProfile(data: { name: string; phone: string; company: string }) {
        const response = await api.put('/profile', data);
        return response.data;
    },
    async getMyOrders() {
        const response = await api.get('/profile/orders');
        return response.data;
    }
};