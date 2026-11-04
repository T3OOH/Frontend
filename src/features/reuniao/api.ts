import axios, { isAxiosError } from 'axios';
import { readSession, tokenExp, validToken } from '@/lib/session';
import type { Meeting, MeetingMessage } from './tipos';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';
const STAFF = ['ADMIN', 'MANAGER', 'COMERCIAL'];

export interface Credencial {
    /** 'reuniao': token de reunião vindo no fragmento da URL; 'site': sessão da equipe no site. */
    tipo: 'reuniao' | 'site';
    obterToken: () => Promise<string | null>;
    /** Id do usuário dono da credencial (para se reconhecer na lista de participantes). */
    usuarioId: string | null;
    nome: string | null;
}

export class ErroAcesso extends Error {}

const chaveToken = (id: string) => `@t3:reuniao:${id}:token`;
function subDoToken(token: string): string | null {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return typeof payload.sub === 'string' ? payload.sub : null;
    } catch { return null; }
}

const seguro = <T,>(fn: () => T, padrao: T): T => { try { return fn(); } catch { return padrao; } };

/**
 * Descobre com que credencial entrar:
 * 1. `#t=<token>` na URL: guarda na aba (por reunião) e tira o fragmento do endereço;
 * 2. token já guardado nesta aba (recarregar a página);
 * 3. sessão do site, só para a equipe.
 */
export function resolverCredencial(id: string): Credencial {
    if (typeof window !== 'undefined' && window.location.hash) {
        const t = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('t');
        if (t) {
            seguro(() => sessionStorage.setItem(chaveToken(id), t), undefined);
            window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
        }
    }
    const guardado = seguro(() => sessionStorage.getItem(chaveToken(id)), null);
    if (guardado) {
        const exp = tokenExp(guardado);
        if (exp && exp <= Date.now()) {
            seguro(() => sessionStorage.removeItem(chaveToken(id)), undefined);
            throw new ErroAcesso('O link desta reunião expirou. Abra a reunião novamente pelo aplicativo ou pelo site.');
        }
        return { tipo: 'reuniao', obterToken: async () => guardado, usuarioId: subDoToken(guardado), nome: null };
    }
    const sessao = readSession();
    if (!sessao) throw new ErroAcesso('Você precisa entrar na sua conta da equipe para participar desta reunião.');
    if (!STAFF.includes(sessao.user.role)) throw new ErroAcesso('As reuniões são exclusivas da equipe T3.');
    return { tipo: 'site', obterToken: () => validToken(), usuarioId: sessao.user.id, nome: sessao.user.name };
}

/** Cliente próprio: sem o interceptador do site (que tentaria renovar a sessão e redirecionar ao login). */
export function criarCliente(cred: Credencial) {
    const http = axios.create({ baseURL: API_URL, timeout: 15_000 });
    http.interceptors.request.use(async (config) => {
        const token = await cred.obterToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });
    return {
        reuniao: async (id: string) => (await http.get<Meeting>(`/meetings/${id}`)).data,
        ice: async () => (await http.get<{ iceServers: RTCIceServer[] }>('/meetings/ice')).data.iceServers,
        mensagens: async (id: string) => (await http.get<MeetingMessage[]>(`/meetings/${id}/messages`)).data,
        encerrar: async (id: string) => { await http.post(`/meetings/${id}/end`); },
    };
}

export function mensagemDeErro(e: unknown): string {
    if (e instanceof ErroAcesso) return e.message;
    if (isAxiosError(e)) {
        const s = e.response?.status;
        if (s === 401) return 'Sua credencial não é mais válida. Abra a reunião novamente.';
        if (s === 403) return 'Você não foi convidado para esta reunião.';
        if (s === 404) return 'Reunião não encontrada.';
        if (!e.response) return 'Não foi possível falar com o servidor. Verifique sua conexão.';
    }
    return 'Não foi possível abrir a reunião.';
}
