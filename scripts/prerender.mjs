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
 * O .htaccess (Hostinger) e o vercel.json apontam /sobre para dist/sobre.html (e assim por diante); o resto continua na index.html.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const SITE = 'https://t3led.com.br';
const API = process.env.VITE_API_URL || 'https://api.t3led.com.br';
const TODAY = new Date().toISOString().slice(0, 10);

const COMPANY = {
    name: 'T3 LED',
    // Como as pessoas procuram a empresa (Google "t3led", "t3 ooh"...)
    alternateName: ['T3LED', 'T3 OOH', 'T3 LED OOH', 'T3 LED Mídia e Tecnologia'],
    legalName: 'T3 LED Mídia e Tecnologia',
    taxID: '43.773.494/0001-50',
    email: 'contato@t3comunicacao.com',
    phones: ['+55 62 9320-6010', '+55 64 9283-2807'],
    city: 'Goiânia',
    region: 'GO',
    sameAs: ['https://www.instagram.com/t3led/', 'https://www.linkedin.com/company/agencia-t3/'],
};

const FAQ = [
    ['Onde a T3 OOH tem painéis de LED?', 'Em Goiânia e no interior de Goiás, nos corredores de maior fluxo. O mapa de painéis em t3led.com.br/mapa mostra cada ponto com localização, formato e investimento.'],
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

/**
 * Rodapé: páginas institucionais e legais (com as relações de link registradas na IANA).
 * O texto leva a tradução em inglês: verificadores de agentes de IA procuram "about", "contact" e "terms".
 */
const legalNav = [
    ['/sobre', 'Sobre a T3 LED (About us)', ''], ['/contato', 'Contato (Contact)', ''],
    ['/privacidade', 'Política de Privacidade (Privacy Policy)', 'privacy-policy'], ['/termos', 'Termos de Uso (Terms of Service)', 'terms-of-service'],
];

/** Páginas públicas. `body` é HTML semântico com o conteúdo principal da página. */
const PAGES = [
    {
        path: '/', file: 'index.html',
        // Quadros da tela de entrada (Gateway): maior elemento da primeira tela no celular
        // (celular: versão de 960 px; computador: 1280 px). Só a de cima: a de baixo não disputa a rede com ela.
        preloadImages: [
            { src: '/video/t3-cidade-poster.webp', srcset: '/video/t3-cidade-poster-960.webp 960w, /video/t3-cidade-poster.webp 1280w', sizes: '(min-width: 768px) 50vw, 100vw' },
        ],
        title: 'T3 LED | Painéis de LED e mídia exterior em Goiânia',
        description: 'Painéis de LED e mídia exterior (OOH/DOOH) em Goiânia e no interior de Goiás. Escolha os pontos no mapa, veja o investimento e receba o orçamento.',
        h1: 'Painéis de LED e mídia exterior em Goiânia',
        body: `<p>A T3 LED (T3 OOH) opera telões de LED nos corredores de maior fluxo de Goiânia e do interior de Goiás. Você escolhe os pontos no mapa, vê formato, localização e investimento de cada painel e recebe o orçamento com os valores do plano.</p>
<h2>Como funciona</h2><ol><li>Escolha os painéis no <a href="${SITE}/mapa">mapa</a> ou no <a href="${SITE}/servicos">catálogo</a>.</li><li>Defina o prazo: 15% de desconto em 3 meses, 20% em 6 meses e 30% a partir de 12 meses.</li><li>Envie o orçamento e fale com o comercial pelo WhatsApp.</li></ol>
<h2>T3 Solution</h2><p>Painéis de LED sob medida para casas, empresas, comércio e empreendimentos: projeto, instalação e suporte. <a href="${SITE}/solution">Conheça a T3 Solution</a>.</p>`,
        faq: true,
    },
    {
        path: '/mapa', file: 'mapa.html',
        // Tiles do mapa estático (staticMap) e do Leaflet: conexão aberta já no <head>
        preconnect: ['https://a.tile.openstreetmap.org', 'https://b.tile.openstreetmap.org', 'https://c.tile.openstreetmap.org'],
        title: 'Mapa de painéis de LED em Goiânia e Goiás | T3 LED',
        description: 'Veja no mapa os painéis de LED e pontos de mídia OOH da T3 em Goiânia e no interior de Goiás, com formato, localização e investimento. Monte seu orçamento.',
        h1: 'Mapa de painéis de LED',
        body: `<p>Todos os painéis de LED da T3 OOH no mapa, com localização, formato, resolução e valor mensal. Filtre por cidade, selecione os pontos e envie o orçamento.</p>`,
        panels: true,
    },
    {
        path: '/servicos', file: 'servicos.html',
        title: 'Catálogo de painéis de LED e mídia exterior | T3 LED',
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
        path: '/sobre', file: 'sobre.html', pageType: 'AboutPage',
        title: 'Sobre a T3 LED | Mídia exterior feita em Goiânia',
        description: 'Conheça a T3 LED (T3 OOH): telões de LED nos corredores de maior fluxo de Goiânia e do interior de Goiás, equipe e marcas que anunciam na rede.',
        h1: 'Feita em Goiânia. Vista pela cidade.',
        body: `<p>A T3 opera telões de LED nos corredores de maior fluxo de Goiânia e do interior de Goiás. A gente cuida do ponto, da tela e da veiculação, e você acompanha tudo pela plataforma.</p><p>${COMPANY.legalName}, CNPJ ${COMPANY.taxID}, ${COMPANY.city} - ${COMPANY.region}.</p>`,
    },
    {
        path: '/contato', file: 'contato.html', pageType: 'ContactPage',
        title: 'Contato comercial | T3 LED',
        description: 'Fale com o time comercial da T3 OOH pelo WhatsApp ou formulário e planeje sua campanha em painéis de LED em Goiânia e Goiás.',
        h1: 'Fale com a T3',
        body: `<p>Atendimento comercial pelo WhatsApp: Victor Hugo (62) 9320-6010 e Lucas Dourado (64) 9283-2807. E-mail: <a href="mailto:${COMPANY.email}">${COMPANY.email}</a>.</p>`,
    },
    {
        path: '/privacidade', file: 'privacidade.html',
        title: 'Política de Privacidade | T3 LED',
        description: 'Como a T3 OOH trata dados pessoais no site, no mapa de painéis, na área do cliente e nos canais de atendimento, conforme a LGPD.',
        h1: 'Política de Privacidade',
        body: `<p>Como a T3 OOH trata os dados pessoais de quem usa o site, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>`,
    },
    {
        path: '/termos', file: 'termos.html',
        title: 'Termos de Uso | T3 LED',
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
        return list;
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
        alternateName: COMPANY.alternateName,
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
        { '@type': 'WebSite', '@id': `${SITE}/#site`, url: `${SITE}/`, name: COMPANY.name, alternateName: COMPANY.alternateName, inLanguage: 'pt-BR', publisher: { '@id': `${SITE}/#empresa` } },
        { '@type': page.pageType ?? 'WebPage', '@id': `${url}#pagina`, url, name: page.title, description: page.description, inLanguage: 'pt-BR', isPartOf: { '@id': `${SITE}/#site` }, dateModified: TODAY },
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
    const footerLinks = legalNav.map(([href, label, rel]) => `<li><a href="${SITE}${href}"${rel ? ` rel="${rel}"` : ''}>${esc(label)}</a></li>`).join('');
    const faq = page.faq
        ? `<section><h2>Perguntas frequentes</h2>${FAQ.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}</section>`
        : '';
    const list = page.panels && panels.length
        ? `<section><h2>Painéis disponíveis</h2><ul>${panels.map((p) => `<li>${esc(p.name)}${p.city ? ` – ${esc(p.city)}${p.state ? `/${esc(p.state)}` : ''}` : ''}${p.size ? ` · ${esc(p.size)}` : ''}${p.playbackSeconds ? ` · ${Number(p.playbackSeconds)} s por inserção` : ''}</li>`).join('')}</ul></section>`
        : '';
    // Visualmente oculto (o React substitui ao carregar); legível para robôs e leitores sem JS
    return `<div data-prerender style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">
<header><nav aria-label="Principal"><ul>${links}</ul></nav></header>
<main><h1>${esc(page.h1)}</h1>${page.body}${list}${faq}</main>
<footer><nav aria-label="Institucional"><ul>${footerLinks}</ul></nav><p>${esc(COMPANY.legalName)} · CNPJ ${COMPANY.taxID} · ${COMPANY.city} - ${COMPANY.region} · ${COMPANY.email}</p></footer>
</div>`;
}

/**
 * Tela de escolha (Gateway) já no HTML da home: aparece na primeira pintura, antes do JavaScript.
 * No celular ela é o maior elemento da tela (LCP); esperar o React baixar e montar custava ~2 s.
 * Mesma aparência do src/components/Gateway.tsx (que toma o lugar dela ao carregar): mudar nos dois.
 * Sem JavaScript, os dois lados são links comuns.
 */
function staticGateway() {
    const lado = (href, poster, posterSet, pos, logo, srcset, sizes, w, h, logoW, eyebrow, title, cta, borda) => `
<a class="gw-l${borda ? ' gw-b' : ''}" href="${href}">
<img class="gw-bg" src="${poster}" srcset="${posterSet}" sizes="(min-width: 768px) 50vw, 100vw" alt="" width="1280" height="720" fetchpriority="${borda ? 'high' : 'auto'}" style="object-position:${pos}">
<span class="gw-v"></span>
<span class="gw-c"><img src="${logo}" srcset="${srcset}" sizes="${sizes}" width="${w}" height="${h}" alt="" style="width:${logoW}">
<span class="gw-e">${eyebrow}</span><span class="gw-t">${title}</span><span class="gw-a"><span class="gw-m">${cta}</span><span class="gw-k">Tocar para ver</span> &rarr;</span></span>
</a>`;
    return `<div id="gw-estatico" class="gw" role="dialog" aria-label="Escolha a empresa da T3">${
        lado('/mapa', '/video/t3-cidade-poster.webp', '/video/t3-cidade-poster-960.webp 960w, /video/t3-cidade-poster.webp 1280w', '30% 60%', '/t3-logo-160.webp', '/t3-logo-160.webp 160w, /t3-logo-224.webp 224w', '(min-width: 768px) 112px, 80px', 160, 160, 'var(--gw-l1)',
            'Mídia OOH · Goiânia e região', 'Anuncie nos telões da cidade', 'Entrar na T3 OOH', true)}${
        lado('/solution', '/video/t3-solution-casa-poster.webp', '/video/t3-solution-casa-poster-960.webp 960w, /video/t3-solution-casa-poster.webp 1280w', '64% 55%', '/t3-solution-3d-352.webp', '/t3-solution-3d-352.webp 352w, /t3-solution-3d-512.webp 512w', '(min-width: 768px) 256px, 176px', 352, 117, 'var(--gw-l2)',
            'Painéis de LED sob medida', 'Uma tela de LED do seu tamanho', 'Entrar na T3 Solution', false)}
<p class="gw-p">Escolha onde entrar</p></div>
<script>if(location.pathname!=='/')document.currentScript.previousElementSibling.remove()</script>
<style>
.gw{--gw-l1:80px;--gw-l2:176px;position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;background:#0B0B0C;font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.gw-l{position:relative;isolation:isolate;flex:1 1 0;min-height:0;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden;color:#ECECEE;text-decoration:none}
.gw-b{border-bottom:1px solid rgba(255,255,255,.1)}
.gw-bg{position:absolute;inset:0;z-index:-2;width:100%;height:100%;object-fit:cover;transform:scale(1.02)}
.gw-v{position:absolute;inset:0;z-index:-1;opacity:.9;background:linear-gradient(to top,rgba(11,11,12,.98) 0%,rgba(11,11,12,.7) 45%,rgba(11,11,12,.25) 100%)}
.gw-c{display:flex;flex-direction:column;gap:16px;padding:24px 24px 32px}
.gw-c img{height:auto;object-fit:contain;object-position:left}
.gw-e{font-family:'Geist Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#B4B4B9}
.gw-t{max-width:14ch;font-size:1.875rem;font-weight:300;line-height:.95;letter-spacing:-.025em;text-transform:uppercase}
.gw-a{margin-top:8px;width:fit-content;padding:12px 20px;font-size:14px;font-weight:600;border:1px solid rgba(255,255,255,.25)}
.gw-k{display:none}@media (hover:none){.gw-m{display:none}.gw-k{display:inline}}
.gw-p{position:absolute;left:50%;top:20px;margin:0;transform:translateX(-50%);font-family:'Geist Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#8E8E93;white-space:nowrap;pointer-events:none}
@media (min-width:768px){.gw{--gw-l1:112px;--gw-l2:256px;flex-direction:row}.gw-b{border-bottom:0;border-right:1px solid rgba(255,255,255,.1)}.gw-c{padding:48px 48px 56px}.gw-t{font-size:3rem}.gw-p{top:32px}}
@media (min-width:1280px){.gw-t{font-size:3.75rem}}
</style>`;
}

/**
 * /mapa no celular: os tiles do OpenStreetMap já no HTML, na mesma posição em que o Leaflet vai
 * desenhá-los (mesmo fitBounds dos painéis: padding 60, maxZoom 14, minZoom 4, mesma projeção e mesmos
 * subdomínios, então o Leaflet reaproveita o cache). Aparecem antes do JavaScript; o mapa de verdade
 * fica por baixo e src/features/map/basemap.tsx remove este quando os tiles dele terminam de carregar.
 * Mudou o enquadramento em src/features/map/InteractiveMap.tsx? Mude aqui também.
 */
function staticMap(panels) {
    const num = (v) => { const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) && n !== 0 ? n : null; };
    const pts = panels.map((p) => [num(p.lat), num(p.lng)]).filter(([a, b]) => a !== null && b !== null);
    if (!pts.length) return '';
    return `<div id="mapa-estatico" aria-hidden="true" style="position:fixed;left:0;top:80px;width:100%;overflow:hidden;z-index:450;background:#0B0B0C;pointer-events:none"></div>
<script>(function(){var el=document.getElementById('mapa-estatico');
if(location.pathname.replace(/\\/$/,'')!=='/mapa'||!matchMedia('(max-width: 767px)').matches){el.remove();return}
var P=${JSON.stringify(pts)},W=innerWidth,H=Math.max(innerHeight-80,560),PAD=60;
function px(la,ln,z){var s=256*Math.pow(2,z),r=Math.sin(la*Math.PI/180);return[(ln+180)/360*s,(.5-Math.log((1+r)/(1-r))/(4*Math.PI))*s]}
var a=90,b=-90,c=180,d=-180;P.forEach(function(p){a=Math.min(a,p[0]);b=Math.max(b,p[0]);c=Math.min(c,p[1]);d=Math.max(d,p[1])});
var z=14;for(;z>4;z--){var q=px(b,c,z),w=px(a,d,z);if(w[0]-q[0]<=W-2*PAD&&w[1]-q[1]<=H-2*PAD)break}
var q=px(b,c,z),w=px(a,d,z),cx=(q[0]+w[0])/2,cy=(q[1]+w[1])/2,ox=cx-W/2,oy=cy-H/2,n=Math.pow(2,z);
var light=false;try{light=(JSON.parse(localStorage.getItem('@t3:preferences')||'{}').mapStyle==='light')}catch(e){}
var f=light?'saturate(0.55) contrast(0.95)':'invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.88) saturate(0.35)',h='';
for(var x=Math.floor(ox/256);x<=Math.floor((ox+W)/256);x++)for(var y=Math.floor(oy/256);y<=Math.floor((oy+H)/256);y++){if(y<0||y>=n)continue;
h+='<img alt="" width="256" height="256" src="https://'+'abc'[Math.abs(x+y)%3]+'.tile.openstreetmap.org/'+z+'/'+((x%n+n)%n)+'/'+y+'.png" style="position:absolute;left:'+Math.round(x*256-ox)+'px;top:'+Math.round(y*256-oy)+'px;width:256px;height:256px;filter:'+f+'" fetchpriority="high">'}
el.style.height=H+'px';el.innerHTML=h+'<span style="position:absolute;right:4px;bottom:2px;font:10px sans-serif;color:#8E8E93">&copy; OpenStreetMap</span>';
setTimeout(function(){el.remove()},8000)})()</script>`;
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
    const md = page.file.replace(/\.html$/, '.md');
    const preconnects = (page.preconnect ?? []).map((origin) => `  <link rel="preconnect" href="${origin}" />
`).join('');
    const preloads = (page.preloadImages ?? []).map((img) => `  <link rel="preload" as="image" href="${img.src}" imagesrcset="${img.srcset}" imagesizes="${img.sizes}" fetchpriority="high" />\n`).join('');
    html = html.replace('</head>', `${preconnects}${preloads}  <link rel="alternate" type="text/markdown" href="/${md}" />\n  <script type="application/ld+json">${jsonLd(page)}</script>\n</head>`);
    // Home: a tela de escolha fica antes do #root (o React monta a dele por cima e a estática sai na escolha)
    set(/<div id="root"><\/div>/, `${page.path === '/' ? staticGateway() : ''}${page.path === '/mapa' ? staticMap(panels) : ''}<div id="root">${staticBody(page, panels)}</div>`);
    return html;
}

/** Converte o HTML simples do `body` das páginas (p, h2, ol/ul, li, a) em Markdown. */
function htmlToMarkdown(html) {
    return html
        .replace(/<h2>(.*?)<\/h2>/g, '\n## $1\n\n')
        .replace(/<h3>(.*?)<\/h3>/g, '\n### $1\n\n')
        .replace(/<a href="([^"]+)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
        .replace(/<ol>(.*?)<\/ol>/gs, (_, items) => { let n = 0; return `\n${items.replace(/<li>(.*?)<\/li>/g, (__, t) => `${++n}. ${t}\n`)}\n`; })
        .replace(/<ul>(.*?)<\/ul>/gs, (_, items) => `\n${items.replace(/<li>(.*?)<\/li>/g, '- $1\n')}\n`)
        .replace(/<p>(.*?)<\/p>/gs, '$1\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function toMarkdown(page, panels) {
    const url = `${SITE}${page.path === '/' ? '/' : page.path}`;
    const parts = [`# ${page.h1}`, `> ${page.description}`, `Fonte: ${url}`, htmlToMarkdown(page.body)];
    if (page.panels && panels.length) {
        parts.push('## Painéis disponíveis', panels.map((p) => `- ${p.name}${p.city ? ` – ${p.city}${p.state ? `/${p.state}` : ''}` : ''}${p.size ? ` · ${p.size}` : ''}`).join('\n'));
    }
    if (page.faq) parts.push('## Perguntas frequentes', FAQ.map(([q, a]) => `### ${q}\n\n${a}`).join('\n\n'));
    parts.push('---', `${COMPANY.legalName} (${COMPANY.name}) · CNPJ ${COMPANY.taxID} · ${COMPANY.city} - ${COMPANY.region} · ${COMPANY.email}`,
        [...nav, ...legalNav].map(([href, label]) => `[${label}](${SITE}${href})`).join(' · '));
    return `${parts.join('\n\n')}\n`;
}

function render404(template) {
    let html = template;
    html = html.replace(/<title>[^<]*<\/title>/, `<title>Página não encontrada | ${COMPANY.name}</title>`);
    html = html.replace(/<link rel="canonical"[^>]*>\s*/, '');
    html = html.replace('</head>', '  <meta name="robots" content="noindex" />\n</head>');
    const links = nav.map(([href, label]) => `<li><a href="${SITE}${href}">${esc(label)}</a></li>`).join('');
    return html.replace(/<div id="root"><\/div>/, `<div id="root"><div data-prerender style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap"><main><h1>Página não encontrada</h1><p>O endereço acessado não existe. Veja as páginas do site:</p><ul>${links}</ul></main></div></div>`);
}

/**
 * Embute o CSS principal no HTML (<style> no lugar do <link>): no celular, a primeira pintura
 * não espera mais um arquivo que divide a rede com o JavaScript e as imagens.
 */
async function inlineMainCss(html) {
    const match = html.match(/<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/);
    if (!match) return html;
    const css = (await readFile(path.join(DIST, match[1]), 'utf8')).replace(/<\/style/gi, '<\\/style');
    return html.replace(match[0], `<style>${css}</style>`);
}

/**
 * O app (script principal e os modulepreload) começa a baixar logo depois da primeira pintura.
 * No celular, a tela pré-renderizada (e a de escolha na home) aparece sem disputar a rede com
 * ~180 KB de JavaScript; o React começa a carregar um quadro depois.
 */
function deferAppScripts(html) {
    const entry = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>\s*/);
    if (!entry) return html;
    const preloads = [...html.matchAll(/<link rel="modulepreload" crossorigin href="([^"]+)">\s*/g)];
    let out = html.replace(entry[0], '');
    for (const p of preloads) out = out.replace(p[0], '');
    const list = JSON.stringify(preloads.map((p) => p[1]));
    const loader = `<script>(function(){function go(){var h=document.head;${list}.forEach(function(u){var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=u;h.appendChild(l)});`
        + `var s=document.createElement('script');s.type='module';s.crossOrigin='';s.src=${JSON.stringify(entry[1])};h.appendChild(s)}`
        // Home e /mapa no celular: a tela estática (escolha ou tiles do mapa) aparece primeiro; o app espera as imagens dela.
        // Demais páginas: um quadro depois da primeira pintura.
        // (aba em segundo plano não roda requestAnimationFrame: o setTimeout garante o carregamento)
        + `var started=false;function run(){if(!started){started=true;go()}}`
        + `function soon(){requestAnimationFrame(function(){setTimeout(run,0)});setTimeout(run,200)}`
        + `if((document.getElementById('gw-estatico')||document.getElementById('mapa-estatico'))&&document.readyState!=='complete'){addEventListener('load',soon,{once:true})}else{soon()}})()</script>\n`;
    return out.replace('</body>', `${loader}</body>`);
}

const template = deferAppScripts(await inlineMainCss(await readFile(path.join(DIST, 'index.html'), 'utf8')));
const allPanels = await fetchPanels();
const panels = allPanels.filter((p) => p?.name).slice(0, 200);
// Cópia da lista servida pela CDN: o site mostra os painéis na hora enquanto a API responde
if (allPanels.length) await writeFile(path.join(DIST, 'panels.json'), JSON.stringify(allPanels));
for (const page of PAGES) {
    await writeFile(path.join(DIST, page.file), render(template, page, panels));
}
// Versão em Markdown de cada página (servida a agentes que pedem Accept: text/markdown, ver .htaccess)
for (const page of PAGES) {
    await writeFile(path.join(DIST, page.file.replace(/\.html$/, '.md')), toMarkdown(page, panels));
}
// 404 de verdade: o .htaccess responde com esta página e status 404; o React mostra "Página não encontrada"
await writeFile(path.join(DIST, '404.html'), render404(template));
// Sitemap com a data do build (as páginas privadas ficam de fora)
const PRIORITY = { '/': '1.0', '/mapa': '0.9', '/servicos': '0.9', '/solution': '0.8', '/sobre': '0.6', '/contato': '0.7', '/privacidade': '0.2', '/termos': '0.2' };
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((p) => `  <url><loc>${SITE}${p.path}</loc><lastmod>${TODAY}</lastmod><priority>${PRIORITY[p.path] ?? '0.5'}</priority></url>`).join('\n')}
</urlset>
`;
await writeFile(path.join(DIST, 'sitemap.xml'), sitemap);
console.log(`prerender: ${PAGES.length} páginas, ${panels.length} painéis listados`);
