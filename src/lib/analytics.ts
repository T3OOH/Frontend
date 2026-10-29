import { api } from '@/lib/axios';

/**
 * Estatísticas próprias e anônimas do site (sem cookies de terceiros, sem IP).
 *  - visita: id aleatório por aba (sessionStorage), some ao fechar a aba;
 *  - origem: UTM, clique de anúncio (gclid/fbclid) ou site de onde a pessoa veio;
 *  - primeira origem: guardada no navegador por 90 dias para saber como a pessoa conheceu a T3.
 * Os formulários de lead (contato, orçamento, pedido e cadastro) levam a origem junto.
 * Quem escolhe "Só o essencial" no aviso de privacidade não é contado.
 */

export interface Touch {
    source: string;
    medium: string | null;
    campaign: string | null;
    term: string | null;
    content: string | null;
    referrer: string | null;
    landingPage: string;
    at: string;
}

const SESSION_KEY = '@t3:visit';
const FIRST_KEY = '@t3:first-touch';
const FIRST_TTL = 90 * 24 * 3600 * 1000;
export const CONSENT_KEY = 't3-cookie-consent';

/** Domínio de quem indicou → origem e meio, no mesmo vocabulário das UTMs. */
const REFERRERS: [RegExp, string, string][] = [
    [/(^|\.)google\./, 'google', 'organico'],
    [/(^|\.)bing\.com$/, 'bing', 'organico'],
    [/(^|\.)(duckduckgo\.com|search\.yahoo\.com|yandex\.)/, 'buscador', 'organico'],
    [/(^|\.)(chatgpt\.com|chat\.openai\.com)$/, 'chatgpt', 'ia'],
    [/(^|\.)perplexity\.ai$/, 'perplexity', 'ia'],
    [/(^|\.)claude\.ai$/, 'claude', 'ia'],
    [/(^|\.)gemini\.google\.com$/, 'gemini', 'ia'],
    [/(^|\.)copilot\.microsoft\.com$/, 'copilot', 'ia'],
    [/(^|\.)instagram\.com$/, 'instagram', 'social'],
    [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, 'facebook', 'social'],
    [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'linkedin', 'social'],
    [/(^|\.)(t\.co|x\.com|twitter\.com)$/, 'x', 'social'],
    [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube', 'social'],
    [/(^|\.)tiktok\.com$/, 'tiktok', 'social'],
    [/(^|\.)(whatsapp\.com|wa\.me|l\.wl\.co)$/, 'whatsapp', 'social'],
];

const safe = <T,>(fn: () => T, fallback: T): T => { try { return fn(); } catch { return fallback; } };
const clip = (v: string | null | undefined, max = 150) => (v ? v.trim().slice(0, max) : null);

export const trackingAllowed = () => safe(() => localStorage.getItem(CONSENT_KEY) !== 'essential', true);

/** Origem desta chegada ao site (sem UTM e sem referência externa = "direto"). */
function currentTouch(): Touch {
    const url = new URL(window.location.href);
    const q = url.searchParams;
    const landingPage = `${url.pathname}${url.search}`.slice(0, 300);
    const at = new Date().toISOString();
    const ref = safe(() => (document.referrer ? new URL(document.referrer) : null), null);
    const refHost = ref && ref.host !== window.location.host ? ref.host.replace(/^www\./, '') : null;
    const base = { campaign: clip(q.get('utm_campaign')), term: clip(q.get('utm_term')), content: clip(q.get('utm_content')), referrer: refHost, landingPage, at };

    if (q.get('utm_source')) {
        return { ...base, source: clip(q.get('utm_source'), 80)!.toLowerCase(), medium: clip(q.get('utm_medium'), 80)?.toLowerCase() ?? 'campanha' };
    }
    if (q.get('gclid') || q.get('gbraid') || q.get('wbraid')) return { ...base, source: 'google', medium: 'anuncio' };
    if (q.get('fbclid')) return { ...base, source: refHost?.includes('instagram') ? 'instagram' : 'facebook', medium: 'social' };
    if (refHost) {
        const known = REFERRERS.find(([re]) => re.test(refHost));
        return { ...base, source: known ? known[1] : refHost, medium: known ? known[2] : 'referencia' };
    }
    return { ...base, source: 'direto', medium: null };
}

interface Visit { id: string; touch: Touch }

/** Visita desta aba: criada na primeira página e mantida enquanto a aba estiver aberta. */
function visit(): Visit {
    const saved = safe(() => JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') as Visit | null, null);
    const touch = currentTouch();
    // Nova origem durante a mesma aba (ex.: voltou por um link de campanha) substitui "direto"
    if (saved && !(touch.source !== 'direto' && saved.touch.source === 'direto')) return saved;
    const next: Visit = {
        id: saved?.id ?? safe(() => crypto.randomUUID(), `${Date.now()}-${Math.random().toString(36).slice(2)}`),
        touch,
    };
    safe(() => sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)), undefined);
    if (trackingAllowed()) rememberFirstTouch(touch);
    return next;
}

function rememberFirstTouch(touch: Touch) {
    safe(() => {
        const saved = JSON.parse(localStorage.getItem(FIRST_KEY) || 'null') as Touch | null;
        if (saved && Date.now() - new Date(saved.at).getTime() < FIRST_TTL) return;
        localStorage.setItem(FIRST_KEY, JSON.stringify(touch));
    }, undefined);
}

/** Origem enviada junto do lead: a desta visita e a primeira registrada. */
export function leadAttribution() {
    const { touch } = visit();
    const first = trackingAllowed() ? safe(() => JSON.parse(localStorage.getItem(FIRST_KEY) || 'null') as Touch | null, null) : null;
    return { ...touch, first: first && first.at !== touch.at ? first : null };
}

function device() {
    const ua = navigator.userAgent;
    if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobi/i.test(ua))) return 'tablet';
    return /Mobi|iPhone|Android/i.test(ua) ? 'mobile' : 'desktop';
}
const browser = () => {
    const ua = navigator.userAgent;
    return /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Outro';
};
const os = () => {
    const ua = navigator.userAgent;
    return /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Outro';
};

const INTERNAL = /^\/(dashboard|crm)(\/|$)/;

function send(type: 'pageview' | 'whatsapp_click', path: string) {
    if (!trackingAllowed() || INTERNAL.test(path)) return;
    const { id, touch } = visit();
    api.post('/analytics/events', {
        type, path: path.slice(0, 300), sessionId: id,
        source: touch.source, medium: touch.medium, campaign: touch.campaign,
        landingPage: touch.landingPage, referrer: touch.referrer,
        device: device(), browser: browser(), os: os(),
    }).catch(() => { /* estatística nunca atrapalha a navegação */ });
}

let lastPath = '';
export function trackPageview(path: string) {
    if (path === lastPath) return;
    lastPath = path;
    send('pageview', path);
}

const isWhatsApp = (href: string) => /(^|\/\/)(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//.test(href);

let installed = false;
/**
 * Liga as estatísticas uma vez: cliques para o WhatsApp (links e janelas abertas pelo site)
 * e a origem anexada aos envios de lead.
 */
export function installAnalytics() {
    if (installed || typeof window === 'undefined') return;
    installed = true;
    visit();

    document.addEventListener('click', (e) => {
        const link = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
        if (link && isWhatsApp(link.href)) send('whatsapp_click', window.location.pathname);
    }, true);

    // Botões que abrem o WhatsApp por window.open (ex.: "Falar com o consultor")
    const open = window.open.bind(window);
    window.open = (url?: string | URL, ...rest) => {
        if (url && isWhatsApp(String(url))) send('whatsapp_click', window.location.pathname);
        return open(url, ...rest);
    };

    // Formulários de lead levam a origem (o servidor ignora se vier inválida)
    const LEAD_URLS = /^\/(contacts|crm\/deals\/checkout|crm\/deals\/solution|orders|auth\/register|auth\/google)\/?$/;
    api.interceptors.request.use((config) => {
        if (config.method === 'post' && LEAD_URLS.test(String(config.url ?? '')) && config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
            config.data = { ...config.data, attribution: leadAttribution() };
        }
        return config;
    });
}
