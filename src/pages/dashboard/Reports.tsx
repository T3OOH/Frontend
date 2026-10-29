import { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { CrmPage, Panel, Stat, EmptyState, Skeleton } from '@/components/app/ui';
import { crmBtn, formatBRL } from '@/components/app/tokens';
import { BarList, downloadCsv, niceMax, useMarkColor } from '@/components/app/charts';
import { sourceName } from '@/lib/leadSources';
import { DEAL_STAGE_LABEL, DealStage } from '@/services/crm.service';
import { OccupancyReport, ReportPeriod, ReportSummary, reportsService } from '@/services/reports.service';

const PERIODS: ReportPeriod[] = [30, 90, 180, 365];
const PERIOD_LABEL: Record<ReportPeriod, string> = { 30: '30 dias', 90: '90 dias', 180: '6 meses', 365: '12 meses' };
const LINE_LABEL = { OOH: 'T3 OOH (telões)', SOLUTION: 'T3 Solution' } as const;

const pct = (v: number | null) => (v == null ? '—' : `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`);
const int = (v: number) => v.toLocaleString('pt-BR');
const compactBRL = (v: number) => new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
const MONTH_NAMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const monthName = (key: string, withYear = false) => {
    const [y, m] = key.split('-');
    return `${MONTH_NAMES[Number(m) - 1]}${withYear ? `/${y.slice(2)}` : ''}`;
};

// ============================ RECEITA POR MÊS ============================

const W = 640, H = 200, PAD = { l: 44, r: 8, t: 10, b: 24 };

/** Receita fechada por mês: barras finas em um tom, dica com a divisão entre negócios do CRM e pedidos. */
function MonthlyChart({ rows }: { rows: ReportSummary['monthly'] }) {
    const color = useMarkColor();
    const [hover, setHover] = useState<number | null>(null);
    const max = niceMax(Math.max(...rows.map((r) => r.total), 1));
    const inner = W - PAD.l - PAD.r;
    const slot = inner / rows.length;
    const bar = Math.max(4, Math.min(28, slot - 8));
    const xOf = (i: number) => PAD.l + slot * i + slot / 2;
    const yOf = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - v / max);
    const h = hover != null ? rows[hover] : null;

    return (
        <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" onPointerLeave={() => setHover(null)} role="img" aria-label="Receita fechada por mês nos últimos 12 meses">
                {[0, max / 2, max].map((t) => (
                    <g key={t}>
                        <line x1={PAD.l} x2={W - PAD.r} y1={yOf(t)} y2={yOf(t)} className="stroke-brand-border" strokeWidth={1} />
                        <text x={PAD.l - 6} y={yOf(t) + 3} textAnchor="end" className="fill-brand-muted font-mono text-[10px]">{compactBRL(t)}</text>
                    </g>
                ))}
                {rows.map((r, i) => (
                    <g key={r.month} onPointerEnter={() => setHover(i)}>
                        {/* Alvo de toque maior que a barra */}
                        <rect x={PAD.l + slot * i} y={PAD.t} width={slot} height={H - PAD.t - PAD.b} fill="transparent" />
                        {r.total > 0 && (
                            <path
                                // Barra com cantos de 4px só no topo
                                d={`M${xOf(i) - bar / 2},${yOf(0)}V${yOf(r.total) + 4}q0,-4 4,-4h${bar - 8}q4,0 4,4V${yOf(0)}Z`}
                                fill={color} opacity={hover == null || hover === i ? 1 : 0.45}
                            />
                        )}
                        <text x={xOf(i)} y={H - 6} textAnchor="middle" className="fill-brand-muted font-mono text-[10px]">{monthName(r.month)}</text>
                    </g>
                ))}
            </svg>
            {h && hover != null && (
                <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 border border-brand-border bg-brand-surface px-3 py-2 text-xs shadow-lg"
                    style={{ left: `${Math.min(85, Math.max(15, (xOf(hover) / W) * 100))}%` }}>
                    <p className="font-mono text-brand-muted">{monthName(h.month, true)}</p>
                    <p className="mt-1 font-mono text-brand-text">{formatBRL(h.total)}</p>
                    <p className="text-brand-muted">CRM <span className="font-mono">{formatBRL(h.deals)}</span></p>
                    <p className="text-brand-muted">Pedidos <span className="font-mono">{formatBRL(h.orders)}</span></p>
                </div>
            )}
        </div>
    );
}

// ============================ OCUPAÇÃO ============================

/** Painéis x próximos meses. Célula preenchida = contratado (com o nome do cliente); vazia = livre para vender. */
function OccupancyGrid({ data }: { data: OccupancyReport }) {
    const color = useMarkColor();
    if (!data.panels.length) return <p className="p-5 text-sm text-brand-muted">Nenhum painel cadastrado.</p>;
    return (
        <>
            <div className="flex flex-wrap items-center gap-4 border-b border-brand-border px-5 py-3 text-xs text-brand-muted">
                <span className="flex items-center gap-2"><span className="h-3 w-5" style={{ background: color }} aria-hidden="true" /> Contratado</span>
                <span className="flex items-center gap-2"><span className="h-3 w-5 border border-brand-border bg-brand-background" aria-hidden="true" /> Livre para vender</span>
                <span className="ml-auto">Ocupação no período: <span className="font-mono text-brand-text">{pct(data.rate)}</span></span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                    <thead>
                        <tr className="border-b border-brand-border text-left text-xs text-brand-muted">
                            <th className="px-5 py-3 font-normal">Painel</th>
                            {data.months.map((m) => <th key={m} className="px-1 py-3 text-center font-mono font-normal">{monthName(m, true)}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {data.panels.map((p) => (
                            <tr key={p.id} className="hover:bg-brand-background">
                                <td className="max-w-[260px] px-5 py-2.5">
                                    <span className="block truncate text-brand-text" title={p.name}>{p.name}</span>
                                    <span className="block truncate text-xs text-brand-muted">{[p.city, p.state].filter(Boolean).join(' - ')}</span>
                                </td>
                                {p.months.map((who, i) => (
                                    <td key={data.months[i]} className="px-1 py-2.5">
                                        <div
                                            title={who ? `${monthName(data.months[i], true)}: ${who}` : `${monthName(data.months[i], true)}: livre`}
                                            className={`relative h-7 ${who ? '' : 'border border-brand-border bg-brand-background'}`}
                                            style={who ? { background: color } : undefined}
                                        >
                                            <span className="sr-only">{who ? `Contratado por ${who}` : 'Livre'}</span>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

// ============================ PÁGINA ============================

function exportSummary(s: ReportSummary) {
    const rows: (string | number)[][] = [
        ['Indicador', `Últimos ${s.days} dias`, ''],
        ['Receita fechada', s.totals.revenue.toFixed(2).replace('.', ','), ''],
        ['Vendas', s.totals.sales, ''],
        ['Ticket médio', s.totals.averageTicket.toFixed(2).replace('.', ','), ''],
        ['Conversão (ganhos / fechados)', pct(s.totals.conversion), `${s.totals.won} ganhos, ${s.totals.lost} perdidos`],
        ['Ciclo médio de venda (dias)', s.totals.averageCycleDays == null ? '' : Math.round(s.totals.averageCycleDays), ''],
        ['Em negociação', s.totals.openValue.toFixed(2).replace('.', ','), ''],
        ['Previsão ponderada', s.totals.forecast.toFixed(2).replace('.', ','), 'valor x probabilidade'],
        [],
        ['Mês', 'Receita CRM', 'Receita pedidos'],
        ...s.monthly.map((m) => [monthName(m.month, true), m.deals.toFixed(2).replace('.', ','), m.orders.toFixed(2).replace('.', ',')]),
        [],
        ['Etapa do funil', 'Negócios', 'Valor'],
        ...s.funnel.map((f) => [DEAL_STAGE_LABEL[f.stage as DealStage] ?? f.stage, f.count, f.value.toFixed(2).replace('.', ',')]),
        [],
        ['Origem', 'Negócios', 'Ganhos'],
        ...s.sources.map((o) => [sourceName(o.source), o.leads, o.won]),
    ];
    downloadCsv(`relatorio-${s.days}dias-${new Date().toISOString().slice(0, 10)}.csv`, ['Relatório T3 OOH', '', ''], rows);
}

function exportOccupancy(o: OccupancyReport) {
    downloadCsv(
        `ocupacao-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Painel', 'Cidade', ...o.months.map((m) => monthName(m, true))],
        o.panels.map((p) => [p.name, [p.city, p.state].filter(Boolean).join(' - '), ...p.months.map((who) => who ?? 'Livre')]),
    );
}

export function Reports() {
    const [days, setDays] = useState<ReportPeriod>(90);
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [occupancy, setOccupancy] = useState<OccupancyReport | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

    const load = useCallback(async () => {
        setStatus('loading');
        const [s, o] = await Promise.allSettled([reportsService.summary(days), reportsService.occupancy(6)]);
        if (s.status === 'fulfilled') setSummary(s.value);
        if (o.status === 'fulfilled') setOccupancy(o.value);
        setStatus(s.status === 'fulfilled' ? 'ready' : 'error');
    }, [days]);

    useEffect(() => { load(); }, [load]);

    const t = summary?.totals;

    return (
        <CrmPage
            eyebrow="Gestão"
            title="Relatórios"
            description="Vendas, funil, previsão e a agenda de ocupação dos painéis. Exporte em planilha para reuniões e prestação de contas."
            wide
            actions={
                <div className="flex flex-wrap items-center gap-2">
                    <div role="radiogroup" aria-label="Período" className="grid grid-cols-4 border border-brand-border">
                        {PERIODS.map((p) => (
                            <button key={p} type="button" role="radio" aria-checked={days === p} onClick={() => setDays(p)}
                                className={`min-h-11 px-3 text-sm md:min-h-9 ${days === p ? 'bg-brand-surface font-medium text-brand-text shadow-[inset_0_-2px_0_rgb(255,94,0)]' : 'text-brand-muted hover:text-brand-text'}`}>
                                {PERIOD_LABEL[p]}
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={load} className={crmBtn.icon} aria-label="Atualizar"><RefreshCw className="h-4 w-4" /></button>
                    <button type="button" onClick={() => summary && exportSummary(summary)} disabled={!summary} className={crmBtn.secondary}>
                        <Download className="h-4 w-4" aria-hidden="true" /> Exportar relatório (CSV)
                    </button>
                </div>
            }
        >
            {status === 'error' && !summary && (
                <EmptyState title="Não foi possível carregar os relatórios" text="Confira a conexão e tente de novo." action={<button type="button" onClick={load} className={crmBtn.secondary}>Tentar de novo</button>} />
            )}

            {status === 'loading' && !summary && (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-px lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24" />)}</div>
                    <Skeleton className="h-64" />
                </div>
            )}

            {summary && t && (
                <div className={`flex flex-col gap-6 transition-opacity ${status === 'loading' ? 'opacity-60' : ''}`}>
                    <div className="grid grid-cols-2 gap-px border border-brand-border bg-brand-border lg:grid-cols-3">
                        <Stat label="Receita fechada" value={formatBRL(t.revenue)} hint="negócios ganhos e pedidos aprovados" accent />
                        <Stat label="Vendas" value={int(t.sales)} hint={`${int(t.newDeals)} negócios novos no período`} />
                        <Stat label="Ticket médio" value={t.sales ? formatBRL(t.averageTicket) : '—'} hint="por venda fechada" />
                        <Stat label="Conversão" value={pct(t.conversion)} hint={`${t.won} ganhos, ${t.lost} perdidos`} />
                        <Stat label="Ciclo de venda" value={t.averageCycleDays == null ? '—' : `${Math.round(t.averageCycleDays)} dias`} hint="da entrada ao fechamento" />
                        <Stat label="Previsão ponderada" value={formatBRL(t.forecast)} hint={`de ${formatBRL(t.openValue)} em aberto`} />
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
                        <Panel title="Receita fechada por mês" bodyClassName="p-5"><MonthlyChart rows={summary.monthly} /></Panel>
                        <Panel title="Funil em aberto" bodyClassName="p-5">
                            <BarList
                                rows={summary.funnel.map((f) => ({ label: DEAL_STAGE_LABEL[f.stage as DealStage] ?? f.stage, hint: `${f.count} ${f.count === 1 ? 'negócio' : 'negócios'}`, value: f.value }))}
                                format={formatBRL}
                                empty="Nenhum negócio em aberto."
                            />
                        </Panel>
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
                        <Panel title="Origem dos negócios do período" bodyClassName="p-0">
                            {summary.sources.length === 0 ? (
                                <div className="p-5"><p className="text-sm text-brand-muted">Nenhum negócio novo no período.</p></div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[520px] text-sm">
                                        <thead>
                                            <tr className="border-b border-brand-border text-left text-xs text-brand-muted">
                                                <th className="px-5 py-3 font-normal">Origem</th>
                                                <th className="px-3 py-3 text-right font-normal">Negócios</th>
                                                <th className="px-3 py-3 text-right font-normal">Ganhos</th>
                                                <th className="px-3 py-3 text-right font-normal">Taxa</th>
                                                <th className="px-5 py-3 text-right font-normal">Valor ganho</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-brand-border">
                                            {summary.sources.map((s) => (
                                                <tr key={s.source} className="hover:bg-brand-background">
                                                    <td className="px-5 py-3 text-brand-text">{sourceName(s.source)}</td>
                                                    <td className="px-3 py-3 text-right font-mono text-brand-text">{int(s.leads)}</td>
                                                    <td className="px-3 py-3 text-right font-mono text-brand-text">{int(s.won)}</td>
                                                    <td className="px-3 py-3 text-right font-mono text-brand-muted">{pct(s.leads ? s.won / s.leads : null)}</td>
                                                    <td className="px-5 py-3 text-right font-mono text-brand-text">{formatBRL(s.wonValue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Panel>
                        <Panel title="Por linha de negócio" bodyClassName="p-0">
                            <dl className="divide-y divide-brand-border">
                                {summary.lines.map((l) => (
                                    <div key={l.line} className="px-5 py-4">
                                        <dt className="text-sm text-brand-text">{LINE_LABEL[l.line]}</dt>
                                        <dd className="mt-2 grid grid-cols-2 gap-3 text-xs text-brand-muted">
                                            <span>Ganho no período<span className="mt-0.5 block font-mono text-sm text-brand-text">{formatBRL(l.won)}</span></span>
                                            <span>Em aberto<span className="mt-0.5 block font-mono text-sm text-brand-text">{formatBRL(l.open)}</span></span>
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </Panel>
                    </div>

                    <Panel
                        title="Ocupação dos painéis · próximos 6 meses"
                        bodyClassName="p-0"
                        action={occupancy && (
                            <button type="button" onClick={() => exportOccupancy(occupancy)} className={`${crmBtn.ghost} -my-2`}>
                                <Download className="h-4 w-4" aria-hidden="true" /> CSV
                            </button>
                        )}
                    >
                        {occupancy ? <OccupancyGrid data={occupancy} /> : <p className="p-5 text-sm text-brand-muted">Não foi possível carregar a ocupação.</p>}
                    </Panel>
                </div>
            )}
        </CrmPage>
    );
}
