import { readSession } from './session';

/**
 * Erros do navegador vão para o registro da gestão (Gestão > Registros).
 * O código devolvido acompanha a mensagem do botão "Acionar suporte".
 */

type Kind = 'exception' | 'rejection' | 'render' | 'chunk';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3333';

/** Último erro do navegador: o suporte recebe o código junto. */
export let lastReported: { message: string; code: string | null; at: number } | null = null;

const recent = new Map<string, number>();

/** Ruído que não é erro do site (extensões, avisos do navegador). */
const IGNORED = [/ResizeObserver loop/i, /extension:\/\//i, /^Script error\.?$/i, /Non-Error promise rejection captured/i];

export async function reportError(error: unknown, kind: Kind = 'exception'): Promise<string | null> {
    const err = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error) ?? 'Erro desconhecido');
    const message = (err.message || 'Erro desconhecido').slice(0, 1000);
    if (IGNORED.some((re) => re.test(message) || re.test(err.stack ?? ''))) return null;

    // O mesmo erro repetido em 30 s é enviado uma vez só
    const last = recent.get(message) ?? 0;
    if (Date.now() - last < 30_000) return lastReported?.message === message ? lastReported.code : null;
    recent.set(message, Date.now());
    lastReported = { message, code: null, at: Date.now() };

    try {
        const token = readSession()?.token;
        const res = await fetch(`${API}/audit/client-error`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ message, stack: err.stack?.slice(0, 4000) ?? null, url: window.location.href.slice(0, 300), userAgent: navigator.userAgent.slice(0, 300), kind }),
            keepalive: true,
        });
        const data = res.ok ? await res.json() : null;
        const code = typeof data?.id === 'string' ? data.id : null;
        if (lastReported?.message === message) lastReported.code = code;
        return code;
    } catch {
        return null;
    }
}

/** Arquivo de uma versão antiga do site (depois de um deploy): recarregar resolve. */
export const isChunkError = (error: unknown) =>
    error instanceof Error && /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(error.message);

/** Captura erros não tratados da página inteira. */
export function installGlobalErrorHandlers() {
    window.addEventListener('error', (event) => {
        // Erro de carregamento de imagem ou script externo não tem "error"
        if (event.error) void reportError(event.error, 'exception');
    });
    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        // Respostas da API já ficam no registro pelo servidor
        if (reason && typeof reason === 'object' && 'isAxiosError' in reason) return;
        void reportError(reason, isChunkError(reason) ? 'chunk' : 'rejection');
    });
}
