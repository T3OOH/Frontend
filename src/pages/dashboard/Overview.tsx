import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/axios';
import { panelsService, PanelData } from '@/services/panels.service';
import { crmService, CrmDeal } from '@/services/crm.service';
import { useAuth } from '@/contexts/AuthContext';
import { parseImpacts, formatImpacts } from '@/lib/impacts';
import { Badge, CrmPage, Panel, Skeleton, Stat } from '@/components/app/ui';
import { crmBtn, formatBRL, formatDate } from '@/components/app/tokens';

interface Order {
    id: string;
    createdAt: string;
    status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
    totalValue: number;
    sellerId?: string | null;
    seller?: { id: string; name: string } | null;
    user?: { name?: string } | null;
    items?: unknown[];
}

const ORDER_LABEL: Record<Order['status'], string> = { PENDING: 'Novo', APPROVED: 'Proposta enviada', COMPLETED: 'Fechado', REJECTED: 'Perdido' };

export function Overview() {
    const { user } = useAuth();
    const [panels, setPanels] = useState<PanelData[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [deals, setDeals] = useState<CrmDeal[]>([]);
    const [queue, setQueue] = useState<CrmDeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState<string[]>([]);

    useEffect(() => {
        (async () => {
            const [p, o, d, q] = await Promise.allSettled([
                panelsService.getAllPanels(),
                api.get<Order[]>('/orders').then((r) => r.data),
                crmService.getDeals(),
                crmService.getGlobalDeals(),
            ]);
            const errors: string[] = [];
            if (p.status === 'fulfilled') setPanels(p.value); else errors.push('painéis');
            if (o.status === 'fulfilled') setOrders(o.value); else errors.push('pedidos');
            if (d.status === 'fulfilled') setDeals(d.value); else errors.push('negócios do CRM');
            if (q.status === 'fulfilled') setQueue(q.value);
            setFailed(errors);
            setLoading(false);
        })();
    }, []);

    const stats = useMemo(() => {
        const available = panels.filter((p) => p.status === 'AVAILABLE');
        const occupied = panels.filter((p) => p.status === 'OCCUPIED' || p.status === 'RESERVED');
        const closedOrders = orders.filter((o) => o.status === 'COMPLETED');
        const wonDeals = deals.filter((d) => d.status === 'WON');
        const openOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'APPROVED');
        const openDeals = deals.filter((d) => d.status === 'OPEN');

        // Faturamento por responsável: pedidos fechados do catálogo + negócios ganhos no CRM
        const bySeller = new Map<string, number>();
        closedOrders.forEach((o) => bySeller.set(o.seller?.name || 'Sem responsável', (bySeller.get(o.seller?.name || 'Sem responsável') ?? 0) + Number(o.totalValue)));
        wonDeals.forEach((d) => bySeller.set(d.seller?.name || 'Sem responsável', (bySeller.get(d.seller?.name || 'Sem responsável') ?? 0) + Number(d.expectedValue)));
        const revenue = [...bySeller.values()].reduce((a, b) => a + b, 0);
        const ranking = [...bySeller.entries()].map(([name, total]) => ({ name, total, share: revenue ? total / revenue : 0 })).sort((a, b) => b.total - a.total);

        return {
            total: panels.length,
            available: available.length,
            occupied: occupied.length,
            occupancy: panels.length ? occupied.length / panels.length : 0,
            impacts: available.reduce((sum, p) => sum + parseImpacts(p.impacts), 0),
            revenue,
            ranking,
            pipeline: openOrders.reduce((s, o) => s + Number(o.totalValue), 0) + openDeals.reduce((s, d) => s + Number(d.expectedValue), 0),
            unassigned: openOrders.filter((o) => !o.sellerId).length + queue.length,
        };
    }, [panels, orders, deals, queue]);

    const recent = [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6);

    return (
        <CrmPage
            eyebrow="Gestão"
            title={`Visão geral${user?.name ? ` · ${user.name.split(' ')[0]}` : ''}`}
            description="Inventário da rede, vendas fechadas e o que está esperando atendimento."
            actions={<Link to="/dashboard/paineis/novo" className={crmBtn.primary}>Novo painel</Link>}
        >
            {failed.length > 0 && (
                <div role="alert" className="border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
                    Não foi possível carregar: {failed.join(', ')}. Os números abaixo podem estar incompletos.
                </div>
            )}

            <div className="grid grid-cols-2 gap-px border border-brand-border bg-brand-border lg:grid-cols-4 [&>*]:border-0">
                {loading ? [0, 1, 2, 3].map((i) => <div key={i} className="bg-brand-surface p-5"><Skeleton className="h-3 w-20" /><Skeleton className="mt-6 h-7 w-28" /></div>) : <>
                    <Stat label="Faturado" value={formatBRL(stats.revenue)} hint="Pedidos fechados e negócios ganhos" accent />
                    <Stat label="Em negociação" value={formatBRL(stats.pipeline)} hint="Pedidos e negócios abertos" />
                    <Stat label="Ocupação" value={`${Math.round(stats.occupancy * 100)}%`} hint={`${stats.occupied} de ${stats.total} painéis`} />
                    <Stat label="Impactos/dia livres" value={stats.impacts ? formatImpacts(stats.impacts) : '—'} hint={`${stats.available} ${stats.available === 1 ? "painel disponível" : "painéis disponíveis"}`} />
                </>}
            </div>

            {!loading && stats.unassigned > 0 && (
                <Link to="/dashboard/pedidos" className="flex items-center justify-between gap-4 border border-brand-neon/40 bg-brand-neon/10 px-5 py-4 text-sm text-brand-text hover:border-brand-neon">
                    <span><span className="font-mono text-brand-neon">{stats.unassigned}</span> {stats.unassigned === 1 ? 'pedido ou lead está' : 'pedidos ou leads estão'} sem responsável.</span>
                    <span className="flex items-center gap-1 text-brand-neon">Distribuir <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                </Link>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <Panel title="Faturamento por responsável" bodyClassName="p-5">
                    {loading ? <Skeleton className="h-40" /> : stats.ranking.length === 0 ? (
                        <p className="text-sm text-brand-muted">Nenhuma venda fechada ainda. Pedidos marcados como fechados e negócios ganhos no CRM entram aqui.</p>
                    ) : (
                        <ol className="flex flex-col gap-5">
                            {stats.ranking.map((r, i) => (
                                <li key={r.name}>
                                    <div className="flex items-baseline justify-between gap-3 text-sm">
                                        <span className="truncate text-brand-text"><span className="mr-3 font-mono text-brand-muted">{String(i + 1).padStart(2, '0')}</span>{r.name}</span>
                                        <span className="shrink-0 font-mono text-brand-text">{formatBRL(r.total)}</span>
                                    </div>
                                    <div className="mt-2 h-1.5 bg-brand-background" aria-hidden="true">
                                        <div className={`h-full ${i === 0 ? 'bg-brand-neon' : 'bg-brand-muted/60'}`} style={{ width: `${Math.max(2, r.share * 100)}%` }} />
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </Panel>

                <Panel title="Pedidos recentes" action={<Link to="/dashboard/pedidos" className="text-sm text-brand-muted hover:text-brand-text">Ver todos</Link>}>
                    {loading ? <div className="p-5"><Skeleton className="h-40" /></div> : recent.length === 0 ? (
                        <p className="p-5 text-sm text-brand-muted">Nenhum pedido recebido ainda.</p>
                    ) : (
                        <ul className="divide-y divide-brand-border">
                            {recent.map((o) => (
                                <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm text-brand-text">{o.user?.name || 'Cliente'}</p>
                                        <p className="truncate text-xs text-brand-muted">{formatDate(o.createdAt)} · {o.seller?.name || 'sem responsável'}</p>
                                    </div>
                                    <Badge tone={o.status === 'COMPLETED' ? 'success' : o.status === 'APPROVED' ? 'accent' : o.status === 'REJECTED' ? 'muted' : 'neutral'}>{ORDER_LABEL[o.status]}</Badge>
                                    <span className="font-mono text-sm text-brand-text">{formatBRL(o.totalValue)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>
        </CrmPage>
    );
}
