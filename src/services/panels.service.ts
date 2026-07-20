import { api } from '../lib/axios';

export type PanelStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

export const panelStatusLabel: Record<PanelStatus, string> = {
    AVAILABLE: 'Disponível',
    OCCUPIED: 'Ocupado',
    MAINTENANCE: 'Em manutenção',
};

export interface PanelData {
    id: string;
    name: string;
    lat: number;
    lng: number;
    status: PanelStatus;
    size: string;
    px: string;
    impacts: string;
    images: string[];
    city?: string | null;
    state?: string | null;
    address?: string | null;
    description?: string | null;
}

export type PanelInput = Omit<PanelData, 'id'>;

let panelsCache: PanelData[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 1000 * 60 * 5;

export const panelsService = {
    async getAllPanels(): Promise<PanelData[]> {
        const now = Date.now();
        if (panelsCache && (now - cacheTimestamp < CACHE_DURATION)) {
            return panelsCache;
        }

        const response = await api.get('/panels');
        panelsCache = response.data;
        cacheTimestamp = now;

        return panelsCache as PanelData[];
    },

    // ==========================================
    // 🚀 NOVA FUNÇÃO: Busca apenas dados vitais para o mapa
    // ==========================================
    async getMapMarkers(): Promise<Partial<PanelData>[]> {
        // Supondo que sua rota no backend seja /panels/markers
        const response = await api.get('/panels/markers');
        return response.data;
    },

    async getPanelById(id: string): Promise<PanelData> {
        const response = await api.get(`/panels/${id}`);
        return response.data;
    },

    async createPanel(data: PanelInput): Promise<PanelData> {
        const response = await api.post('/panels', data);
        this.clearCache();
        return response.data;
    },

    async updatePanel(id: string, data: Partial<PanelInput>): Promise<PanelData> {
        const response = await api.put(`/panels/${id}`, data);
        this.clearCache();
        return response.data;
    },

    async deletePanel(id: string): Promise<void> {
        await api.delete(`/panels/${id}`);
        this.clearCache();
    },

    clearCache() {
        panelsCache = null;
        cacheTimestamp = 0;
    }
};

export async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData);
    return response.data.url;
}