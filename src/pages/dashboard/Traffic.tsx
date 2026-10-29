import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, RefreshCw } from 'lucide-react';
import { api } from '@/lib/axios';
import { mediumName, sourceName } from '@/lib/leadSources';
import { BarList, downloadCsv, niceMax, useMarkColor } from '@/components/app/charts';
import { CrmPage, Panel, Stat, Badge, EmptyState, Skeleton, Field } from '@/components/app/ui';
import { crmBtn, crmInput, formatBRL } from '@/components/app/tokens';
import { CustomSelect } from '@/components/CustomSelect';

type LeadKind = 'CONTACT' | 'QUOTE' | 'SOLUTION' | 'ORDER' | 'SIGNUP';

interface Summary {
    days: number;
    totals: { sessions: number; pageviews: number; whatsappClicks: number; leads: number; conversion: number; leadsByKind: Record<LeadKind, number> };
    series: { day: string; sessions: number; pageviews: number; leads: number }[];
    sources: { source: string; medium: string | null; sessions: number; whatsapp: number; leads: number; conversion: number | null }[];
    pages: { path: string; views: number; sessions: number }[];
    landings: { path: string; sessions: number }[];
    devices: { device: string; sessions: number }[];
    campaigns: { campaign: string; source: string; sessions: number }[];
    leads: {
        id: string; kind: LeadKind; kindLabel: string; name: string; email: string | null; company: string | null; value: number | null;
        createdAt: string; source: string; medium: string | null; campaign: string | null; landingPage: string | null; referrer: string | null;
    }[];
}

const PERIODS = [7, 30, 90] as const;

const DEVICE_LABEL: Record<string, string> = { mobile: 'Celular', desktop: 'Computador', tablet: 'Tablet', desconhecido: 'Não identificado' };

const pct = (v: number | null) => (v == null ? '—' : `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`);
const int = (v: number) => v.toLocaleString('pt-BR');
const shortDay = (iso: string) => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };
const dateTime = (iso: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

// ============================ GRÁFICOS ============================

const W = 640, H = 200, PAD = { l: 36, r: 8, t: 10, b: 24 };

function Axis({ max, labels }: { max: number; labels: { x: number; text: string }[] }) {
    const ticks = [0, max / 2, max];
    return (
        <g>
            {ticks.map((t) => {
                const y = PAD.t + (H - PAD.t - PAD.b) * (1 - t / max);
                return (
                    <g key={t}>
                        <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} className="stroke-brand-border" strokeWidth={1} />
                        <text x={PAD.l - 6} y={y + 3} textAnchor="end" className="fill-brand-muted font-mono text-[10px]">{int(Math.round(t))}</text>
                    </g>
                );
            })}
            {labels.map((l) => <text key={l.text + l.x} x={l.x} y={H - 6} textAnchor={l.x > W - 30 ? 'end' : l.x < PAD.l + 20 ? 'start' : 'middle'} className="fill-brand-muted font-mono text-[10px]">{l.text}</text>)}
        </g>
    );
}

/** Rótulos do eixo X: no máximo ~6 datas, sempre incluindo a última. */
function xLabels(series: { day: string }[], xOf: (i: number) => number) {
    const step = Math.max(1, Math.ceil(series.length / 6));
    return series.map((s, i) => ({ i, s })).filter(({ i }) => i % step === 0 || i === series.length - 1)
        .filter(({ i }, k, arr) => !(k === arr.length - 2 && arr[arr.length - 1].i - i < step / 2))
        .map(({ i, s }) => ({ x: xOf(i), text: shortDay(s.day) }));
}

/** Visitas por dia: área com linha de 2px, mira e dica ao passar o mouse. */
function SessionsChart({ series }: { series: Summary['series'] }) {
    const color = useMarkColor();
    const [hover, setHover] = useState<number | null>(null);
    const max = niceMax(Math.max(...series.map((s) => s.sessions), 1));
    const inner = W - PAD.l - PAD.r;
    const xOf = (i: number) => PAD.l + (series.length === 1 ? inner / 2 : (inner * i) / (series.length - 1));
    const yOf = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - v / max);
    const line = series.map((s, i) => `${i ? 'L' : 'M'}${xOf(i).toFixed(1)},${yOf(s.sessions).toFixed(1)}`).join('');
    const area = `${line}L${xOf(series.length - 1)},${yOf(0)}L${xOf(0)},${yOf(0)}Z`;

    const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - box.left) / box.width) * W;
        const i = Math.round(((x - PAD.l) / inner) * (series.length - 1));
        setHover(Math.min(series.length - 1, Math.max(0, i)));
    };
    const h = hover != null ? series[hover] : null;

    return (
        <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full touch-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Visitas por dia no período">
                <Axis max={max} labels={xLabels(series, xOf)} />
                <path d={area} fill={color} fillOpacity={0.12} />
                <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
                {h && hover != null && (
                    <g>
                        <line x1={xOf(hover)} x2={xOf(hover)} y1={PAD.t} y2={H - PAD.b} className="stroke-brand-muted" strokeWidth={1} strokeDasharray="3 3" />
                        <circle cx={xOf(hover)} cy={yOf(h.sessions)} r={4.5} fill={color} className="stroke-brand-surface" strokeWidth={2} />
                    </g>
                )}
            </svg>
            {h && hover != null && (
                <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 border border-brand-border bg-brand-surface px-3 py-2 text-xs shadow-lg"
                    style={{ left: `${Math.min(85, Math.max(15, (xOf(hover) / W) * 100))}%` }}>
                    <p className="font-mono text-brand-muted">{shortDay(h.day)}</p>
                    <p className="mt-1 text-brand-text"><span className="font-mono">{int(h.sessions)}</span> visitas</p>
                    <p className="text-brand-muted"><span className="font-mono">{int(h.pageviews)}</span> páginas vistas</p>
                </div>
            )}
        </div>
    );
}

/** Leads por dia: barras finas com 2px de respiro e dica por barra. */
function LeadsChart({ series }: { series: Summary['series'] }) {
    const color = useMarkColor();
    const [hover, setHover] = useState<number | null>(null);
    const max = niceMax(Math.max(...series.map((s) => s.leads), 1));
    const inner = W - PAD.l - PAD.r;
    const slot = inner / series.length;
    const bar = Math.max(2, Math.min(18, slot - 2));
    const xOf = (i: number) => PAD.l + slot * i + slot / 2;
    const yOf = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - v / max);
    const h = hover != null ? series[hover] : null;

    return (
        <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" onPointerLeave={() => setHover(null)} role="img" aria-label="Leads por dia no período">
                <Axis max={max} labels={xLabels(series, xOf)} />
                {series.map((s, i) => (
                    <g key={s.day} onPointerEnter={() => setHover(i)}>
                        {/* Alvo de toque maior que a barra */}
                        <rect x={PAD.l + slot * i} y={PAD.t} width={slot} height={H - PAD.t - PAD.b} fill="transparent" />
                        {s.leads > 0 && <rect x={xOf(i) - bar / 2} y={yOf(s.leads)} width={bar} height={yOf(0) - yOf(s.leads)} fill={color} opacity={hover == null || hover === i ? 1 : 0.45} />}
                    </g>
                ))}
            </svg>
            {h && hover != null && (
                <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 border border-brand-border bg-brand-surface px-3 py-2 text-xs shadow-lg"
                    style={{ left: `${Math.min(85, Math.max(15, (xOf(hover) / W) * 100))}%` }}>
                    <p className="font-mono text-brand-muted">{shortDay(h.day)}</p>
                    <p className="mt-1 text-brand-text"><span className="font-mono">{int(h.leads)}</span> {h.leads === 1 ? 'lead' : 'leads'}</p>
                </div>
            )}
        </div>
    );
}

// ============================ LINK DE CAMPANHA ============================

const CAMPAIGN_PAGES = [['/', 'Início'], ['/mapa', 'Mapa de painéis'], ['/servicos', 'Catálogo'], ['/solution', 'T3 Solution'], ['/contato', 'Contato']] as const;
const CAMPAIGN_SOURCES = [['instagram', 'social'], ['facebook', 'social'], ['google', 'anuncio'], ['whatsapp', 'social'], ['linkedin', 'social'], ['email', 'email']] as const;
const slug = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function CampaignLink() {
    const [page, setPage] = useState('/mapa');
    const [source, setSource] = useState('instagram');
    const [campaign, setCampaign] = useState('');
    const [copied, setCopied] = useState(false);
    const medium = CAMPAIGN_SOURCES.find(([s]) => s === source)?.[1] ?? 'campanha';
    const name = slug(campaign);
    const url = `https://t3ooh.com${page}?utm_source=${source}&utm_medium=${medium}${name ? `&utm_campaign=${name}` : ''}`;

    const copy = async () => {
        try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* sem permissão de área de transferência */ }
    };

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-brand-muted">Use este link em posts, anúncios, bio do Instagram e listas de WhatsApp. As visitas e os leads aparecem aqui com o nome da campanha.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Página" htmlFor="utm-page">
                    <CustomSelect id="utm-page" value={page} onChange={setPage} options={CAMPAIGN_PAGES.map(([p, l]) => ({ value: p, label: l }))} />
                </Field>
                <Field label="Onde o link vai ser postado" htmlFor="utm-source">
                    <CustomSelect id="utm-source" value={source} onChange={setSource} options={CAMPAIGN_SOURCES.map(([s]) => ({ value: s, label: sourceName(s) }))} />
                </Field>
                <Field label="Nome da campanha" htmlFor="utm-campaign" hint="Ex.: black friday 2026">
                    <input id="utm-campaign" value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="lancamento-painel-t63" className={crmInput} maxLength={60} />
                </Field>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
                <code className="min-w-0 flex-1 truncate border border-brand-border bg-brand-background px-3.5 py-2.5 font-mono text-xs text-brand-text" title={url}>{url}</code>
                <button type="button" onClick={copy} className={crmBtn.secondary}>
                    {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />} {copied ? 'Copiado' : 'Copiar link'}
                </button>
            </div>
        </div>
    );
}

// ============================ PÁGINA ============================

function exportCsv(s: Summary) {
    const head = ['Data', 'Tipo', 'Nome', 'E-mail', 'Empresa', 'Valor', 'Origem', 'Meio', 'Campanha', 'Página de entrada', 'Site de origem'];
    const rows = s.leads.map((l) => [
        new Date(l.createdAt).toLocaleString('pt-BR'), l.kindLabel, l.name, l.email ?? '', l.company ?? '', l.value != null ? String(l.value).replace('.', ',') : '',
        sourceName(l.source), mediumName(l.medium), l.campaign ?? '', l.landingPage ?? '', l.referrer ?? '',
    ]);
    downloadCsv(`leads-origem-${s.days}dias-${new Date().toISOString().slice(0, 10)}.csv`, head, rows);
}

export function Traffic() {
    const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
    const [data, setData] = useState<Summary | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

    const load = useCallback(async () => {
        setStatus('loading');
        try {
            const { data } = await api.get<Summary>('/analytics/summary', { params: { days } });
            setData(data);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    }, [days]);

    useEffect(() => { load(); }, [load]);

    const kinds = useMemo(() => data ? ([
        ['QUOTE', 'Orçamentos pelo mapa'], ['SOLUTION', 'Orçamentos T3 Solution'], ['ORDER', 'Pedidos pelo catálogo'], ['CONTACT', 'Contatos'], ['SIGNUP', 'Cadastros'],
    ] as const).map(([k, l]) => ({ label: l, value: data.totals.leadsByKind[k] ?? 0 })) : [], [data]);

    const noVisits = data && data.totals.sessions === 0;

    return (
        <CrmPage
            eyebrow="Gestão"
            title="Tráfego e origem dos leads"
            description="De onde vêm as visitas do site, o que as pessoas olham e quais canais trazem orçamentos."
            wide
            actions={
                <div className="flex flex-wrap items-center gap-2">
                    <div role="radiogroup" aria-label="Período" className="grid grid-cols-3 border border-brand-border">
                        {PERIODS.map((p) => (
                            <button key={p} type="button" role="radio" aria-checked={days === p} onClick={() => setDays(p)}
                                className={`min-h-11 px-3 text-sm md:min-h-9 ${days === p ? 'bg-brand-surface font-medium text-brand-text shadow-[inset_0_-2px_0_rgb(255,94,0)]' : 'text-brand-muted hover:text-brand-text'}`}>
                                {p} dias
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={load} className={crmBtn.icon} aria-label="Atualizar"><RefreshCw className="h-4 w-4" /></button>
                    <button type="button" onClick={() => data && exportCsv(data)} disabled={!data?.leads.length} className={crmBtn.secondary}>
                        <Download className="h-4 w-4" aria-hidden="true" /> Exportar leads (CSV)
                    </button>
                </div>
            }
        >
            {status === 'error' && (
                <EmptyState title="Não foi possível carregar o tráfego" text="Confira a conexão e tente de novo." action={<button type="button" onClick={load} className={crmBtn.secondary}>Tentar de novo</button>} />
            )}

            {status === 'loading' && !data && (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-px lg:grid-cols-5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}</div>
                    <Skeleton className="h-64" />
                </div>
            )}

            {data && status !== 'error' && (
                <div className={`flex flex-col gap-6 transition-opacity ${status === 'loading' ? 'opacity-60' : ''}`}>
                    <div className="grid grid-cols-2 gap-px border border-brand-border bg-brand-border lg:grid-cols-5">
                        <Stat label="Visitas" value={int(data.totals.sessions)} hint={`${int(data.totals.pageviews)} páginas vistas`} />
                        <Stat label="Leads" value={int(data.totals.leads)} hint="orçamentos, pedidos, contatos e cadastros" accent />
                        <Stat label="Conversão" value={pct(data.totals.sessions ? data.totals.conversion : null)} hint="leads por visita" />
                        <Stat label="Cliques no WhatsApp" value={int(data.totals.whatsappClicks)} hint="botões e links do site" />
                        {/* No celular (2 colunas) o quinto indicador ocupa a linha toda */}
                        <div className="col-span-2 grid lg:col-span-1"><Stat label="Páginas por visita" value={data.totals.sessions ? (data.totals.pageviews / data.totals.sessions).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—'} /></div>
                    </div>

                    {noVisits && (
                        <EmptyState title="Ainda sem visitas registradas neste período" text="A contagem começa a partir desta versão do site. Os leads abaixo já aparecem; os anteriores ficam como “Sem registro” de origem." />
                    )}

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <Panel title="Visitas por dia" bodyClassName="p-5"><SessionsChart series={data.series} /></Panel>
                        <Panel title="Leads por dia" bodyClassName="p-5"><LeadsChart series={data.series} /></Panel>
                    </div>

                    <Panel title="De onde vêm as visitas e os leads" bodyClassName="p-0">
                        {data.sources.length === 0 ? (
                            <div className="p-5"><p className="text-sm text-brand-muted">Sem dados no período.</p></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px] text-sm">
                                    <thead>
                                        <tr className="border-b border-brand-border text-left text-xs text-brand-muted">
                                            <th className="px-5 py-3 font-normal">Origem</th>
                                            <th className="px-3 py-3 text-right font-normal">Visitas</th>
                                            <th className="px-3 py-3 text-right font-normal">WhatsApp</th>
                                            <th className="px-3 py-3 text-right font-normal">Leads</th>
                                            <th className="px-5 py-3 text-right font-normal">Conversão</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-border">
                                        {data.sources.map((s) => (
                                            <tr key={s.source} className="hover:bg-brand-background">
                                                <td className="px-5 py-3">
                                                    <span className="text-brand-text">{sourceName(s.source)}</span>
                                                    {s.medium && <span className="ml-2 text-xs text-brand-muted">{mediumName(s.medium)}</span>}
                                                </td>
                                                <td className="px-3 py-3 text-right font-mono text-brand-text">{int(s.sessions)}</td>
                                                <td className="px-3 py-3 text-right font-mono text-brand-text">{int(s.whatsapp)}</td>
                                                <td className="px-3 py-3 text-right font-mono text-brand-text">{int(s.leads)}</td>
                                                <td className="px-5 py-3 text-right font-mono text-brand-muted">{pct(s.conversion)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Panel>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <Panel title="Páginas mais vistas" bodyClassName="p-5">
                            <BarList rows={data.pages.map((p) => ({ label: p.path, hint: `${int(p.sessions)} visitas`, value: p.views }))} empty="Sem visitas no período." />
                        </Panel>
                        <Panel title="Páginas de entrada" bodyClassName="p-5">
                            <BarList rows={data.landings.map((p) => ({ label: p.path, value: p.sessions }))} empty="Sem visitas no período." />
                        </Panel>
                        <div className="flex flex-col gap-6">
                            <Panel title="Aparelhos" bodyClassName="p-5">
                                <BarList rows={data.devices.map((d) => ({ label: DEVICE_LABEL[d.device] ?? d.device, value: d.sessions }))} empty="Sem visitas no período." />
                            </Panel>
                            <Panel title="Leads por tipo" bodyClassName="p-5">
                                <BarList rows={kinds} empty="Sem leads no período." />
                            </Panel>
                        </div>
                    </div>

                    {data.campaigns.length > 0 && (
                        <Panel title="Campanhas" bodyClassName="p-5">
                            <BarList rows={data.campaigns.map((c) => ({ label: c.campaign, hint: sourceName(c.source), value: c.sessions }))} empty="" />
                        </Panel>
                    )}

                    <Panel title={`Últimos leads (${int(data.leads.length)})`} bodyClassName="p-0">
                        {data.leads.length === 0 ? (
                            <div className="p-5"><p className="text-sm text-brand-muted">Nenhum lead no período.</p></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-sm">
                                    <thead>
                                        <tr className="border-b border-brand-border text-left text-xs text-brand-muted">
                                            <th className="px-5 py-3 font-normal">Quando</th>
                                            <th className="px-3 py-3 font-normal">Tipo</th>
                                            <th className="px-3 py-3 font-normal">Quem</th>
                                            <th className="px-3 py-3 font-normal">Origem</th>
                                            <th className="px-3 py-3 font-normal">Campanha</th>
                                            <th className="px-5 py-3 font-normal">Entrou por</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-border">
                                        {data.leads.map((l) => (
                                            <tr key={`${l.kind}-${l.id}`} className="hover:bg-brand-background">
                                                <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-brand-muted">{dateTime(l.createdAt)}</td>
                                                <td className="px-3 py-3"><Badge tone={l.kind === 'QUOTE' || l.kind === 'ORDER' || l.kind === 'SOLUTION' ? 'accent' : 'neutral'}>{l.kindLabel}</Badge></td>
                                                <td className="max-w-[220px] px-3 py-3">
                                                    <p className="truncate text-brand-text">{l.name}</p>
                                                    <p className="truncate text-xs text-brand-muted">{[l.company, l.value != null ? formatBRL(l.value) : null].filter(Boolean).join(' · ') || l.email}</p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className={l.source === 'sem registro' ? 'text-brand-muted' : 'text-brand-text'}>{sourceName(l.source)}</span>
                                                    {l.medium && <span className="block text-xs text-brand-muted">{mediumName(l.medium)}</span>}
                                                </td>
                                                <td className="px-3 py-3 text-brand-muted">{l.campaign || '—'}</td>
                                                <td className="max-w-[200px] truncate px-5 py-3 font-mono text-xs text-brand-muted" title={l.landingPage ?? ''}>{l.landingPage || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Panel>

                    <Panel title="Criar link de campanha" bodyClassName="p-5"><CampaignLink /></Panel>
                </div>
            )}
        </CrmPage>
    );
}
