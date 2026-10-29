import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileDown, FileText, Search } from 'lucide-react';
import { api } from '@/lib/axios';
import { usersService } from '@/services/users.service';
import type { CrmDeal } from '@/services/crm.service';
import { useToast } from '@/contexts/ToastContext';
import { downloadDealContract } from '@/lib/pdf/contract';
import { apiErrorMessage } from '@/lib/upload';
import { Badge, CrmPage, EmptyState, Field, Sheet, Skeleton } from '@/components/app/ui';
import { crmBtn, crmInput, formatBRL, formatDate } from '@/components/app/tokens';
import { CustomSelect } from '@/components/CustomSelect';

type OrderStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

interface Order {
    id: string;
    createdAt: string;
    status: OrderStatus;
    totalValue: number;
    notes?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    sellerId?: string | null;
    seller?: { id: string; name: string } | null;
    user?: { name?: string; email?: string; phone?: string; document?: string; companyName?: string; company?: { corporateName?: string } | null } | null;
    items?: { id?: string; panelId: string; priceSnapshot?: number; panel?: { name?: string; city?: string; state?: string; images?: string[]; price?: number } }[];
}

const STATUS: Record<OrderStatus, { label: string; tone: 'neutral' | 'accent' | 'muted' | 'success' }> = {
    PENDING: { label: 'Novo', tone: 'neutral' },
    APPROVED: { label: 'Proposta enviada', tone: 'accent' },
    COMPLETED: { label: 'Fechado', tone: 'success' },
    REJECTED: { label: 'Perdido', tone: 'muted' },
};
type Filter = 'ALL' | 'UNASSIGNED' | OrderStatus;

const monthsOf = (o: Order) => {
    if (!o.startDate || !o.endDate) return 1;
    return Math.max(1, Math.round(Math.abs(new Date(o.endDate).getTime() - new Date(o.startDate).getTime()) / 86_400_000 / 30));
};
const companyOf = (o: Order) => o.user?.company?.corporateName || o.user?.companyName || '';

/** Adapta o pedido ao formato do contrato (o mesmo usado pelos negócios do CRM). */
const toContract = (o: Order) => ({
    id: o.id,
    createdAt: o.createdAt,
    expectedValue: o.totalValue,
    contractMonths: monthsOf(o),
    seller: o.seller,
    client: { name: o.user?.name || 'Cliente', company: companyOf(o), email: o.user?.email, phone: o.user?.phone, document: o.user?.document },
    items: (o.items || []).map((i, n) => ({ id: i.id || String(n), panelId: i.panelId, priceSnapshot: Number(i.priceSnapshot ?? 0), panel: { name: i.panel?.name || 'Painel', city: i.panel?.city, state: i.panel?.state } })),
}) as unknown as CrmDeal;

export function Orders() {
    const { addToast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [team, setTeam] = useState<{ id: string; name: string }[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('ALL');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            setStatus('loading');
            const [o, u] = await Promise.all([api.get<Order[]>('/orders').then((r) => r.data), usersService.getAllUsers().catch(() => [])]);
            setOrders([...o].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
            setTeam(u.filter((x) => ['ADMIN', 'MANAGER', 'COMERCIAL'].includes(x.role)).map((x) => ({ id: x.id, name: x.name })));
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => { load(); }, []);

    const counts = useMemo(() => {
        const c: Record<Filter, number> = { ALL: orders.length, UNASSIGNED: 0, PENDING: 0, APPROVED: 0, COMPLETED: 0, REJECTED: 0 };
        orders.forEach((o) => { c[o.status] += 1; if (!o.sellerId && (o.status === 'PENDING' || o.status === 'APPROVED')) c.UNASSIGNED += 1; });
        return c;
    }, [orders]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return orders.filter((o) => {
            const byFilter = filter === 'ALL' || (filter === 'UNASSIGNED' ? !o.sellerId && (o.status === 'PENDING' || o.status === 'APPROVED') : o.status === filter);
            const byQuery = !q || [o.user?.name, o.user?.email, companyOf(o), o.seller?.name, o.id].some((v) => v?.toLowerCase().includes(q));
            return byFilter && byQuery;
        });
    }, [orders, query, filter]);

    const selected = orders.find((o) => o.id === selectedId) ?? null;

    const patch = async (order: Order, data: { status?: OrderStatus; sellerId?: string | null }, success: string) => {
        const before = orders;
        const seller = data.sellerId !== undefined ? team.find((t) => t.id === data.sellerId) ?? null : order.seller;
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...data, seller } : o)));
        try {
            setSaving(true);
            await api.patch(`/orders/${order.id}`, data);
            addToast(success, 'success');
        } catch (error) {
            setOrders(before);
            addToast(apiErrorMessage(error, 'Não foi possível atualizar o pedido.'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const tabs: Filter[] = ['ALL', 'UNASSIGNED', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'];
    const tabLabel = (t: Filter) => (t === 'ALL' ? 'Todos' : t === 'UNASSIGNED' ? 'Sem responsável' : STATUS[t].label);

    return (
        <CrmPage eyebrow="Vendas" title="Pedidos" description="Pacotes montados pelos clientes no catálogo do site. Defina o responsável e acompanhe até o fechamento.">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1 lg:max-w-md">
                    <label htmlFor="order-search" className="sr-only">Buscar pedidos</label>
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" aria-hidden="true" />
                    <input id="order-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cliente, empresa, e-mail ou responsável" className={`${crmInput} pl-10`} />
                </div>
                <div role="tablist" aria-label="Filtrar por situação" className="flex gap-px overflow-x-auto border border-brand-border bg-brand-border">
                    {tabs.map((t) => (
                        <button key={t} role="tab" aria-selected={filter === t} onClick={() => setFilter(t)}
                            className={`flex shrink-0 items-center gap-2 px-3.5 py-2 text-sm ${filter === t ? 'bg-brand-surface text-brand-text' : 'bg-brand-background text-brand-muted hover:text-brand-text'}`}>
                            {tabLabel(t)} <span className={`font-mono text-xs ${t === 'UNASSIGNED' && counts.UNASSIGNED ? 'text-brand-neon' : 'text-brand-muted'}`}>{counts[t]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {status === 'loading' && <div className="flex flex-col gap-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>}
            {status === 'error' && <EmptyState title="Não foi possível carregar os pedidos" text="Os dados não chegaram do servidor. Nada foi zerado." action={<button type="button" onClick={load} className={crmBtn.secondary}>Tentar de novo</button>} />}
            {status === 'ready' && visible.length === 0 && <EmptyState title={orders.length ? 'Nenhum pedido com esse filtro' : 'Nenhum pedido ainda'} text={orders.length ? undefined : 'Os pacotes montados no catálogo do site aparecem aqui.'} />}

            {status === 'ready' && visible.length > 0 && (
                <div className="border border-brand-border bg-brand-surface">
                    <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-4 border-b border-brand-border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-brand-muted md:grid">
                        <span>Cliente</span><span>Valor</span><span>Situação</span><span>Responsável</span><span>Data</span>
                    </div>
                    <ul className="divide-y divide-brand-border">
                        {visible.map((o) => (
                            <li key={o.id}>
                                <button type="button" onClick={() => setSelectedId(o.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-5 py-3.5 text-left hover:bg-brand-background md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium text-brand-text">{o.user?.name || 'Cliente'}</span>
                                        <span className="block truncate text-xs text-brand-muted">{companyOf(o) || o.user?.email || '—'} · {o.items?.length ?? 0} {o.items?.length === 1 ? 'painel' : 'painéis'}</span>
                                    </span>
                                    <span className="text-right font-mono text-sm text-brand-text md:text-left">{formatBRL(o.totalValue)}<span className="block text-xs text-brand-muted">{monthsOf(o)} {monthsOf(o) === 1 ? 'mês' : 'meses'}</span></span>
                                    <span><Badge tone={STATUS[o.status].tone}>{STATUS[o.status].label}</Badge></span>
                                    <span className={`truncate text-sm ${o.seller ? 'text-brand-text' : 'text-brand-neon'}`}>{o.seller?.name || 'Sem responsável'}</span>
                                    <span className="hidden font-mono text-sm text-brand-muted md:block">{formatDate(o.createdAt)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ============================ DETALHES ============================ */}
            <Sheet
                open={Boolean(selected)}
                onClose={() => setSelectedId(null)}
                eyebrow={selected ? `Pedido de ${formatDate(selected.createdAt)}` : undefined}
                title={selected?.user?.name || 'Pedido'}
                size="lg"
                footer={selected && <>
                    <Link to={`/crm/proposta/${selected.id}`} className={`${crmBtn.secondary} sm:mr-auto`}><FileText className="h-4 w-4" aria-hidden="true" /> Montar proposta no CRM</Link>
                    <button type="button" onClick={() => { try { downloadDealContract(toContract(selected)); } catch { addToast('Não foi possível gerar o contrato.', 'error'); } }} className={crmBtn.primary}>
                        <FileDown className="h-4 w-4" aria-hidden="true" /> Contrato em PDF
                    </button>
                </>}
            >
                {selected && (
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Situação" htmlFor="o-status">
                                <CustomSelect id="o-status" value={selected.status} disabled={saving} onChange={(v) => patch(selected, { status: v as OrderStatus }, 'Situação atualizada.')}
                                    options={(Object.keys(STATUS) as OrderStatus[]).map((s) => ({ value: s, label: STATUS[s].label }))} />
                            </Field>
                            <Field label="Responsável" htmlFor="o-seller">
                                <CustomSelect id="o-seller" value={selected.sellerId || ''} disabled={saving} onChange={(v) => patch(selected, { sellerId: v || null }, v ? 'Responsável definido.' : 'Pedido voltou para a fila.')}
                                    options={[{ value: '', label: 'Sem responsável (fila)' }, ...team.map((t) => ({ value: t.id, label: t.name }))]} />
                            </Field>
                        </div>

                        <dl className="grid grid-cols-1 gap-px border border-brand-border bg-brand-border sm:grid-cols-2">
                            {[
                                ['Empresa', companyOf(selected)],
                                ['CPF / CNPJ', selected.user?.document],
                                ['E-mail', selected.user?.email],
                                ['Telefone', selected.user?.phone],
                                ['Prazo', `${monthsOf(selected)} ${monthsOf(selected) === 1 ? 'mês' : 'meses'}`],
                                ['Valor do contrato', formatBRL(selected.totalValue)],
                            ].map(([k, v]) => (
                                <div key={k} className="bg-brand-surface p-3">
                                    <dt className="text-xs text-brand-muted">{k}</dt>
                                    <dd className="mt-1 truncate text-sm text-brand-text">{v || '—'}</dd>
                                </div>
                            ))}
                        </dl>

                        <div>
                            <p className="mb-2 text-sm text-brand-muted">Painéis ({selected.items?.length ?? 0}) · valores mensais</p>
                            <ul className="divide-y divide-brand-border border border-brand-border">
                                {(selected.items || []).map((item, i) => (
                                    <li key={item.id || i} className="flex items-center gap-3 px-4 py-2.5">
                                        <img src={item.panel?.images?.[0] || '/placeholder.svg'} alt="" className="h-10 w-14 shrink-0 bg-brand-background object-cover" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm text-brand-text">{item.panel?.name || 'Painel'}</span>
                                            <span className="block truncate text-xs text-brand-muted">{[item.panel?.city, item.panel?.state].filter(Boolean).join(' - ')}</span>
                                        </span>
                                        <span className="shrink-0 font-mono text-sm text-brand-text">{formatBRL(Number(item.priceSnapshot ?? 0))}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {selected.notes && (
                            <div>
                                <p className="mb-2 text-sm text-brand-muted">Observações do cliente</p>
                                <p className="whitespace-pre-wrap border border-brand-border p-4 text-sm leading-relaxed text-brand-text">{selected.notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </Sheet>
        </CrmPage>
    );
}
