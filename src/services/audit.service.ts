import { api } from '@/lib/axios';

export type AuditLevel = 'info' | 'warning' | 'error';
export type AuditSource = 'api' | 'database' | 'repository' | 'client';

export interface AuditLog {
    id: string;
    createdAt: string;
    level: AuditLevel;
    source: AuditSource;
    action: string;
    entity: string | null;
    entityId: string | null;
    summary: string;
    /** fields: { campo: { from, to } } | after | before | stack | url | message | kind... */
    changes: Record<string, unknown> | null;
    actorId: string | null;
    actorName: string | null;
    actorRole: string | null;
    ip: string | null;
    method: string | null;
    path: string | null;
    status: number | null;
    requestId: string | null;
}

export interface AuditFilters {
    level?: AuditLevel | '';
    source?: AuditSource | '';
    entity?: string;
    q?: string;
    days: number;
    page?: number;
    pageSize?: number;
}

export interface AuditPage {
    items: AuditLog[];
    total: number;
    page: number;
    pageSize: number;
    counts: Partial<Record<AuditLevel, number>>;
}

const clean = (f: AuditFilters) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '' && v != null));

export const auditService = {
    async list(filters: AuditFilters): Promise<AuditPage> {
        const response = await api.get('/audit', { params: clean(filters) });
        return response.data;
    },

    async facets(): Promise<{ entities: { entity: string; count: number }[] }> {
        const response = await api.get('/audit/facets');
        return response.data;
    },
};
