import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Clock, RefreshCw, Settings2, UserX } from 'lucide-react';
import { Badge, CrmPage, EmptyState, Field, Panel, Sheet, Skeleton, Stat } from '@/components/app/ui';
import { crmBtn, crmInput, formatBRL } from '@/components/app/tokens';
import { BarList } from '@/components/app/charts';
import { useToast } from '@/contexts/ToastContext';
import { apiErrorMessage } from '@/lib/upload';
import { Indicators as Data, IndicatorsPeriod, Processo, Sla, indicatorsService } from '@/services/indicators.service';

const PERIODOS: IndicatorsPeriod[] = [7, 30, 90, 180, 365];
const PERIODO_LABEL: Record<IndicatorsPeriod, string> = { 7: '7 dias', 30: '30 dias', 90: '90 dias', 180: '6 meses', 365: '12 meses' };
const ETAPA_CURTA: Record<string, string> = {
    NEW_LEAD: 'Novo', FIRST_CONTACT: '1º contato', NEGOTIATION: 'Negociação', WAITING_REPLY: 'Aguardando', PROPOSAL_SENT: 'Proposta', POST_SALES: 'Pós-venda',
};

/** "1,5 h", "2,3 dias" ou "—". */
const tempo = (horas: number | null | undefined) => {
    if (horas == null) return '—';
    if (horas < 1) return `${Math.round(horas * 60)} min`;
    if (horas < 48) return `${horas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`;
    return `${(horas / 24).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias`;
};
const dias = (d: number | null | undefined) => (d == null ? '—' : `${d.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias`);
/** Valores grandes em formato curto nos cartões ("R$ 600,2 mil"): não estouram a largura. */
const brl = (v: number | null | undefined) => (v == null ? '—' : Math.abs(v) >= 100_000 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v) : formatBRL(v));
const pct = (v: number | null | undefined) => (v == null ? '—' : `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`);
const medido = (p: Processo) => {
    if (p.mediaMedida == null) return '—';
    return p.unidade === 'dias' ? dias(p.mediaMedida) : p.unidade === 'h' ? tempo(p.mediaMedida) : String(p.mediaMedida);
};
/** Verde a partir de 90%, laranja entre 70% e 90%, vermelho abaixo. */
const tomSla = (v: number | null) => (v == null ? 'muted' : v >= 90 ? 'success' : v >= 70 ? 'accent' : 'danger') as 'muted' | 'success' | 'accent' | 'danger';
const corBarra = { muted: 'bg-brand-border', success: 'bg-emerald-500', accent: 'bg-brand-neon', danger: 'bg-red-500' } as const;

const ALERTA_ICONE = { 'sem-dono': UserX, parado: Clock, atividade: AlertTriangle, contato: AlertTriangle } as const;

/** Barra de cumprimento do SLA (0–100%). */
function Cumprimento({ valor }: { valor: number | null }) {
    const tom = tomSla(valor);
    return (
        <div className="flex min-w-[120px] items-center gap-2">
            <div className="h-1.5 flex-1 bg-brand-border/60" aria-hidden="true">
                <div className={`h-full ${corBarra[tom]}`} style={{ width: `${Math.max(0, Math.min(100, valor ?? 0))}%` }} />
            </div>
            <span className="w-12 text-right font-mono text-xs text-brand-text">{pct(valor)}</span>
        </div>
    );
}

/** Metas de SLA editáveis pela gestão. */
function MetasSla({ open, onClose, atual, onSaved }: { open: boolean; onClose: () => void; atual: Sla | null; onSaved: () => void }) {
    const toast = useToast();
    const [form, setForm] = useState<Sla | null>(atual);
    const [saving, setSaving] = useState(false);
    useEffect(() => { if (open) setForm(atual); }, [open, atual]);
    if (!form) return null;
    const campos: { k: keyof Sla; label: string; hint: string }[] = [
        { k: 'primeiraRespostaHoras', label: 'Primeira resposta ao lead (horas)', hint: 'Do lead entrar na fila até um consultor assumir.' },
        { k: 'propostaHoras', label: 'Proposta enviada (horas)', hint: 'Da entrada do negócio até a etapa "Proposta enviada".' },
        { k: 'fechamentoDias', label: 'Fechamento (dias)', hint: 'Da entrada até ganho ou perda (lead time).' },
        { k: 'paradoDias', label: 'Negócio parado (dias)', hint: 'Tempo máximo sem mudar de etapa, status ou responsável.' },
        { k: 'pedidoAprovacaoHoras', label: 'Aprovação de pedido do site (horas)', hint: 'Do pedido até aprovar ou recusar.' },
        { k: 'contatoRespostaHoras', label: 'Resposta a contato do site (horas)', hint: 'Do formulário até marcar como resolvido.' },
    ];
    const salvar = async () => {
        setSaving(true);
        try {
            await indicatorsService.updateSla(form);
            toast.success('Metas de SLA salvas.');
            onSaved();
            onClose();
        } catch (e) {
            toast.error(apiErrorMessage(e, 'Não foi possível salvar as metas.'));
        } finally {
            setSaving(false);
        }
    };
    return (
        <Sheet open={open} onClose={onClose} eyebrow="Processos" title="Metas de SLA"
            footer={<div className="flex justify-end gap-2"><button type="button" className={crmBtn.ghost} onClick={onClose}>Cancelar</button><button type="button" className={crmBtn.primary} onClick={salvar} disabled={saving}>{saving ? 'Salvando…' : 'Salvar metas'}</button></div>}>
            <div className="grid gap-4">
                {campos.map(({ k, label, hint }) => (
                    <Field key={k} label={label} htmlFor={`sla-${k}`} hint={hint}>
                        <input id={`sla-${k}`} type="number" min={0.5} step={0.5} className={crmInput} value={form[k]}
                            onChange={(e) => setForm((f) => (f ? { ...f, [k]: Number(e.target.value) } : f))} />
                    </Field>
                ))}
            </div>
        </Sheet>
    );
}

export function Indicators() {
    const [periodo, setPeriodo] = useState<IndicatorsPeriod>(30);
    const [data, setData] = useState<Data | null>(null);
    const [erro, setErro] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [metasAbertas, setMetasAbertas] = useState(false);

    const carregar = useCallback(async () => {
        setCarregando(true);
        setErro(null);
        try {
            setData(await indicatorsService.get(periodo));
        } catch (e) {
            setErro(apiErrorMessage(e, 'Não foi possível carregar os indicadores.'));
        } finally {
            setCarregando(false);
        }
    }, [periodo]);
    useEffect(() => { carregar(); }, [carregar]);

    const k = data?.kpis;
    return (
        <CrmPage
            eyebrow="Acompanhamento · Processos comerciais"
            title="Indicadores e SLA"
            description="KPIs do funil, cumprimento das metas de cada processo, lead time, tempo por etapa e por consultor. Calculado a partir do histórico de cada negócio."
            actions={<>
                <div className="flex border border-brand-border" role="group" aria-label="Período">
                    {PERIODOS.map((p) => (
                        <button key={p} type="button" onClick={() => setPeriodo(p)} aria-pressed={periodo === p}
                            className={`px-3 py-2 text-xs ${periodo === p ? 'bg-brand-neon font-semibold text-ink-950' : 'text-brand-muted hover:text-brand-text'}`}>{PERIODO_LABEL[p]}</button>
                    ))}
                </div>
                <button type="button" className={crmBtn.ghost} onClick={() => setMetasAbertas(true)} disabled={!data}><Settings2 className="h-4 w-4" aria-hidden="true" /> Metas de SLA</button>
                <button type="button" className={crmBtn.ghost} onClick={carregar} aria-label="Atualizar"><RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} aria-hidden="true" /></button>
            </>}
        >
            {erro && <EmptyState title="Indicadores indisponíveis" text={erro} action={<button type="button" className={crmBtn.primary} onClick={carregar}>Tentar de novo</button>} />}

            {/* ============================ KPIs ============================ */}
            {!erro && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {!k ? Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="h-28" />) : <>
                        <Stat label="Cumprimento de SLA" value={pct(k.slaCumprimentoPct)} hint="Média dos processos com dados" accent />
                        <Stat label="Em atraso agora" value={k.emAtraso} hint="Somando todos os processos" />
                        <Stat label="Leads novos" value={k.leadsNovos} hint={PERIODO_LABEL[periodo]} />
                        <Stat label="Taxa de conversão" value={pct(k.taxaConversaoPct)} hint={`${k.ganhos} ganhos · ${k.perdidos} perdidos`} />
                        <Stat label="Receita ganha" value={brl(k.receitaGanha)} hint={k.ticketMedio != null ? `Ticket médio ${brl(k.ticketMedio)}` : 'Sem vendas no período'} />
                        <Stat label="Lead time médio" value={dias(k.leadTimeMedioDias)} hint="Entrada → ganho ou perda" />
                        <Stat label="Ciclo de venda" value={dias(k.cicloVendaMedioDias)} hint="Entrada → ganho" />
                        <Stat label="Primeira resposta" value={tempo(k.primeiraRespostaMediaHoras)} hint="Lead na fila → consultor" />
                        <Stat label="Pipeline aberto" value={brl(k.pipelineAberto)} hint={`${k.negociosAbertos} negócios abertos`} />
                        <Stat label="Previsão ponderada" value={brl(k.previsaoPonderada)} hint="Valor × probabilidade" />
                    </>}
                </div>
            )}

            {/* ============================ PROCESSOS ============================ */}
            {data && (
                <Panel title="Processos e metas (SLA)" action={<span className="text-xs text-brand-muted">Meta → medido → no prazo</span>}>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead>
                                <tr className="border-b border-brand-border text-left text-xs uppercase tracking-[0.12em] text-brand-muted">
                                    <th className="px-5 py-3 font-medium">Processo</th>
                                    <th className="px-3 py-3 font-medium">Responsável</th>
                                    <th className="px-3 py-3 font-medium">Meta</th>
                                    <th className="px-3 py-3 font-medium">Média</th>
                                    <th className="px-3 py-3 font-medium">No prazo</th>
                                    <th className="px-5 py-3 text-right font-medium">Em atraso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.processos.map((p) => (
                                    <tr key={p.id} className="border-b border-brand-border/60 last:border-0 align-top">
                                        <td className="px-5 py-3">
                                            <p className="font-medium text-brand-text">{p.nome}</p>
                                            <p className="mt-0.5 max-w-[46ch] text-xs text-brand-muted">{p.descricao}</p>
                                        </td>
                                        <td className="px-3 py-3 text-brand-muted">{p.dono}</td>
                                        <td className="px-3 py-3 font-mono text-xs text-brand-text">{p.meta}</td>
                                        <td className="px-3 py-3 font-mono text-xs text-brand-text">{medido(p)}{p.medianaMedida != null && p.unidade !== 'negócios' && <span className="block text-brand-muted">mediana {p.unidade === 'dias' ? dias(p.medianaMedida) : tempo(p.medianaMedida)}</span>}</td>
                                        <td className="px-3 py-3"><Cumprimento valor={p.cumprimentoPct} /><span className="text-[11px] text-brand-muted">{p.amostras} {p.amostras === 1 ? 'caso' : 'casos'}</span></td>
                                        <td className="px-5 py-3 text-right">{p.emAtraso ? <Badge tone="danger">{p.emAtraso}</Badge> : <Badge tone="muted">0</Badge>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            )}

            {/* ============================ ETAPAS + ALERTAS ============================ */}
            {data && (
                <div className="grid gap-6 lg:grid-cols-2">
                    <Panel title="Tempo médio em cada etapa" action={data.gargalo && <Badge tone="accent">Gargalo: {data.gargalo.nome}</Badge>} bodyClassName="p-5">
                        <BarList
                            rows={data.etapas.filter((e) => e.tempoMedioHoras != null).map((e) => ({ label: e.nome, hint: `${e.passagens} passagens · ${e.abertos} abertos agora`, value: e.tempoMedioHoras ?? 0 }))}
                            format={(v) => tempo(v)}
                            empty="Ainda não há passagens de etapa no período."
                        />
                        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-brand-border pt-4 sm:grid-cols-6">
                            {data.etapas.map((e) => (
                                <div key={e.etapa} className="min-w-0">
                                    <p className="truncate text-[11px] text-brand-muted">{ETAPA_CURTA[e.etapa] ?? e.nome}</p>
                                    <p className="font-mono text-sm text-brand-text">{e.abertos}</p>
                                    <p className="truncate font-mono text-[11px] text-brand-muted">{e.abertos ? formatBRL(e.valorAberto) : '—'}</p>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    <Panel title="Alertas" action={<span className="text-xs text-brand-muted">{data.alertas.length} itens</span>}>
                        {data.alertas.length === 0 ? (
                            <p className="px-5 py-6 text-sm text-brand-muted">Nada fora do prazo. Os processos estão em dia.</p>
                        ) : (
                            <ul className="max-h-[360px] divide-y divide-brand-border/60 overflow-y-auto">
                                {data.alertas.map((a, i) => {
                                    const Icone = ALERTA_ICONE[a.tipo];
                                    return (
                                        <li key={i} className="flex gap-3 px-5 py-3">
                                            <Icone className={`mt-0.5 h-4 w-4 shrink-0 ${a.tipo === 'parado' ? 'text-brand-neon' : 'text-red-500'}`} aria-hidden="true" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm text-brand-text">{a.titulo}</p>
                                                <p className="truncate text-xs text-brand-muted">{[a.cliente, a.negocio, a.comercial && `com ${a.comercial}`].filter(Boolean).join(' · ')}</p>
                                            </div>
                                            <span className="shrink-0 font-mono text-xs text-brand-muted">há {tempo(a.horas)}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Panel>
                </div>
            )}

            {/* ============================ POR COMERCIAL ============================ */}
            {data && (
                <Panel title="Desempenho e tempo de processo por consultor">
                    {data.comerciais.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-brand-muted">Nenhum consultor com movimento no período.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1080px] text-sm">
                                <thead>
                                    <tr className="border-b border-brand-border text-left text-xs uppercase tracking-[0.12em] text-brand-muted">
                                        <th className="px-5 py-3 font-medium">Consultor</th>
                                        <th className="px-3 py-3 text-right font-medium">Negócios</th>
                                        <th className="px-3 py-3 text-right font-medium">Ganhos / perdidos</th>
                                        <th className="px-3 py-3 text-right font-medium">Conversão</th>
                                        <th className="px-3 py-3 text-right font-medium">Receita</th>
                                        <th className="px-3 py-3 text-right font-medium">1ª resposta</th>
                                        <th className="px-3 py-3 text-right font-medium">Lead time</th>
                                        {Object.keys(ETAPA_CURTA).map((e) => <th key={e} className="px-2 py-3 text-right font-medium normal-case tracking-normal">{ETAPA_CURTA[e]}</th>)}
                                        <th className="px-5 py-3 text-right font-medium">Pendências</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.comerciais.map((c) => (
                                        <tr key={c.id} className="border-b border-brand-border/60 last:border-0">
                                            <td className="px-5 py-3"><p className="font-medium text-brand-text">{c.nome}</p><p className="text-xs text-brand-muted">{c.abertos} abertos · {formatBRL(c.pipelineAberto)}</p></td>
                                            <td className="px-3 py-3 text-right font-mono">{c.negociosNoPeriodo}</td>
                                            <td className="px-3 py-3 text-right font-mono">{c.ganhos} / {c.perdidos}</td>
                                            <td className="px-3 py-3 text-right font-mono">{pct(c.taxaConversaoPct)}</td>
                                            <td className="px-3 py-3 text-right font-mono">{formatBRL(c.receita)}</td>
                                            <td className="px-3 py-3 text-right font-mono">{tempo(c.primeiraRespostaMediaHoras)}{c.primeiraRespostaNoPrazoPct != null && <span className="block text-[11px] text-brand-muted">{pct(c.primeiraRespostaNoPrazoPct)} no prazo</span>}</td>
                                            <td className="px-3 py-3 text-right font-mono">{dias(c.leadTimeMedioDias)}</td>
                                            {Object.keys(ETAPA_CURTA).map((e) => <td key={e} className="px-2 py-3 text-right font-mono text-xs text-brand-muted">{tempo(c.tempoPorEtapaHoras[e])}</td>)}
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex flex-wrap justify-end gap-1">
                                                    {c.atividadesAtrasadas > 0 && <Badge tone="danger">{c.atividadesAtrasadas} tarefas atrasadas</Badge>}
                                                    {c.parados > 0 && <Badge tone="accent">{c.parados} parados</Badge>}
                                                    {!c.atividadesAtrasadas && !c.parados && <Badge tone="success">em dia</Badge>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <p className="border-t border-brand-border px-5 py-3 text-xs text-brand-muted">Tempo por etapa: média de quanto os negócios do consultor ficaram em cada etapa antes de seguir. Lead time: da entrada ao ganho ou perda.</p>
                </Panel>
            )}

            {/* ============================ SEMANAS ============================ */}
            {data && (
                <Panel title="Leads e fechamentos nas últimas 12 semanas" bodyClassName="p-5">
                    <div className="flex h-40 items-end gap-2" role="img" aria-label="Leads, ganhos e perdidos por semana">
                        {data.semanas.map((s) => {
                            const max = Math.max(1, ...data.semanas.map((x) => Math.max(x.leads, x.ganhos + x.perdidos)));
                            return (
                                <div key={s.inicio} className="flex h-full flex-1 flex-col justify-end gap-1" title={`Semana de ${s.inicio.split('-').reverse().slice(0, 2).join('/')}: ${s.leads} leads, ${s.ganhos} ganhos, ${s.perdidos} perdidos`}>
                                    <div className="flex flex-1 items-end gap-0.5">
                                        <div className="flex-1 bg-brand-border" style={{ height: `${(s.leads / max) * 100}%` }} />
                                        <div className="flex-1 bg-brand-neon" style={{ height: `${(s.ganhos / max) * 100}%` }} />
                                        <div className="flex-1 bg-red-500/70" style={{ height: `${(s.perdidos / max) * 100}%` }} />
                                    </div>
                                    <span className="text-center font-mono text-[10px] text-brand-muted">{s.inicio.slice(8, 10)}/{s.inicio.slice(5, 7)}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-3 flex gap-4 text-xs text-brand-muted">
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-brand-border" /> Leads</span>
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-brand-neon" /> Ganhos</span>
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-red-500/70" /> Perdidos</span>
                    </div>
                </Panel>
            )}

            <MetasSla open={metasAbertas} onClose={() => setMetasAbertas(false)} atual={data?.sla ?? null} onSaved={carregar} />
        </CrmPage>
    );
}
