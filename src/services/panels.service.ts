import { api } from '../lib/axios';

export type PanelStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';

export const panelStatusLabel: Record<PanelStatus, string> = {
    AVAILABLE: 'Disponível',
    OCCUPIED: 'Ocupado',
    MAINTENANCE: 'Em manutenção',
    RESERVED: 'Reservado',
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
    price?: number | null;
    categoryId?: string | null; 
    city?: string | null;
    state?: string | null;
    address?: string | null;
    description?: string | null;
}

export type PanelInput = Omit<PanelData, 'id'>;

let panelsCache: PanelData[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 1000 * 60 * 5;

// Cópia local da última lista: quem volta ao site vê os painéis na hora, antes da API responder
const STORAGE_KEY = 't3:panels';
// Cópia gerada no build (scripts/prerender.mjs), servida pela CDN: vale para a primeira visita
const SNAPSHOT_URL = '/panels.json';

const readStored = (): PanelData[] | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : null;
        return Array.isArray(data) && data.length ? data : null;
    } catch {
        return null;
    }
};

const store = (data: PanelData[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* sem espaço ou bloqueado */ }
};

const fetchSnapshot = async (): Promise<PanelData[] | null> => {
    try {
        const res = await fetch(SNAPSHOT_URL, { cache: 'no-cache' });
        const data = res.ok ? await res.json() : null;
        return Array.isArray(data) && data.length ? data : null;
    } catch {
        return null;
    }
};

// Telas abertas juntas dividem a mesma busca
let inflight: Promise<PanelData[]> | null = null;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Busca na API com até 3 tentativas: a API pode estar acordando ou a rede pode oscilar. */
const fetchFromApi = async (): Promise<PanelData[]> => {
    let lastError: unknown;
    for (const delay of [0, 1500, 4000]) {
        if (delay) await wait(delay);
        try {
            const response = await api.get('/panels', { timeout: 20_000 });
            return response.data;
        } catch (error) {
            lastError = error;
            const status = (error as { response?: { status?: number } }).response?.status;
            // Erro do pedido (4xx) não melhora repetindo
            if (status && status < 500) break;
        }
    }
    throw lastError;
};

export const panelsService = {
    /**
     * Lista de painéis. Com `onCached`, a tela recebe na hora a última lista conhecida
     * (memória, cópia local ou a do build) e depois a lista atual da API.
     * Se a API falhar, devolve a última lista conhecida em vez de erro.
     */
    async getAllPanels(onCached?: (data: PanelData[]) => void): Promise<PanelData[]> {
        const now = Date.now();
        if (panelsCache && (now - cacheTimestamp < CACHE_DURATION)) {
            return panelsCache;
        }

        let known = panelsCache ?? readStored();
        let fresh = false;
        if (known) onCached?.(known);
        else {
            // Primeira visita: a cópia do build costuma chegar antes da API
            fetchSnapshot().then((snapshot) => {
                if (snapshot && !fresh) { known = snapshot; onCached?.(snapshot); }
            });
        }

        try {
            inflight ??= fetchFromApi().finally(() => { inflight = null; });
            const data = await inflight;
            fresh = true;
            panelsCache = data;
            cacheTimestamp = Date.now();
            store(data);
            return data;
        } catch (error) {
            const fallback = known ?? (await fetchSnapshot());
            if (fallback) return fallback;
            throw error;
        }
    },

    // ==========================================
    // NOVA FUNÇÃO: Busca apenas dados vitais para o mapa
    // ==========================================
    async getMapMarkers(): Promise<Partial<PanelData>[]> {
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
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* indisponível */ }
        cacheTimestamp = 0;
    }
};

// Atualizado para suportar a criação de pastas organizadas no Supabase
export async function uploadImage(file: File, folderId?: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    // Envia o folderId via Query Params para o backend interceptar
    const response = await api.post('/upload', formData, {
        params: { folderId }
    });
    
    return response.data.url;
}