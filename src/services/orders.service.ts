import { api } from '../lib/axios';

export type OrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface OrderData {
    id: string;
    userId: string;
    panelId?: string;
    status: OrderStatus;
    totalValue: number;
    startDate?: string;
    endDate?: string;
    notes?: string;
    createdAt: string;
    user: { 
        name: string; 
        email: string; 
    };
    panel?: { 
        name: string; 
        city: string; 
        state: string; 
    };
}

export const ordersService = {
    async getAllOrders(): Promise<OrderData[]> {
        const response = await api.get('/orders');
        return response.data;
    },

    async updateOrderStatus(id: string, status: OrderStatus): Promise<OrderData> {
        const response = await api.patch(`/orders/${id}/status`, { status });
        return response.data;
    },

    // Deixaremos o método create pronto para quando formos integrar o botão de "Comprar" no mapa
    async createOrder(data: Partial<OrderData>): Promise<OrderData> {
        const response = await api.post('/orders', data);
        return response.data;
    }
};