/**
 * Pré-renderização para buscadores e IAs.
 *
 * O site é uma SPA: sem JavaScript, toda rota devolvia o mesmo HTML vazio, com o título e o
 * canonical da home. Robôs de IA (GPTBot, ClaudeBot, PerplexityBot...) não executam JavaScript,
 * então não liam nada. Depois do `vite build`, este script grava um HTML por página pública com:
 *  - título, descrição, canonical e Open Graph próprios;
 *  - dados estruturados (JSON-LD: empresa local, site, trilha, perguntas frequentes, serviços);
 *  - o conteúdo da página em HTML semântico dentro do #root (o React troca ao carregar).
 *
 * O vercel.json aponta /sobre para dist/sobre.html (e assim por diante); o resto continua na index.html.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const SITE = 'https://t3ooh.com';
const API = process.env.VITE_API_URL || 'https://backend-2go8.onrender.com';
const TODAY = new Date().toISOString().slice(0, 10);

const COMPANY = {
    name: 'T3 OOH',
    legalName: 'T3 LED Mídia e Tecnologia',
    taxID: '43.773.494/0001-50',
    email: 'contato@t3comunicacao.com',
    phones: ['+55 62 9320-6010', '+55 64 9283-2807'],
    city: 'Goiânia',
    region: 'GO',
    sameAs: ['https://www.instagram.com/t3led/', 'https://www.linkedin.com/company/agencia-t3/'],
};

const FAQ = [
    ['Onde a T3 OOH tem painéis de LED?', 'Em Goiânia e no interior de Goiás, nos corredores de maior fluxo. O mapa de painéis em t3ooh.com/mapa mostra cada ponto com localização, formato e investimento.'],
    ['Como contratar um painel de LED na T3?', 'Escolha os pontos no mapa ou no catálogo, defina o prazo da campanha e envie o orçamento. O time comercial responde pelo WhatsApp com a proposta e o contrato.'],
    ['Existe desconto para campanhas mais longas?', 'Sim. O valor mensal tem 15% de desconto em contratos de 3 meses, 20% em 6 meses e 30% a partir de 12 meses. Os contratos vão de 1 a 36 meses.'],
    ['Quanto custa anunciar em um painel de LED em Goiânia?', 'Cada ponto tem um valor mensal próprio, que aparece no mapa e no catálogo. O orçamento soma os pontos escolhidos e aplica o desconto do prazo e cupons válidos.'],
    ['O que é a T3 Solution?', 'É a linha de painéis de LED sob medida da T3 para casas, empresas, comércio e empreendimentos, com projeto, instalação e suporte.'],
    ['Como acompanho meus orçamentos?', 'Na área do cliente, em Meu perfil: lá ficam os orçamentos enviados pelo mapa e pelo catálogo, com a situação de cada um e o contato do consultor.'],
];

const nav = [
    ['/', 'Início'], ['/mapa', 'Mapa de painéis'], ['/servicos', 'Catálogo'], ['/solution', 'T3 Solution'],
    ['/sobre', 'Sobre a T3'], ['/contato', 'Contato'],
];

/** Páginas públicas. `body` é HTML semântico com o conteúdo principal da página. */
const PAGES = [
    {
        path: '/', file: 'index.html',
        title: 'T3 OOH | Painéis de LED e mídia exterior em Goiânia',
        description: 'Painéis de LED e mídia exterior (OOH/DOOH) em Goiânia e no interior de Goiás. Escolha os pontos no mapa, veja o investimento e receba o orçamento.',
        h1: 'Painéis de LED e mídia exterior em Goiânia',
        body: `<p>A T3 OOH opera telões de LED nos corredores de maior fluxo de Goiânia e do interior de Goiás. Você escolhe os pontos no mapa, vê formato, localização e investimento de cada painel e recebe o orçamento com os valores do plano.</p>
<h2>Como funciona</h2><ol><li>Escolha os painéis no <a href="${SITE}/mapa">mapa</a> ou no <a href="${SITE}/servicos">catálogo</a>.</li><li>Defina o prazo: 15% de desconto em 3 meses, 20% em 6 meses e 30% a partir de 12 meses.</li><li>Envie o orçamento e fale com o comercial pelo WhatsApp.</li></ol>
<h2>T3 Solution</h2><p>Painéis de LED sob medida para casas, empresas, comércio e empreendimentos: projeto, instalação e suporte. <a href="${SITE}/solution">Conheça a T3 Solution</a>.</p>`,
        faq: true,
    },
    {
        path: '/mapa', file: 'mapa.html',
        title: 'Mapa de painéis de LED em Goiânia e Goiás | T3 OOH',
        description: 'Veja no mapa os painéis de LED e pontos de mídia OOH da T3 em Goiânia e no interior de Goiás, com formato, localização e investimento. Monte seu orçamento.',
        h1: 'Mapa de painéis de LED',
        body: `<p>Todos os painéis de LED da T3 OOH no mapa, com localização, formato, resolução e valor mensal. Filtre por cidade, selecione os pontos e envie o orçamento.</p>`,
        panels: true,
    },
    {
        path: '/servicos', file: 'servicos.html',
        title: 'Catálogo de painéis de LED e mídia exterior | T3 OOH',
        description: 'Catálogo de painéis de LED e mídia exterior da T3 OOH com localização, formato e investimento mensal. Monte seu pacote e solicite orçamento.',
        h1: 'Catálogo de painéis',
        body: `<p>Lista completa dos painéis de LED da T3 OOH com cidade, endereço, formato e investimento mensal. Monte um pacote com vários pontos e escolha o prazo da campanha para ver o desconto.</p>`,
        panels: true,
        service: { name: 'Locação de painéis de LED (mídia DOOH)', type: 'Publicidade em mídia exterior' },
    },
    {
        path: '/solution', file: 'solution.html',
        title: 'T3 Solution | Painéis de LED sob medida',
        description: 'Painéis de LED sob medida para casas, empresas, comércio e empreendimentos: projeto, instalação e suporte com a T3 Solution, em Goiânia.',
        h1: 'T3 Solution: painéis de LED sob medida',
        body: `<p>A T3 Solution projeta, instala e dá suporte a painéis de LED para fachadas, lojas, empresas, eventos e residências. O time cuida do dimensionamento da tela, da estrutura e da operação do conteúdo.</p><p>Peça um orçamento pelo formulário da página ou fale com o comercial.</p>`,
        service: { name: 'Projeto e instalação de painéis de LED', type: 'Venda e instalação de painéis de LED' },
    },
    {
        path: '/sobre', file: 'sobre.html',
        title: 'Sobre a T3 OOH | Mídia exterior feita em Goiânia',
        description: 'Conheça a T3 OOH: telões de LED nos corredores de maior fluxo de Goiânia e do interior de Goiás, equipe e marcas que anunciam na rede.',
        h1: 'Feita em Goiânia. Vista pela cidade.',
        body: `<p>A T3 opera telões de LED nos corredores de maior fluxo de Goiânia e do interior de Goiás. A gente cuida do ponto, da tela e da veiculação, e você acompanha tudo pela plataforma.</p><p>${COMPANY.legalName}, CNPJ ${COMPANY.taxID}, ${COMPANY.city} - ${COMPANY.region}.</p>`,
    },
    {
        path: '/contato', file: 'contato.html',
        title: 'Contato comercial | T3 OOH',
        description: 'Fale com o time comercial da T3 OOH pelo WhatsApp ou formulário e planeje sua campanha em painéis de LED em Goiânia e Goiás.',
        h1: 'Fale com a T3',
        body: `<p>Atendimento comercial pelo WhatsApp: Victor Hugo (62) 9320-6010 e Lucas Dourado (64) 9283-2807. E-mail: <a href="mailto:${COMPANY.email}">${COMPANY.email}</a>.</p>`,
    },
    {
        path: '/privacidade', file: 'privacidade.html',
        title: 'Política de Privacidade | T3 OOH',
        description: 'Como a T3 OOH trata dados pessoais no site, no mapa de painéis, na área do cliente e nos canais de atendimento, conforme a LGPD.',
        h1: 'Política de Privacidade',
        body: `<p>Como a T3 OOH trata os dados pessoais de quem usa o site, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>`,
    },
    {
        path: '/termos', file: 'termos.html',
        title: 'Termos de Uso | T3 OOH',
        description: 'Regras de uso da plataforma T3 OOH: orçamentos, contas, conteúdo das campanhas e responsabilidades.',
        h1: 'Termos de Uso',
        body: `<p>Regras de uso da plataforma T3 OOH para orçamentos, contas e campanhas em painéis de LED.</p>`,
    },
];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Painéis públicos para listar no HTML (opcional: se a API não responder, a página sai sem a lista). */
async function fetchPanels() {
    try {
        const res = await fetch(`${API}/panels`, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) return [];
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.panels ?? data?.data ?? [];
        return list.filter((p) => p?.name).slice(0, 200);
    } catch {
        return [];
    }
}

function jsonLd(page) {
    const url = `${SITE}${page.path === '/' ? '/' : page.path}`;
    const org = {
        '@type': ['LocalBusiness', 'AdvertisingAgency'],
        '@id': `${SITE}/#empresa`,
        name: COMPANY.name,
        legalName: COMPANY.legalName,
        taxID: COMPANY.taxID,
        url: `${SITE}/`,
        logo: `${SITE}/t3-logo.webp`,
        image: `${SITE}/og-image.png`,
        email: COMPANY.email,
        telephone: COMPANY.phones[0],
        address: { '@type': 'PostalAddress', addressLocality: COMPANY.city, addressRegion: COMPANY.region, addressCountry: 'BR' },
        areaServed: [{ '@type': 'City', name: 'Goiânia' }, { '@type': 'State', name: 'Goiás' }],
        contactPoint: COMPANY.phones.map((telephone) => ({ '@type': 'ContactPoint', telephone, contactType: 'sales', areaServed: 'BR', availableLanguage: 'Portuguese' })),
        sameAs: COMPANY.sameAs,
        knowsAbout: ['mídia OOH', 'mídia DOOH', 'painéis de LED', 'publicidade em telões', 'mídia exterior'],
    };
    const graph = [
        org,
        { '@type': 'WebSite', '@id': `${SITE}/#site`, url: `${SITE}/`, name: COMPANY.name, inLanguage: 'pt-BR', publisher: { '@id': `${SITE}/#empresa` } },
        { '@type': 'WebPage', '@id': `${url}#pagina`, url, name: page.title, description: page.description, inLanguage: 'pt-BR', isPartOf: { '@id': `${SITE}/#site` }, dateModified: TODAY },
    ];
    if (page.path !== '/') {
        graph.push({
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE}/` },
                { '@type': 'ListItem', position: 2, name: page.h1, item: url },
            ],
        });
    }
    if (page.faq) {
        graph.push({
            '@type': 'FAQPage',
            mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        });
    }
    if (page.service) {
        graph.push({ '@type': 'Service', name: page.service.name, serviceType: page.service.type, provider: { '@id': `${SITE}/#empresa` }, areaServed: org.areaServed, url });
    }
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

function staticBody(page, panels) {
    const links = nav.map(([href, label]) => `<li><a href="${SITE}${href}">${esc(label)}</a></li>`).join('');
    const faq = page.faq
        ? `<section><h2>Perguntas frequentes</h2>${FAQ.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}</section>`
        : '';
    const list = page.panels && panels.length
        ? `<section><h2>Painéis disponíveis</h2><ul>${panels.map((p) => `<li>${esc(p.name)}${p.city ? ` – ${esc(p.city)}${p.state ? `/${esc(p.state)}` : ''}` : ''}${p.size ? ` · ${esc(p.size)}` : ''}</li>`).join('')}</ul></section>`
        : '';
    // Visualmente oculto (o React substitui ao carregar); legível para robôs e leitores sem JS
    return `<div data-prerender style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">
<header><nav aria-label="Principal"><ul>${links}</ul></nav></header>
<main><h1>${esc(page.h1)}</h1>${page.body}${list}${faq}</main>
<footer><p>${esc(COMPANY.legalName)} · CNPJ ${COMPANY.taxID} · ${COMPANY.city} - ${COMPANY.region} · ${COMPANY.email}</p></footer>
</div>`;
}

function render(template, page, panels) {
    const url = `${SITE}${page.path === '/' ? '/' : page.path}`;
    let html = template;
    const set = (re, value) => { if (!re.test(html)) throw new Error(`prerender: marcador não encontrado ${re}`); html = html.replace(re, value); };
    set(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`);
    set(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(page.description)}" />`);
    set(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
    set(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(page.title)}" />`);
    set(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(page.description)}" />`);
    set(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
    html = html.replace('</head>', `  <script type="application/ld+json">${jsonLd(page)}</script>\n</head>`);
    set(/<div id="root"><\/div>/, `<div id="root">${staticBody(page, panels)}</div>`);
    return html;
}

const template = await readFile(path.join(DIST, 'index.html'), 'utf8');
const panels = await fetchPanels();
for (const page of PAGES) {
    await writeFile(path.join(DIST, page.file), render(template, page, panels));
}
// Sitemap com a data do build (as páginas privadas ficam de fora)
const PRIORITY = { '/': '1.0', '/mapa': '0.9', '/servicos': '0.9', '/solution': '0.8', '/sobre': '0.6', '/contato': '0.7', '/privacidade': '0.2', '/termos': '0.2' };
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((p) => `  <url><loc>${SITE}${p.path}</loc><lastmod>${TODAY}</lastmod><priority>${PRIORITY[p.path] ?? '0.5'}</priority></url>`).join('\n')}
</urlset>
`;
await writeFile(path.join(DIST, 'sitemap.xml'), sitemap);
console.log(`prerender: ${PAGES.length} páginas, ${panels.length} painéis listados`);
