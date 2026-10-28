import { api } from '../lib/axios';

export type OrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface OrderItem {
    id: string;
    panelId: string;
    /** Valor mensal do painel após descontos (calculado no servidor). */
    priceSnapshot: number;
    panel?: {
        id: string;
        name: string;
        city?: string | null;
        state?: string | null;
        images?: string[];
        price?: number | null;
    };
}

export interface OrderData {
    id: string;
    userId: string;
    sellerId?: string | null;
    status: OrderStatus;
    totalValue: number;
    startDate?: string | null;
    endDate?: string | null;
    notes?: string | null;
    createdAt: string;
    user: {
        name: string;
        email: string;
        phone?: string | null;
        companyName?: string | null;
    };
    seller?: { id: string; name: string } | null;
    items: OrderItem[];
}

export interface CreateOrderInput {
    months: number;
    couponCode?: string;
    notes?: string;
    startDate?: string;
    items: { panelId: string }[];
}

export const ordersService = {
    async getAllOrders(): Promise<OrderData[]> {
        const response = await api.get('/orders');
        return response.data;
    },

    async getOrder(id: string): Promise<OrderData> {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    },

    async updateOrder(id: string, data: { status?: OrderStatus; sellerId?: string | null }): Promise<OrderData> {
        const response = await api.patch(`/orders/${id}`, data);
        return response.data;
    },

    async createOrder(data: CreateOrderInput): Promise<OrderData> {
        const response = await api.post('/orders', data);
        return response.data;
    }
};
