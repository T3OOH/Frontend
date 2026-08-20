import { api } from '@/lib/axios';

export interface BannerData {
    id: string;
    title?: string;
    imageUrl: string;
    linkUrl?: string;
    isActive: boolean;
    order: number;
}

export const bannerService = {
    // Busca os banners ativos para a vitrine pública
    async getActiveBanners(): Promise<BannerData[]> {
        const response = await api.get('/banners');
        return response.data;
    },

    // Busca todos os banners para o painel do gestor
    async getAllBanners(): Promise<BannerData[]> {
        const response = await api.get('/banners/all');
        return response.data;
    },

    // Cria um novo banner
    async createBanner(data: Partial<BannerData>): Promise<BannerData> {
        const response = await api.post('/banners', data);
        return response.data;
    },

    // Deleta um banner
    async deleteBanner(id: string): Promise<void> {
        await api.delete(`/banners/${id}`);
    }
};