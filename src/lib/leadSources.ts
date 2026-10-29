/* Nomes das origens de visitas e leads (Tráfego e Relatórios). */

/** Nomes das origens como o gestor fala, não como o navegador manda. */
export const SOURCE_LABEL: Record<string, string> = {
    direto: 'Direto', google: 'Google', bing: 'Bing', buscador: 'Outros buscadores', chatgpt: 'ChatGPT', perplexity: 'Perplexity',
    claude: 'Claude', gemini: 'Gemini', copilot: 'Copilot', instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn',
    x: 'X (Twitter)', youtube: 'YouTube', tiktok: 'TikTok', whatsapp: 'WhatsApp', email: 'E-mail', 'sem registro': 'Sem registro',
};
export const MEDIUM_LABEL: Record<string, string> = {
    organico: 'busca orgânica', anuncio: 'anúncio', social: 'rede social', ia: 'assistente de IA', referencia: 'link em outro site',
    campanha: 'campanha', cpc: 'anúncio', email: 'e-mail',
};
export const sourceName = (s: string) => SOURCE_LABEL[s] ?? s;
export const mediumName = (m: string | null) => (m ? m.split(', ').map((x) => MEDIUM_LABEL[x] ?? x).join(', ') : '');
