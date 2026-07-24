import { api } from '../lib/axios';

export type DealStage = 'NEW_LEAD' | 'FIRST_CONTACT' | 'NEGOTIATION' | 'WAITING_REPLY' | 'PROPOSAL_SENT' | 'POST_SALES';
export type DealStatus = 'OPEN' | 'WON' | 'LOST';

export interface CrmMetrics {
    totalExpectedValue: number;
    totalActiveDeals: number;
    totalClients: number;
    totalWonValue: number;
}

export interface CrmClient {
    id: string;
    sellerId: string;
    name: string;
    document?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    city?: string;
    state?: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        deals: number;
    };
}

export interface CrmDeal {
    id: string;
    clientId: string;
    sellerId: string;
    title: string;
    expectedValue: number;
    probability: number;
    stage: DealStage;
    status: DealStatus;
    expectedDate?: string;
    createdAt: string;
    updatedAt: string;
    client?: {
        name: string;
        avatarUrl?: string;
    };
}

export interface CreateClientData {
    name: string;
    document?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    city?: string;
    state?: string;
}

export interface CreateDealData {
    clientId: string;
    title: string;
    expectedValue: number;
    probability?: number;
}

export const crmService = {
    async getMetrics(): Promise<CrmMetrics> {
        const response = await api.get('/crm/metrics');
        return response.data;
    },

    async getClients(): Promise<CrmClient[]> {
        const response = await api.get('/crm/clients');
        return response.data;
    },

    async createClient(data: CreateClientData): Promise<CrmClient> {
        const response = await api.post('/crm/clients', data);
        return response.data;
    },

    async updateClient(id: string, data: Partial<CreateClientData>): Promise<CrmClient> {
        const response = await api.put(`/crm/clients/${id}`, data);
        return response.data;
    },

    async deleteClient(id: string): Promise<void> {
        await api.delete(`/crm/clients/${id}`);
    },

    async getDeals(): Promise<CrmDeal[]> {
        const response = await api.get('/crm/deals');
        return response.data;
    },

    async getChatHistory(dealId: string): Promise<any[]> {
        const response = await api.get(`/crm/deals/${dealId}/messages`);
        return response.data;
    },

    async getGlobalDeals(): Promise<any[]> {
        const response = await api.get('/crm/deals/global');
        return response.data;
    },

    async claimDeal(dealId: string): Promise<any> {
        const response = await api.post(`/crm/deals/${dealId}/claim`);
        return response.data;
    },

    async createDeal(data: CreateDealData): Promise<CrmDeal> {
        const response = await api.post('/crm/deals', data);
        return response.data;
    },

    async updateDealStage(id: string, stage: DealStage): Promise<CrmDeal> {
        const response = await api.patch(`/crm/deals/${id}/stage`, { stage });
        return response.data;
    },

    async updateDealStatus(id: string, status: DealStatus): Promise<CrmDeal> {
        const response = await api.patch(`/crm/deals/${id}/status`, { status });
        return response.data;
    }
};