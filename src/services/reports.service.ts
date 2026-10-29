import { api } from '@/lib/axios';

export type ReportPeriod = 30 | 90 | 180 | 365;

export interface ReportSummary {
    days: number;
    totals: {
        revenue: number;
        sales: number;
        averageTicket: number;
        conversion: number | null;
        won: number;
        lost: number;
        averageCycleDays: number | null;
        newDeals: number;
        openValue: number;
        forecast: number;
    };
    funnel: { stage: string; count: number; value: number }[];
    monthly: { month: string; deals: number; orders: number; total: number }[];
    sources: { source: string; leads: number; won: number; wonValue: number }[];
    lines: { line: 'OOH' | 'SOLUTION'; won: number; open: number }[];
}

export interface OccupancyReport {
    /** "2026-10", "2026-11"... */
    months: string[];
    /** Cada mês traz o cliente que ocupa o painel, ou null se está livre. */
    panels: { id: string; name: string; city: string | null; state: string | null; status: string; months: (string | null)[] }[];
    rate: number;
}

export const reportsService = {
    async summary(days: ReportPeriod): Promise<ReportSummary> {
        const response = await api.get('/reports/summary', { params: { days } });
        return response.data;
    },

    async occupancy(months = 6): Promise<OccupancyReport> {
        const response = await api.get('/reports/occupancy', { params: { months } });
        return response.data;
    },
};
