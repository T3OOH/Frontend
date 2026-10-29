import { DragEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Plus, Trophy, XCircle, RotateCcw } from 'lucide-react';
import { crmService, CrmClient, CrmDeal, DealStage, DealStatus } from '@/services/crm.service';
import { useToast } from '@/contexts/ToastContext';
import { CrmPage, EmptyState, Field, Sheet, Skeleton } from '@/components/app/ui';
import { crmBtn, crmInput, formatBRL, formatDate, whatsappUrl } from '@/components/app/tokens';
import { CustomSelect } from '@/components/CustomSelect';
import { SolutionProject } from '@/components/crm/SolutionProject';
import { DealLine, LINE_LABEL, SOLUTION_APPLICATIONS, SolutionDetails, solutionSummary } from '@/lib/solution';

const STAGES: { id: DealStage; title: string }[] = [
    { id: 'NEW_LEAD', title: 'Novos leads' },
    { id: 'FIRST_CONTACT', title: 'Primeiro contato' },
    { id: 'NEGOTIATION', title: 'Em negociação' },
    { id: 'WAITING_REPLY', title: 'Aguardando retorno' },
    { id: 'PROPOSAL_SENT', title: 'Proposta enviada' },
    { id: 'POST_SALES', title: 'Pós-venda' },
];

const STATUS_TABS: { id: DealStatus; label: string }[] = [
    { id: 'OPEN', label: 'Abertos' },
    { id: 'WON', label: 'Ganhos' },
    { id: 'LOST', label: 'Perdidos' },
];

const LINE_TABS: { id: DealLine | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'Todas as linhas' },
    { id: 'OOH', label: 'T3 OOH' },
    { id: 'SOLUTION', label: 'T3 Solution' },
];

const EMPTY_FORM = { clientId: '', title: '', expectedValue: '', probability: '50', line: 'OOH' as DealLine, application: '' };
const lineOf = (d: CrmDeal): DealLine => (d.line === 'SOLUTION' ? 'SOLUTION' : 'OOH');
const daysSince = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
const errorMessage = (error: unknown, fallback: string) =>
    (error as { response?: { data?: { error?: string } } }).response?.data?.error || fallback;

export function CrmPipeline() {
    const toast = useToast();
    const [deals, setDeals] = useState<CrmDeal[]>([]);
    const [clients, setClients] = useState<CrmClient[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [view, setView] = useState<DealStatus>('OPEN');
    const [line, setLine] = useState<DealLine | 'ALL'>('ALL');
    const [mobileStage, setMobileStage] = useState<DealStage>('NEW_LEAD');
    const [dragId, setDragId] = useState<string | null>(null);
    const [overStage, setOverStage] = useState<DealStage | null>(null);
    const [selected, setSelected] = useState<CrmDeal | null>(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            setStatus('loading');
            const [d, c] = await Promise.all([crmService.getDeals(), crmService.getClients()]);
            setDeals(d);
            setClients(c);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => { load(); }, []);

    const byLine = useMemo(() => (line === 'ALL' ? deals : deals.filter((d) => lineOf(d) === line)), [deals, line]);
    const byStatus = useMemo(() => byLine.filter((d) => d.status === view), [byLine, view]);
    const counts = useMemo(() => ({
        OPEN: byLine.filter((d) => d.status === 'OPEN').length,
        WON: byLine.filter((d) => d.status === 'WON').length,
        LOST: byLine.filter((d) => d.status === 'LOST').length,
    }), [byLine]);
    const lineCounts = useMemo(() => ({
        ALL: deals.filter((d) => d.status === view).length,
        OOH: deals.filter((d) => d.status === view && lineOf(d) === 'OOH').length,
        SOLUTION: deals.filter((d) => d.status === view && lineOf(d) === 'SOLUTION').length,
    }), [deals, view]);

    /** Atualiza um negócio na tela antes da resposta e desfaz se o servidor recusar. */
    const optimistic = async (id: string, patch: Partial<CrmDeal>, request: () => Promise<unknown>, success: string) => {
        const before = deals;
        setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d)));
        setSelected((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
        try {
            await request();
            toast.success(success);
        } catch (error) {
            setDeals(before);
            setSelected((prev) => (prev?.id === id ? before.find((d) => d.id === id) ?? null : prev));
            toast.error(errorMessage(error, 'Não foi possível salvar. Nada foi alterado.'));
        }
    };

    const moveTo = (deal: CrmDeal, stage: DealStage) => {
        if (deal.stage === stage) return;
        const title = STAGES.find((s) => s.id === stage)?.title;
        optimistic(deal.id, { stage }, () => crmService.updateDealStage(deal.id, stage), `Movido para ${title?.toLowerCase()}.`);
    };

    const setDealStatus = (deal: CrmDeal, next: DealStatus) => {
        const msg = next === 'WON' ? 'Negócio marcado como ganho.' : next === 'LOST' ? 'Negócio marcado como perdido.' : 'Negócio reaberto.';
        optimistic(deal.id, { status: next }, () => crmService.updateDealStatus(deal.id, next), msg);
        setSelected(null);
    };

    const saveProject = async (deal: CrmDeal, data: { solution: SolutionDetails; expectedValue: number }) => {
        try {
            await crmService.updateDeal(deal.id, data);
            const patch = { solution: data.solution, expectedValue: data.expectedValue };
            setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, ...patch } : d)));
            setSelected((prev) => (prev?.id === deal.id ? { ...prev, ...patch } : prev));
            toast.success('Projeto salvo.');
        } catch (error) {
            toast.error(errorMessage(error, 'Não foi possível salvar o projeto.'));
        }
    };

    const onDrop = (e: DragEvent, stage: DealStage) => {
        e.preventDefault();
        const deal = deals.find((d) => d.id === (dragId || e.dataTransfer.getData('text/plain')));
        setDragId(null);
        setOverStage(null);
        if (deal) moveTo(deal, stage);
    };

    const onCreate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await crmService.createDeal({
                clientId: form.clientId,
                title: form.title.trim(),
                expectedValue: Number(form.expectedValue) || 0,
                probability: Math.round(Number(form.probability) || 0),
                line: form.line,
                solution: form.line === 'SOLUTION' && form.application ? { application: form.application as SolutionDetails['application'] } : undefined,
            });
            toast.success('Oportunidade criada em novos leads.');
            setCreating(false);
            setForm(EMPTY_FORM);
            load();
        } catch (error) {
            toast.error(errorMessage(error, 'Não foi possível criar a oportunidade.'));
        } finally {
            setSaving(false);
        }
    };

    const openWhatsApp = (deal: CrmDeal) => {
        const phone = deal.client?.whatsapp || deal.client?.phone;
        if (!phone) {
            toast.error('Este cliente não tem telefone cadastrado.');
            return;
        }
        const first = deal.client?.name?.split(' ')[0] || '';
        window.open(whatsappUrl(phone, `Olá, ${first}! Aqui é do comercial da ${LINE_LABEL[lineOf(deal)]}.`), '_blank', 'noopener');
    };

    const DealCard = ({ deal }: { deal: CrmDeal }) => {
        const days = daysSince(deal.updatedAt);
        return (
            <li
                draggable={view === 'OPEN'}
                onDragStart={(e) => { setDragId(deal.id); e.dataTransfer.setData('text/plain', deal.id); e.dataTransfer.effectAllowed = 'move'; }}
                onDragEnd={() => { setDragId(null); setOverStage(null); }}
                className={`border border-brand-border bg-brand-surface transition-colors hover:border-brand-muted ${dragId === deal.id ? 'opacity-40' : ''} ${view === 'OPEN' ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
                <button type="button" onClick={() => setSelected(deal)} className="block w-full p-4 text-left">
                    {lineOf(deal) === 'SOLUTION' && (
                        <span className="mb-2 inline-block border border-brand-neon/40 bg-brand-neon/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-neon">T3 Solution</span>
                    )}
                    <p className="line-clamp-2 text-sm font-medium text-brand-text">{deal.title}</p>
                    <p className="mt-1 truncate text-xs text-brand-muted">{deal.client?.name || 'Cliente'}</p>
                    {lineOf(deal) === 'SOLUTION' && solutionSummary(deal.solution) && (
                        <p className="mt-1 truncate font-mono text-[11px] text-brand-muted">{solutionSummary(deal.solution)}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-brand-border pt-3">
                        <span className="font-mono text-sm text-brand-text">{formatBRL(deal.expectedValue)}</span>
                        <span className={`font-mono text-xs ${days > 7 && view === 'OPEN' ? 'text-red-500' : 'text-brand-muted'}`} title="Dias sem movimentação">
                            {days}d
                        </span>
                    </div>
                </button>
            </li>
        );
    };

    const selectedStage = STAGES.find((s) => s.id === selected?.stage);

    return (
        <CrmPage
            wide
            eyebrow="Vendas"
            title="Funil"
            description={view === 'OPEN' ? 'Arraste os cards entre as etapas, ou abra um card para mudar a etapa e fechar o negócio.' : 'Negócios encerrados. Abra um card para reabrir.'}
            actions={<button type="button" onClick={() => setCreating(true)} className={crmBtn.primary}><Plus className="h-4 w-4" aria-hidden="true" /> Nova oportunidade</button>}
        >
            <div className="flex flex-wrap items-center gap-3">
            <div role="tablist" aria-label="Linha de negócio" className="flex gap-px self-start border border-brand-border bg-brand-border">
                {LINE_TABS.map((t) => (
                    <button key={t.id} role="tab" aria-selected={line === t.id} onClick={() => setLine(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm ${line === t.id ? 'bg-brand-surface text-brand-text shadow-[inset_0_-2px_0_rgb(255,94,0)]' : 'bg-brand-background text-brand-muted hover:text-brand-text'}`}>
                        {t.label} <span className="font-mono text-xs text-brand-muted">{lineCounts[t.id]}</span>
                    </button>
                ))}
            </div>
            <div role="tablist" aria-label="Situação" className="flex gap-px self-start border border-brand-border bg-brand-border">
                {STATUS_TABS.map((t) => (
                    <button key={t.id} role="tab" aria-selected={view === t.id} onClick={() => setView(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm ${view === t.id ? 'bg-brand-surface text-brand-text' : 'bg-brand-background text-brand-muted hover:text-brand-text'}`}>
                        {t.label} <span className="font-mono text-xs text-brand-muted">{counts[t.id]}</span>
                    </button>
                ))}
            </div>
            </div>

            {status === 'loading' && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">{STAGES.map((s) => <Skeleton key={s.id} className="h-64" />)}</div>
            )}

            {status === 'error' && (
                <EmptyState title="Não foi possível carregar o funil" action={<button type="button" onClick={load} className={crmBtn.secondary}>Tentar de novo</button>} />
            )}

            {status === 'ready' && deals.length === 0 && (
                <EmptyState
                    title="Nenhuma oportunidade ainda"
                    text={clients.length ? 'Crie a primeira oportunidade para um cliente da sua carteira.' : 'Cadastre um cliente e depois crie uma oportunidade para ele. Leads do site chegam pela fila, na tela inicial.'}
                    action={clients.length
                        ? <button type="button" onClick={() => setCreating(true)} className={crmBtn.primary}><Plus className="h-4 w-4" aria-hidden="true" /> Nova oportunidade</button>
                        : <Link to="/crm/clientes" className={crmBtn.primary}>Cadastrar cliente</Link>}
                />
            )}

            {/* ============================ QUADRO (abertos) ============================ */}
            {status === 'ready' && deals.length > 0 && view === 'OPEN' && (
                <>
                    {/* Celular: uma etapa por vez */}
                    <div className="-mx-4 flex gap-px overflow-x-auto border-y border-brand-border bg-brand-border px-0 md:hidden">
                        {STAGES.map((s) => {
                            const n = byStatus.filter((d) => d.stage === s.id).length;
                            return (
                                <button key={s.id} type="button" onClick={() => setMobileStage(s.id)} aria-pressed={mobileStage === s.id}
                                    className={`shrink-0 px-4 py-2.5 text-sm ${mobileStage === s.id ? 'bg-brand-surface text-brand-text shadow-[inset_0_-2px_0_rgb(255,94,0)]' : 'bg-brand-background text-brand-muted'}`}>
                                    {s.title} <span className="font-mono text-xs">{n}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
                        <div className="flex gap-3">
                            {STAGES.map((stage) => {
                                const list = byStatus.filter((d) => d.stage === stage.id);
                                const total = list.reduce((sum, d) => sum + Number(d.expectedValue), 0);
                                return (
                                    <section
                                        key={stage.id}
                                        aria-label={stage.title}
                                        onDragOver={(e) => { e.preventDefault(); setOverStage(stage.id); }}
                                        onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
                                        onDrop={(e) => onDrop(e, stage.id)}
                                        className={`w-full shrink-0 flex-col border bg-brand-background md:flex md:w-72 ${mobileStage === stage.id ? 'flex' : 'hidden'} ${overStage === stage.id ? 'border-brand-neon' : 'border-brand-border'}`}
                                    >
                                        <header className="border-b border-brand-border px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-sm font-medium text-brand-text">{stage.title}</h2>
                                                <span className="font-mono text-xs text-brand-muted">{list.length}</span>
                                            </div>
                                            <p className="mt-1 font-mono text-xs text-brand-muted">{formatBRL(total)}</p>
                                        </header>
                                        <ul className="flex min-h-[8rem] flex-col gap-2 p-2">
                                            {list.map((deal) => <DealCard key={deal.id} deal={deal} />)}
                                            {list.length === 0 && <li className="px-2 py-6 text-center text-xs text-brand-muted">Solte um card aqui</li>}
                                        </ul>
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* ============================ LISTA (ganhos / perdidos) ============================ */}
            {status === 'ready' && deals.length > 0 && view !== 'OPEN' && (
                byStatus.length === 0
                    ? <EmptyState title={view === 'WON' ? 'Nenhum negócio ganho ainda' : 'Nenhum negócio perdido'} text="Abra um card no funil para marcar o resultado." />
                    : <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">{byStatus.map((deal) => <DealCard key={deal.id} deal={deal} />)}</ul>
            )}

            {/* ============================ DETALHES ============================ */}
            <Sheet
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
                eyebrow={selected ? `${LINE_LABEL[lineOf(selected)]} · ${selected.status === 'OPEN' ? selectedStage?.title : selected.status === 'WON' ? 'Ganho' : 'Perdido'}` : undefined}
                title={selected?.title ?? ''}
                size="lg"
                footer={selected && (selected.status === 'OPEN' ? <>
                    <button type="button" onClick={() => setDealStatus(selected, 'LOST')} className={crmBtn.secondary}><XCircle className="h-4 w-4" aria-hidden="true" /> Marcar como perdido</button>
                    <button type="button" onClick={() => setDealStatus(selected, 'WON')} className={crmBtn.primary}><Trophy className="h-4 w-4" aria-hidden="true" /> Marcar como ganho</button>
                </> : (
                    <button type="button" onClick={() => setDealStatus(selected, 'OPEN')} className={crmBtn.secondary}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Reabrir negócio</button>
                ))}
            >
                {selected && (
                    <div className="flex flex-col gap-6">
                        <dl className="grid grid-cols-2 gap-px border border-brand-border bg-brand-border sm:grid-cols-4">
                            {[
                                ['Valor', formatBRL(selected.expectedValue)],
                                ['Probabilidade', `${selected.probability}%`],
                                lineOf(selected) === 'SOLUTION'
                                    ? ['Aplicação', selected.solution?.application || '—']
                                    : ['Prazo', selected.contractMonths ? `${selected.contractMonths} ${selected.contractMonths === 1 ? 'mês' : 'meses'}` : '—'],
                                ['Criado em', formatDate(selected.createdAt)],
                            ].map(([k, v]) => (
                                <div key={k} className="bg-brand-surface p-3">
                                    <dt className="text-xs text-brand-muted">{k}</dt>
                                    <dd className="mt-1 font-mono text-sm text-brand-text">{v}</dd>
                                </div>
                            ))}
                        </dl>

                        <div>
                            <p className="mb-2 text-sm text-brand-muted">Cliente</p>
                            <div className="flex flex-wrap items-center justify-between gap-3 border border-brand-border p-4">
                                <div className="min-w-0">
                                    <p className="font-medium text-brand-text">{selected.client?.name}</p>
                                    <p className="truncate text-sm text-brand-muted">{[selected.client?.company, selected.client?.email, selected.client?.whatsapp || selected.client?.phone].filter(Boolean).join(' · ') || 'Sem contato cadastrado'}</p>
                                </div>
                                <button type="button" onClick={() => openWhatsApp(selected)} className={crmBtn.secondary}><MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp</button>
                            </div>
                        </div>

                        {selected.status === 'OPEN' && (
                            <Field label="Etapa" htmlFor="deal-stage">
                                <CustomSelect id="deal-stage" value={selected.stage} onChange={(v) => moveTo(selected, v as DealStage)}
                                    options={STAGES.map((s) => ({ value: s.id, label: s.title }))} />
                            </Field>
                        )}

                        {lineOf(selected) === 'SOLUTION' && (
                            <SolutionProject
                                key={selected.id}
                                value={selected.solution}
                                expectedValue={Number(selected.expectedValue)}
                                disabled={selected.status !== 'OPEN'}
                                onSave={(data) => saveProject(selected, data)}
                            />
                        )}

                        {Boolean(selected.items?.length) && (
                            <div>
                                <p className="mb-2 text-sm text-brand-muted">Painéis ({selected.items!.length})</p>
                                <ul className="divide-y divide-brand-border border border-brand-border">
                                    {selected.items!.map((item) => (
                                        <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                                            <span className="min-w-0 truncate text-brand-text">{item.panel?.name}<span className="text-brand-muted"> · {[item.panel?.city, item.panel?.state].filter(Boolean).join(' - ')}</span></span>
                                            <span className="shrink-0 font-mono text-brand-muted">{formatBRL(item.priceSnapshot)}/mês</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <p className="text-xs text-brand-muted">
                            Responsável: {selected.seller?.name || 'você'}. <Link to={`/crm/clientes?dealId=${selected.id}`} className="underline underline-offset-4 hover:text-brand-text">Abrir ficha do cliente</Link>
                        </p>
                    </div>
                )}
            </Sheet>

            {/* ============================ NOVA OPORTUNIDADE ============================ */}
            <Sheet
                open={creating}
                onClose={() => setCreating(false)}
                eyebrow="Funil"
                title="Nova oportunidade"
                footer={<>
                    <button type="button" onClick={() => setCreating(false)} className={crmBtn.secondary}>Cancelar</button>
                    <button type="submit" form="deal-form" disabled={saving || !clients.length} className={crmBtn.primary}>{saving ? 'Criando…' : 'Criar oportunidade'}</button>
                </>}
            >
                {clients.length === 0 ? (
                    <EmptyState title="Nenhum cliente na carteira" text="A oportunidade precisa de um cliente." action={<Link to="/crm/clientes" className={crmBtn.primary}>Cadastrar cliente</Link>} />
                ) : (
                    <form id="deal-form" onSubmit={onCreate} className="grid grid-cols-2 gap-4">
                        <fieldset className="col-span-2">
                            <legend className="mb-1.5 text-sm text-brand-text">Linha de negócio</legend>
                            <div role="radiogroup" className="grid grid-cols-2 gap-px border border-brand-border bg-brand-border">
                                {(['OOH', 'SOLUTION'] as DealLine[]).map((l) => (
                                    <button key={l} type="button" role="radio" aria-checked={form.line === l} onClick={() => setForm({ ...form, line: l })}
                                        className={`min-h-11 px-3 py-2.5 text-sm md:min-h-9 ${form.line === l ? 'bg-brand-surface font-medium text-brand-text shadow-[inset_0_-2px_0_rgb(255,94,0)]' : 'bg-brand-background text-brand-muted hover:text-brand-text'}`}>
                                        {LINE_LABEL[l]}
                                        <span className="block text-xs font-normal text-brand-muted">{l === 'OOH' ? 'Mídia nos telões' : 'Venda e instalação de painéis'}</span>
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                        {form.line === 'SOLUTION' && (
                            <Field label="Aplicação" htmlFor="d-application" className="col-span-2">
                                <CustomSelect id="d-application" value={form.application} onChange={(v) => setForm({ ...form, application: v })} placeholder="Onde vai a tela"
                                    options={SOLUTION_APPLICATIONS.map((a) => ({ value: a.title, label: a.title }))} />
                            </Field>
                        )}
                        <Field label="Cliente" htmlFor="d-client" className="col-span-2">
                            <CustomSelect id="d-client" required value={form.clientId} onChange={(v) => setForm({ ...form, clientId: v })} placeholder="Selecione o cliente"
                                options={clients.map((c) => ({ value: c.id, label: c.name, hint: c.company || undefined }))} />
                        </Field>
                        <Field label="Título" htmlFor="d-title" className="col-span-2">
                            <input id="d-title" required minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={crmInput} placeholder={form.line === 'SOLUTION' ? 'Ex.: Telão da área gourmet' : 'Ex.: Pacote anual Av. T-63'} />
                        </Field>
                        <Field label="Valor estimado (R$)" htmlFor="d-value">
                            <input id="d-value" type="number" inputMode="decimal" min="0" step="0.01" value={form.expectedValue} onChange={(e) => setForm({ ...form, expectedValue: e.target.value })} className={`${crmInput} font-mono`} />
                        </Field>
                        <Field label="Probabilidade (%)" htmlFor="d-prob">
                            <input id="d-prob" type="number" inputMode="numeric" min="0" max="100" step="1" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} className={`${crmInput} font-mono`} />
                        </Field>
                    </form>
                )}
            </Sheet>
        </CrmPage>
    );
}
