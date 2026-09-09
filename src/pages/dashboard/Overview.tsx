import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    MonitorPlay, CheckCircle, XCircle, TrendingUp, BarChart2, 
    Loader2, Trophy, ShoppingCart, UserCircle2, ArrowRight, ReceiptText
} from 'lucide-react';
import { panelsService, PanelData } from '@/services/panels.service';
import { api } from '@/lib/axios';

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const formatImpacts = (num: number) => {
    if (num === 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1).replace('.', ',')} mi`;
    if (num >= 1000) return `${Math.floor(num / 1000)} mil`;
    return num.toString();
};

export function Overview() {
    const [panels, setPanels] = useState<PanelData[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [panelsData, ordersRes] = await Promise.all([
                    panelsService.getAllPanels().catch(() => []),
                    api.get('/orders').catch(() => ({ data: [] }))
                ]);
                
                setPanels(panelsData);
                setOrders(ordersRes.data || []);
            } catch (error) {
                console.error("Erro ao buscar dados da Visão Geral:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // ==========================================
    // MÉTRICAS DOS PAINÉIS
    // ==========================================
    const totalPanels = panels.length;
    const availablePanels = panels.filter(p => p.status === 'AVAILABLE').length;
    const occupiedPanels = panels.filter(p => p.status === 'OCCUPIED').length;

    const totalImpacts = panels.reduce((acc, curr) => {
        let val = curr.impacts;
        if (!val) return acc;
        if (typeof val === 'string') {
            const numericPart = parseFloat(val.replace(/[^0-9,.]/g, '').replace(',', '.'));
            if (isNaN(numericPart)) return acc;
            if (val.toLowerCase().includes('mil')) return acc + (numericPart * 1000);
            if (val.toLowerCase().includes('mi') && !val.toLowerCase().includes('mil')) return acc + (numericPart * 1000000);
            return acc + numericPart;
        }
        return acc + (Number(val) || 0);
    }, 0);

    // ==========================================
    // MÉTRICAS FINANCEIRAS E COMERCIAIS
    // ==========================================
    const completedOrders = orders.filter(o => o.status === 'COMPLETED');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.totalValue) || 0), 0);

    const sellerStatsMap = completedOrders.reduce((acc: Record<string, number>, order: any) => {
        const sellerName = String(order.seller?.name || 'Venda Direta / Site');
        const value = Number(order.totalValue) || 0;
        acc[sellerName] = (acc[sellerName] || 0) + value;
        return acc;
    }, {});

    const sellerStats = Object.entries(sellerStatsMap)
        .map(([name, totalValue]) => {
            const total = Number(totalValue) || 0; 
            return { name, total, percentage: totalRevenue > 0 ? (total / totalRevenue) * 100 : 0 };
        })
        .sort((a, b) => b.total - a.total);

    // ==========================================
    // TICKETS RECENTES (Últimos Pedidos)
    // ==========================================
    const recentTickets = [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5); // Exibe os 5 últimos pacotes gerados

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center h-full w-full">
                <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-10">
            
            {/* HEADER */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl md:text-3xl font-bold text-brand-text tracking-tight">Visão Geral</h1>
                <p className="text-sm text-brand-muted">Acompanhe as métricas de inventário e os últimos tickets de pedidos da plataforma.</p>
            </div>

            {/* METRICS GRID (PAINÉIS) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-brand-surface p-5 md:p-6 rounded-[24px] border border-brand-border shadow-sm flex flex-col justify-between h-36 md:h-40 transition-shadow hover:shadow-md">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] md:text-xs font-bold text-brand-muted uppercase tracking-widest">Painéis</span>
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                            <MonitorPlay className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-brand-text tracking-tight">{totalPanels}</h3>
                </div>

                <div className="bg-brand-surface p-5 md:p-6 rounded-[24px] border border-brand-border shadow-sm flex flex-col justify-between h-36 md:h-40 transition-shadow hover:shadow-md">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] md:text-xs font-bold text-brand-muted uppercase tracking-widest">Livres</span>
                        <div className="p-2 rounded-xl bg-[#25D366]/10 text-[#25D366]">
                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-brand-text tracking-tight">{availablePanels}</h3>
                </div>

                <div className="bg-brand-surface p-5 md:p-6 rounded-[24px] border border-brand-border shadow-sm flex flex-col justify-between h-36 md:h-40 transition-shadow hover:shadow-md">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] md:text-xs font-bold text-brand-muted uppercase tracking-widest">Ocupados</span>
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                            <XCircle className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-brand-text tracking-tight">{occupiedPanels}</h3>
                </div>

                <div className="bg-brand-surface p-5 md:p-6 rounded-[24px] border border-brand-border shadow-sm flex flex-col justify-between h-36 md:h-40 transition-shadow hover:shadow-md">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] md:text-xs font-bold text-brand-muted uppercase tracking-widest">Impactos</span>
                        <div className="p-2 rounded-xl bg-brand-neon/10 text-brand-neon">
                            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-brand-text tracking-tight">{formatImpacts(totalImpacts)}</h3>
                </div>
            </div>

            {/* RANKING & TICKETS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Ranking Comercial (2 Colunas) */}
                <div className="lg:col-span-2 bg-brand-surface p-6 md:p-8 rounded-[24px] border border-brand-border shadow-sm flex flex-col h-[400px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
                        <h2 className="text-base font-bold text-brand-text flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-brand-neon" />
                            Faturamento e Vendas (Status: Concluído)
                        </h2>
                        <span className="text-xs font-bold text-[#25D366] bg-[#25D366]/10 px-3 py-1.5 rounded-lg border border-[#25D366]/20 self-start sm:self-auto shrink-0">
                            Total: {formatCurrency(totalRevenue)}
                        </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {sellerStats.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-brand-border rounded-[16px] bg-brand-background/50">
                                <ReceiptText className="w-8 h-8 text-brand-muted/40 mb-2" />
                                <p className="text-sm font-medium text-brand-muted">Nenhum pacote foi finalizado (Ganho) ainda.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6 pb-2">
                                {sellerStats.map((seller, index) => (
                                    <div key={index} className="flex flex-col gap-2.5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-bold text-brand-text flex items-center gap-2">
                                                {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                                                {index > 0 && <span className="text-brand-muted font-black w-4 text-center">{index + 1}º</span>}
                                                {seller.name}
                                            </span>
                                            <span className="text-sm font-black text-brand-text">{formatCurrency(seller.total)}</span>
                                        </div>
                                        <div className="w-full bg-brand-background rounded-full h-2.5 overflow-hidden border border-brand-border/50">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${index === 0 ? 'bg-brand-neon shadow-[0_0_10px_rgba(255,94,0,0.3)]' : 'bg-brand-muted/60'}`}
                                                style={{ width: `${seller.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tickets de Pedidos Recentes (1 Coluna) */}
                <div className="lg:col-span-1 bg-brand-surface p-6 md:p-8 rounded-[24px] border border-brand-border shadow-sm flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <h2 className="text-base font-bold text-brand-text flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-brand-neon" /> Novos Tickets
                        </h2>
                        <Link to="/dashboard/pedidos" className="text-xs font-bold text-brand-neon hover:underline flex items-center gap-1">
                            Ver todos <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
                        {recentTickets.length === 0 ? (
                            <div className="h-full border-2 border-dashed border-brand-border rounded-[16px] flex flex-col items-center justify-center bg-brand-background/50 text-center px-4">
                                <ShoppingCart className="w-8 h-8 text-brand-muted/40 mb-2" />
                                <p className="text-sm font-medium text-brand-muted">Nenhum pedido recebido.</p>
                            </div>
                        ) : (
                            recentTickets.map(order => (
                                <Link 
                                    to="/dashboard/pedidos" 
                                    key={order.id} 
                                    className="bg-brand-background p-4 rounded-xl border border-brand-border hover:border-brand-neon/50 transition-colors flex flex-col gap-2 group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <h4 className="text-sm font-bold text-brand-text line-clamp-1">{order.user?.name || 'Cliente'}</h4>
                                            <span className="text-[10px] text-brand-muted">ID: PKG-{order.id.substring(0, 6)}</span>
                                        </div>
                                        {order.status === 'PENDING' ? (
                                            <span className="text-[9px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded shrink-0">Novo</span>
                                        ) : !order.sellerId ? (
                                            <span className="text-[9px] font-black uppercase bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded shrink-0">Aguardando</span>
                                        ) : (
                                            <span className="text-[9px] font-black uppercase text-brand-neon flex items-center gap-1 shrink-0">
                                                <UserCircle2 className="w-3 h-3"/> {order.seller?.name?.split(' ')[0]}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-end mt-1">
                                        <span className="text-xs text-brand-muted">{order.items?.length || 0} painéis</span>
                                        <span className="text-sm font-black text-[#25D366]">{formatCurrency(order.totalValue)}</span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}