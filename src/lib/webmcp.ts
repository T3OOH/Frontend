/**
 * WebMCP: ferramentas que assistentes de IA rodando no navegador (agentes do Chrome, extensões)
 * podem chamar no site, em vez de "clicar" na interface. Só leitura e navegação: nada aqui
 * envia formulário, cria conta ou mexe em dados.
 *
 * Proposta do W3C Web Machine Learning CG: `navigator.modelContext`. Navegadores sem suporte
 * simplesmente ignoram (nenhum efeito para o visitante).
 */

const API = import.meta.env.VITE_API_URL || 'http://localhost:3333';

interface ToolResult { content: { type: 'text'; text: string }[] }
interface WebMcpTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    execute: (input: Record<string, unknown>) => Promise<ToolResult>;
}
interface ModelContext {
    provideContext?: (ctx: { tools: WebMcpTool[] }) => void;
    registerTool?: (tool: WebMcpTool) => void;
}

interface PainelApi {
    name?: string; address?: string; city?: string; state?: string; size?: string;
    price?: number; impacts?: number; playbackSeconds?: number; status?: string;
}

const PAGINAS: Record<string, string> = {
    inicio: '/', mapa: '/mapa', catalogo: '/servicos', solution: '/solution',
    sobre: '/sobre', contato: '/contato', privacidade: '/privacidade', termos: '/termos',
};

const texto = (text: string): ToolResult => ({ content: [{ type: 'text', text }] });
const real = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Lista de painéis: API e, se ela estiver dormindo, a cópia publicada com o site. */
async function carregarPaineis(): Promise<PainelApi[]> {
    for (const url of [`${API}/panels`, '/panels.json']) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
            if (!res.ok) continue;
            const data = await res.json();
            const lista = Array.isArray(data) ? data : data?.panels ?? data?.data ?? [];
            if (lista.length) return lista as PainelApi[];
        } catch { /* tenta a próxima fonte */ }
    }
    return [];
}

const tools: WebMcpTool[] = [
    {
        name: 'buscar_paineis',
        description: 'Lista os painéis de LED da T3 LED (mídia exterior em Goiânia e Goiás) com cidade, endereço, formato, impactos e valor mensal. Filtra por cidade ou trecho do endereço.',
        inputSchema: {
            type: 'object',
            properties: { busca: { type: 'string', description: 'Cidade, bairro ou avenida (opcional)' } },
        },
        async execute(input) {
            const busca = String(input?.busca ?? '').trim().toLowerCase();
            const paineis = (await carregarPaineis())
                .filter((p) => !p.status || p.status === 'ACTIVE' || p.status === 'AVAILABLE')
                .filter((p) => !busca || `${p.name} ${p.address} ${p.city}`.toLowerCase().includes(busca));
            if (!paineis.length) return texto(busca ? `Nenhum painel encontrado para "${busca}". Veja o mapa completo em https://t3led.com.br/mapa.` : 'Não foi possível carregar os painéis agora. Veja https://t3led.com.br/mapa.');
            const linhas = paineis.slice(0, 50).map((p) => [
                `- ${p.name}`,
                p.city ? `${p.city}${p.state ? `/${p.state}` : ''}` : '',
                p.size ? `formato ${p.size}` : '',
                p.impacts ? `${p.impacts.toLocaleString('pt-BR')} impactos/dia` : '',
                p.price ? `${real(p.price)}/mês` : '',
            ].filter(Boolean).join(' · '));
            return texto(`${paineis.length} painel(is). Desconto por prazo: 15% em 3 meses, 20% em 6 e 30% a partir de 12.\n${linhas.join('\n')}\nOrçamento: https://t3led.com.br/mapa`);
        },
    },
    {
        name: 'contato_comercial',
        description: 'Contatos do comercial da T3 LED (WhatsApp e e-mail) para orçamento de painéis de LED e da T3 Solution.',
        inputSchema: { type: 'object', properties: {} },
        async execute() {
            return texto('Comercial da T3 LED (T3 LED Mídia e Tecnologia, CNPJ 43.773.494/0001-50, Goiânia - GO):\n- WhatsApp Victor Hugo: (62) 9320-6010\n- WhatsApp Lucas Dourado: (64) 9283-2807\n- E-mail: contato@t3comunicacao.com\n- Formulário: https://t3led.com.br/contato');
        },
    },
    {
        name: 'abrir_pagina',
        description: 'Abre uma página pública do site da T3 LED.',
        inputSchema: {
            type: 'object',
            properties: { pagina: { type: 'string', enum: Object.keys(PAGINAS), description: 'Página a abrir' } },
            required: ['pagina'],
        },
        async execute(input) {
            const destino = PAGINAS[String(input?.pagina)];
            if (!destino) return texto(`Página desconhecida. Opções: ${Object.keys(PAGINAS).join(', ')}.`);
            window.location.assign(destino);
            return texto(`Abrindo https://t3led.com.br${destino}`);
        },
    },
];

/** Registra as ferramentas se o navegador expõe `navigator.modelContext`. */
export function registrarFerramentasWebMcp() {
    const ctx = (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
    if (!ctx) return;
    try {
        if (typeof ctx.provideContext === 'function') ctx.provideContext({ tools });
        else if (typeof ctx.registerTool === 'function') tools.forEach((t) => ctx.registerTool!(t));
    } catch { /* API experimental: falha não pode afetar o site */ }
}
