import { api } from '../lib/axios';
import type { DealLine, SolutionDetails } from '../lib/solution';

export type { DealLine, SolutionDetails };

export type DealStage = 'NEW_LEAD' | 'FIRST_CONTACT' | 'NEGOTIATION' | 'WAITING_REPLY' | 'PROPOSAL_SENT' | 'POST_SALES';
export type DealStatus = 'OPEN' | 'WON' | 'LOST';

export interface CrmMetrics {
    totalExpectedValue: number;
    totalActiveDeals: number;
    totalClients: number;
    totalWonValue: number;
    /** Separado por linha de negócio. */
    byLine?: Record<DealLine, { activeDeals: number; expectedValue: number; wonDeals: number; wonValue: number }>;
}

export interface CrmClient {
    id: string;
    sellerId: string;
    name: string;
    company?: string;
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
    contractMonths?: number;
    originalValue?: number;
    /** T3 OOH (telões) ou T3 Solution (venda e instalação de painéis). */
    line?: DealLine;
    /** Projeto da Solution: aplicação, ambiente, medidas, pitch e serviços. */
    solution?: SolutionDetails | null;
    client?: {
        name: string;
        avatarUrl?: string;
        email?: string;
        phone?: string;
        whatsapp?: string;
        company?: string;
        document?: string;
    };
    seller?: { name: string } | null;
    items?: { id: string; panelId: string; priceSnapshot: number; panel?: { name: string; city?: string; state?: string } }[];
}

export interface CreateClientData {
    name: string;
    company?: string;
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
    line?: DealLine;
    solution?: SolutionDetails | null;
}

export interface UpdateDealData {
    title?: string;
    expectedValue?: number;
    probability?: number;
    solution?: SolutionDetails | null;
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

    /** Edita valor, probabilidade, título e o projeto da Solution. */
    async updateDeal(id: string, data: UpdateDealData): Promise<CrmDeal> {
        const response = await api.patch(`/crm/deals/${id}`, data);
        return response.data;
    },

    async getDeals(): Promise<CrmDeal[]> {
        const response = await api.get('/crm/deals');
        return response.data;
    },

    async getChatHistory(dealId: string): Promise<any[]> {
        const response = await api.get(`/crm/deals/${dealId}/messages`);
        return response.data;
    },

    /** Fila: orçamentos do site ainda sem consultor. */
    async getGlobalDeals(): Promise<CrmDeal[]> {
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