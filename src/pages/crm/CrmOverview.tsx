import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Circle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/axios';
import { toDateKey } from '@/lib/date';
import { crmService, CrmDeal, CrmMetrics } from '@/services/crm.service';
import { agendaService, Task } from '@/services/agenda.service';
import { Badge, CrmPage, EmptyState, Panel, Skeleton, Stat } from '@/components/crm/ui';
import { crmBtn, formatBRL, formatDate } from '@/components/crm/tokens';

interface Order {
    id: string;
    createdAt: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    totalValue: number;
    sellerId?: string | null;
    seller?: { id: string; name: string } | null;
    user?: { name?: string; phone?: string; companyName?: string; company?: { corporateName?: string } | null } | null;
    items?: unknown[];
}

/** Item da fila: orçamento do mapa (deal) ou pedido do catálogo (order). */
type QueueItem =
    | { kind: 'deal'; id: string; createdAt: string; name: string; detail: string; value: number }
    | { kind: 'order'; id: string; createdAt: string; name: string; detail: string; value: number };

const STALE_DAYS = 7;
const daysSince = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
const ago = (date: string) => { const d = daysSince(date); return d === 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`; };

const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
};

export function CrmOverview() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [metrics, setMetrics] = useState<CrmMetrics | null>(null);
    const [deals, setDeals] = useState<CrmDeal[]>([]);
    const [queueDeals, setQueueDeals] = useState<CrmDeal[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        // Cada bloco carrega de forma independente: uma falha não apaga o resto da tela
        const [m, d, q, o, t] = await Promise.allSettled([
            crmService.getMetrics(),
            crmService.getDeals(),
            crmService.getGlobalDeals(),
            api.get<Order[]>('/orders').then((r) => r.data),
            agendaService.getTasks(),
        ]);
        if (m.status === 'fulfilled') setMetrics(m.value);
        if (d.status === 'fulfilled') setDeals(d.value);
        if (q.status === 'fulfilled') setQueueDeals(q.value);
        if (o.status === 'fulfilled') setOrders(o.value);
        if (t.status === 'fulfilled') setTasks(t.value);
        if ([m, d, q, o, t].some((r) => r.status === 'rejected')) addToast('Parte dos dados não carregou. Atualize a página.', 'error');
        setLoading(false);
    }, [addToast]);

    useEffect(() => { load(); }, [load]);

    const openOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'APPROVED');

    const queue: QueueItem[] = useMemo(() => [
        ...queueDeals.map((deal) => ({
            kind: 'deal' as const,
            id: deal.id,
            createdAt: deal.createdAt,
            name: deal.client?.name || 'Cliente do site',
            detail: deal.title,
            value: Number(deal.expectedValue),
        })),
        ...openOrders.filter((o) => !o.sellerId).map((order) => ({
            kind: 'order' as const,
            id: order.id,
            createdAt: order.createdAt,
            name: order.user?.name || 'Cliente do site',
            detail: `Pedido do catálogo · ${order.items?.length ?? 0} ${order.items?.length === 1 ? 'painel' : 'painéis'}`,
            value: Number(order.totalValue),
        })),
    ].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [queueDeals, openOrders]);

    const myOrders = openOrders.filter((o) => o.sellerId === user?.id);
    const openDeals = deals.filter((d) => d.status === 'OPEN');
    const stale = openDeals.filter((d) => daysSince(d.updatedAt) > STALE_DAYS).slice(0, 5);
    const todayKey = toDateKey(new Date());
    const todayTasks = tasks.filter((t) => t.date.startsWith(todayKey)).sort((a, b) => a.time.localeCompare(b.time));

    const claim = async (item: QueueItem) => {
        if (!user?.id) return;
        try {
            setClaiming(item.id);
            if (item.kind === 'deal') await crmService.claimDeal(item.id);
            else await api.patch(`/orders/${item.id}`, { sellerId: user.id });
            addToast(`${item.name} agora está com você.`, 'success');
            load();
        } catch (error: unknown) {
            addToast((error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Não foi possível assumir.', 'error');
        } finally {
            setClaiming(null);
        }
    };

    const toggleTask = async (task: Task) => {
        const next = task.status === 'completed' ? 'pending' : 'completed';
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
        try {
            await agendaService.toggleTaskStatus(task.id, next);
        } catch {
            setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
            addToast('Não foi possível atualizar a tarefa.', 'error');
        }
    };

    return (
        <CrmPage
            eyebrow={new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
            title={`${greeting()}, ${user?.name?.split(' ')[0] ?? ''}`}
            description="Fila de atendimento, suas negociações e a agenda de hoje."
            actions={<Link to="/crm/pipeline" className={crmBtn.secondary}>Abrir funil <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
        >
            {/* ============================ NÚMEROS ============================ */}
            <div className="grid grid-cols-2 gap-px border border-brand-border bg-brand-border lg:grid-cols-4 [&>*]:border-0">
                {loading && !metrics ? (
                    [0, 1, 2, 3].map((i) => <div key={i} className="bg-brand-surface p-5"><Skeleton className="h-3 w-24" /><Skeleton className="mt-6 h-7 w-32" /></div>)
                ) : (
                    <>
                        <Stat label="Em negociação" value={formatBRL(metrics?.totalExpectedValue ?? 0)} hint={`${metrics?.totalActiveDeals ?? 0} oportunidades abertas`} accent />
                        <Stat label="Ganhos" value={formatBRL(metrics?.totalWonValue ?? 0)} hint="Negócios marcados como ganhos" />
                        <Stat label="Na fila" value={queue.length} hint="Leads e pedidos sem consultor" />
                        <Stat label="Clientes" value={metrics?.totalClients ?? 0} hint="Na sua carteira" />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <div className="flex flex-col gap-6">
                    {/* ============================ FILA ============================ */}
                    <Panel title="Fila de atendimento" action={<Badge tone={queue.length ? 'accent' : 'muted'}>{queue.length}</Badge>}>
                        {loading ? (
                            <div className="flex flex-col gap-2 p-5">{[0, 1].map((i) => <Skeleton key={i} className="h-14" />)}</div>
                        ) : queue.length === 0 ? (
                            <p className="p-5 text-sm text-brand-muted">Nenhum orçamento esperando consultor. Os pedidos do site aparecem aqui assim que chegam.</p>
                        ) : (
                            <ul className="divide-y divide-brand-border">
                                {queue.map((item) => (
                                    <li key={`${item.kind}-${item.id}`} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="truncate font-medium text-brand-text">{item.name}</span>
                                                <Badge tone="muted">{item.kind === 'deal' ? 'Mapa' : 'Catálogo'}</Badge>
                                            </div>
                                            <p className="mt-1 truncate text-sm text-brand-muted">{item.detail} · {ago(item.createdAt)}</p>
                                        </div>
                                        <span className="font-mono text-sm text-brand-text">{formatBRL(item.value)}</span>
                                        <button type="button" onClick={() => claim(item)} disabled={claiming === item.id} className={crmBtn.primary}>
                                            {claiming === item.id ? 'Assumindo…' : 'Assumir'}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    {/* ============================ PEDIDOS COMIGO ============================ */}
                    <Panel title="Pedidos do catálogo com você" action={<Link to="/crm/propostas" className="text-sm text-brand-muted hover:text-brand-text">Propostas</Link>}>
                        {loading ? (
                            <div className="p-5"><Skeleton className="h-14" /></div>
                        ) : myOrders.length === 0 ? (
                            <p className="p-5 text-sm text-brand-muted">Nenhum pedido aberto atribuído a você.</p>
                        ) : (
                            <ul className="divide-y divide-brand-border">
                                {myOrders.map((order) => (
                                    <li key={order.id}>
                                        <Link to={`/crm/proposta/${order.id}`} className="group flex flex-col gap-2 px-5 py-4 hover:bg-brand-background sm:flex-row sm:items-center">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium text-brand-text group-hover:text-brand-neon">{order.user?.name || 'Cliente'}</p>
                                                <p className="mt-1 truncate text-sm text-brand-muted">
                                                    {order.user?.company?.corporateName || order.user?.companyName || 'Sem empresa'} · {formatDate(order.createdAt)}
                                                </p>
                                            </div>
                                            <Badge tone={order.status === 'APPROVED' ? 'accent' : 'neutral'}>{order.status === 'APPROVED' ? 'Proposta enviada' : 'Novo'}</Badge>
                                            <span className="font-mono text-sm text-brand-text">{formatBRL(order.totalValue)}</span>
                                            <ArrowRight className="hidden h-4 w-4 text-brand-muted group-hover:text-brand-neon sm:block" aria-hidden="true" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>

                <div className="flex flex-col gap-6">
                    {/* ============================ HOJE ============================ */}
                    <Panel title="Hoje na agenda" action={<Link to="/crm/agenda" className="text-sm text-brand-muted hover:text-brand-text">Agenda</Link>}>
                        {loading ? (
                            <div className="p-5"><Skeleton className="h-10" /></div>
                        ) : todayTasks.length === 0 ? (
                            <div className="p-5">
                                <p className="text-sm text-brand-muted">Nada marcado para hoje.</p>
                                <Link to="/crm/agenda" className={`mt-4 ${crmBtn.secondary}`}>Marcar compromisso</Link>
                            </div>
                        ) : (
                            <ul className="divide-y divide-brand-border">
                                {todayTasks.map((task) => {
                                    const done = task.status === 'completed';
                                    return (
                                        <li key={task.id} className="flex items-center gap-3 px-5 py-3">
                                            <button type="button" onClick={() => toggleTask(task)} aria-pressed={done} aria-label={done ? `Reabrir ${task.title}` : `Concluir ${task.title}`} className="text-brand-muted hover:text-brand-neon">
                                                {done ? <Check className="h-5 w-5 text-brand-neon" /> : <Circle className="h-5 w-5" strokeWidth={1.5} />}
                                            </button>
                                            <span className="font-mono text-sm text-brand-muted">{task.time}</span>
                                            <div className="min-w-0 flex-1">
                                                <p className={`truncate text-sm ${done ? 'text-brand-muted line-through' : 'text-brand-text'}`}>{task.title}</p>
                                                {task.client && <p className="truncate text-xs text-brand-muted">{task.client}</p>}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Panel>

                    {/* ============================ PARADOS ============================ */}
                    <Panel title={`Parados há mais de ${STALE_DAYS} dias`}>
                        {loading ? (
                            <div className="p-5"><Skeleton className="h-10" /></div>
                        ) : stale.length === 0 ? (
                            <p className="p-5 text-sm text-brand-muted">Nenhuma oportunidade parada. Bom ritmo.</p>
                        ) : (
                            <ul className="divide-y divide-brand-border">
                                {stale.map((deal) => (
                                    <li key={deal.id}>
                                        <Link to="/crm/pipeline" className="flex items-center gap-3 px-5 py-3 hover:bg-brand-background">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm text-brand-text">{deal.title}</p>
                                                <p className="truncate text-xs text-brand-muted">{deal.client?.name}</p>
                                            </div>
                                            <Badge tone="danger">{daysSince(deal.updatedAt)} dias</Badge>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>
            </div>

            {!loading && !metrics && !queue.length && !deals.length && (
                <EmptyState title="Não foi possível carregar o painel" action={<button type="button" onClick={load} className={crmBtn.secondary}>Tentar de novo</button>} />
            )}
        </CrmPage>
    );
}
