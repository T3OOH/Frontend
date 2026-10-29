import axios from 'axios';
import type { User } from '@/contexts/AuthContext';

/**
 * Sessão do usuário no navegador (ver docs/SEGURANCA.md no backend).
 *  - token: acesso curto (15 min); refreshToken: renova a sessão do aparelho.
 *  - "Manter conectado": localStorage (vale entre abas e depois de fechar o navegador).
 *    Sem a opção: sessionStorage (some ao fechar a aba).
 *  - A renovação é feita uma vez só mesmo com várias abas abertas (Web Locks) e a aba que
 *    renova avisa as outras pelo evento "storage".
 */
export const AUTH_STORAGE_KEY = '@t3ooh:session';
const DEVICE_KEY = '@t3:device';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export interface StoredSession {
    token: string;
    user: User;
    refreshToken?: string;
    persistent?: boolean;
}

const safe = <T,>(fn: () => T, fallback: T): T => { try { return fn(); } catch { return fallback; } };

/** Id aleatório deste navegador: o servidor reconhece aparelhos já usados e só avisa nos novos. */
export function deviceId() {
    return safe(() => {
        let id = localStorage.getItem(DEVICE_KEY);
        if (!id || !/^[A-Za-z0-9-]{16,64}$/.test(id)) {
            id = crypto.randomUUID();
            localStorage.setItem(DEVICE_KEY, id);
        }
        return id;
    }, undefined as unknown as string);
}

export function tokenExp(token: string) {
    return safe(() => {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
    }, 0);
}

function parse(raw: string | null): StoredSession | null {
    if (!raw) return null;
    const s = safe(() => JSON.parse(raw) as StoredSession, null);
    return s?.token && s.user ? s : null;
}

/** Sessão salva: primeiro a da aba, depois a mantida no navegador. */
export function readSession(): StoredSession | null {
    if (typeof window === 'undefined') return null;
    const s = parse(safe(() => sessionStorage.getItem(AUTH_STORAGE_KEY), null)) ?? parse(safe(() => localStorage.getItem(AUTH_STORAGE_KEY), null));
    if (!s) return null;
    // Token de acesso vencido sem como renovar (sessões antigas): descarta
    if (!s.refreshToken && tokenExp(s.token) <= Date.now()) {
        clearStorage();
        return null;
    }
    return s;
}

function clearStorage() {
    safe(() => sessionStorage.removeItem(AUTH_STORAGE_KEY), undefined);
    safe(() => localStorage.removeItem(AUTH_STORAGE_KEY), undefined);
}

type Listener = (s: StoredSession | null) => void;
const listeners = new Set<Listener>();
export const onSessionChange = (fn: Listener) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const notify = (s: StoredSession | null) => listeners.forEach((fn) => fn(s));

export function saveSession(s: StoredSession) {
    clearStorage();
    const raw = JSON.stringify(s);
    safe(() => (s.persistent ? localStorage : sessionStorage).setItem(AUTH_STORAGE_KEY, raw), undefined);
    notify(s);
}

export function clearSession() {
    clearStorage();
    notify(null);
}

// Outra aba entrou, renovou ou saiu: esta aba acompanha
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key !== AUTH_STORAGE_KEY) return;
        notify(parse(e.newValue));
    });
}

// ============================ RENOVAÇÃO ============================

/** Cliente sem interceptadores (a renovação não pode cair no próprio interceptador). */
const raw = axios.create({ baseURL: API_URL });
let inflight: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
    const current = readSession();
    if (!current?.refreshToken) return null;
    try {
        const { data } = await raw.post('/auth/refresh', { refreshToken: current.refreshToken });
        saveSession({ token: data.token, user: { ...current.user, ...data.user }, refreshToken: data.refreshToken, persistent: data.persistent });
        return data.token as string;
    } catch (error) {
        const status = (error as { response?: { status?: number } }).response?.status;
        // 409: outra aba renovou primeiro; usa o que ela gravou
        if (status === 409) {
            await new Promise((r) => setTimeout(r, 400));
            const latest = readSession();
            return latest && latest.refreshToken !== current.refreshToken ? latest.token : null;
        }
        // Sem rede ou servidor fora: mantém a sessão para tentar de novo depois
        if (!status || status >= 500) throw error;
        clearSession();
        return null;
    }
}

/**
 * Renova o token de acesso. Uma renovação por vez nesta aba e, com Web Locks, entre abas:
 * dentro do bloqueio relê a sessão, porque outra aba pode ter acabado de renovar.
 */
export function refreshSession(): Promise<string | null> {
    if (inflight) return inflight;
    const before = readSession()?.refreshToken;
    const run = async () => {
        const latest = readSession();
        if (latest && latest.refreshToken !== before && tokenExp(latest.token) - Date.now() > 60_000) return latest.token;
        return doRefresh();
    };
    const locks = typeof navigator !== 'undefined' ? (navigator as Navigator & { locks?: { request: (n: string, cb: () => Promise<string | null>) => Promise<string | null> } }).locks : undefined;
    inflight = (locks ? locks.request('t3-session-refresh', run) : run()).finally(() => { inflight = null; });
    return inflight;
}

/** Token válido para usar agora (renova antes, se faltar menos de 1 min para vencer). */
export async function validToken(): Promise<string | null> {
    const s = readSession();
    if (!s) return null;
    if (tokenExp(s.token) - Date.now() > 60_000) return s.token;
    return s.refreshToken ? refreshSession().catch(() => s.token) : s.token;
}

/** Sai deste aparelho: o servidor encerra a sessão (sem esperar a resposta para limpar a tela). */
export function logoutSession() {
    const s = readSession();
    if (s) {
        raw.post('/auth/logout', { refreshToken: s.refreshToken }, { headers: { Authorization: `Bearer ${s.token}` } }).catch(() => {});
    }
    clearSession();
}
