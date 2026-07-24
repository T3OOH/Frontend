import { useState, useEffect } from 'react';
import { Target, DollarSign, TrendingUp, Users, Clock, CheckCircle2, ArrowRight, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { crmService } from '@/services/crm.service';
import { useNavigate } from 'react-router-dom';

export function CrmOverview() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    
    const [metrics, setMetrics] = useState({
        totalExpectedValue: 0,
        totalActiveDeals: 0,
        totalClients: 0,
        totalWonValue: 0
    });
    
    const [globalDeals, setGlobalDeals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [claimingId, setClaimingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
        // Polling simples a cada 10 segundos para atualizar a fila de pedidos
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [metricsData, dealsData] = await Promise.all([
                crmService.getMetrics().catch(() => null),
                crmService.getGlobalDeals()
            ]);
            if (metricsData) setMetrics(metricsData);
            if (dealsData) setGlobalDeals(dealsData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClaimDeal = async (dealId: string) => {
        try {
            setClaimingId(dealId);
            await crmService.claimDeal(dealId);
            addToast('Pedido assumido! Redirecionando para o chat...', 'success');
            navigate(`/crm/chat?dealId=${dealId}`); // Navega para o chat com o ID do pedido
        } catch (error: any) {
            addToast(error.response?.data?.error || 'Erro ao assumir pedido.', 'error');
            fetchData(); // Recarrega a fila caso alguém já tenha pego
        } finally {
            setClaimingId(null);
        }
    };

    const handleOpenChat = (dealId: string) => {
        navigate(`/crm/chat?dealId=${dealId}`);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Cards de métricas superiores (Mantidos iguais ao seu design)
    const statCards = [
        { title: 'Pipeline Ativo (Em aberto)', value: formatCurrency(metrics.totalExpectedValue), desc: 'Valor total em negociação', icon: Target, color: 'text-[#FF5E00]', bg: 'bg-[#FF5E00]/10' },
        { title: 'Negócios Fechados (Ganhos)', value: formatCurrency(metrics.totalWonValue), desc: 'Faturamento consolidado', icon: DollarSign, color: 'text-[#25D366]', bg: 'bg-[#25D366]/10' },
        { title: 'Oportunidades Abertas', value: metrics.totalActiveDeals, desc: 'No funil de vendas', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { title: 'Carteira de Clientes', value: metrics.totalClients, desc: 'Total cadastrados', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' }
    ];

    return (
        <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto w-full">
            {/* SAUDAÇÃO */}
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Olá, {user?.name?.split(' ')[0]}! 👋</h1>
                    <p className="text-sm text-brand-muted">Aqui está o resumo da sua performance comercial de hoje.</p>
                </div>
            </div>

            {/* CARDS SUPERIORES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <div key={i} className="glass-panel p-5 rounded-2xl border border-brand-border/40 hover:border-brand-border transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>
                        <h3 className="text-xs font-semibold text-brand-muted mb-1">{stat.title}</h3>
                        <p className="text-2xl font-black text-white tracking-tight mb-1">{stat.value}</p>
                        <p className="text-[10px] text-brand-muted/70 uppercase tracking-wider font-semibold">{stat.desc}</p>
                    </div>
                ))}
            </div>

            {/* ÁREA PRINCIPAL: FILA DE PEDIDOS & PRÓXIMOS PASSOS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px]">
                
                {/* SUBSTITUTO DA EVOLUÇÃO DE VENDAS: FILA DE PEDIDOS GLOBAL */}
                <div className="lg:col-span-2 glass-panel rounded-2xl border border-brand-border/40 flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-brand-border/40 flex justify-between items-center bg-[#0A0A0B]/50">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-brand-neon" /> Fila de Pedidos (Pool)
                            </h2>
                            <p className="text-xs text-brand-muted mt-1">Pedidos de orçamento chegando em tempo real.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-neon"></span>
                            </span>
                            <span className="text-xs font-bold text-brand-neon uppercase tracking-widest">Ao Vivo</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#0A0A0B]/20">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
                            </div>
                        ) : globalDeals.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-brand-muted">
                                <Users className="w-12 h-12 mb-3 opacity-20" />
                                <p>A fila está vazia no momento.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {globalDeals.map(deal => {
                                    const isUnassigned = !deal.sellerId;
                                    const isMine = deal.sellerId === user?.id;

                                    return (
                                        <div key={deal.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${isUnassigned ? 'bg-brand-surface/40 border-brand-neon/30 hover:border-brand-neon/60' : isMine ? 'bg-[#25D366]/5 border-[#25D366]/20' : 'bg-[#0A0A0B] border-brand-border/30 opacity-75'}`}>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-white">{deal.client?.name}</span>
                                                    {!isUnassigned && (
                                                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest ${isMine ? 'bg-[#25D366]/20 text-[#25D366]' : 'bg-brand-surface text-brand-muted'}`}>
                                                            {isMine ? 'Seu Atendimento' : `Com ${deal.seller?.name}`}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-brand-muted">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(deal.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span className="font-medium text-brand-text">{formatCurrency(deal.expectedValue)}</span>
                                                </div>
                                            </div>

                                            <div>
                                                {isUnassigned ? (
                                                    <button 
                                                        onClick={() => handleClaimDeal(deal.id)}
                                                        disabled={claimingId === deal.id}
                                                        className="w-full sm:w-auto bg-brand-neon hover:bg-[#e05300] text-black px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(255,94,0,0.2)] flex items-center justify-center gap-2"
                                                    >
                                                        {claimingId === deal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Atender Agora</>}
                                                    </button>
                                                ) : isMine ? (
                                                    <button 
                                                        onClick={() => handleOpenChat(deal.id)}
                                                        className="w-full sm:w-auto bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <ArrowRight className="w-4 h-4" /> Abrir Chat
                                                    </button>
                                                ) : (
                                                    <div className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold text-brand-muted border border-brand-border/30 flex items-center justify-center bg-[#0A0A0B] cursor-not-allowed">
                                                        Em Atendimento
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* PRÓXIMOS PASSOS (Mantido do seu design) */}
                <div className="glass-panel rounded-2xl border border-brand-border/40 flex flex-col">
                    <div className="p-5 border-b border-brand-border/40 flex justify-between items-center bg-[#0A0A0B]/50">
                        <h2 className="text-lg font-bold text-white">Próximos Passos</h2>
                        <span className="bg-[#FF5E00]/20 text-[#FF5E00] text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest">Hoje</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <CheckCircle2 className="w-12 h-12 text-brand-border mb-3" />
                        <p className="text-sm text-brand-muted mb-6">Nenhuma tarefa pendente para hoje.</p>
                        <button className="w-full py-2.5 rounded-xl border border-brand-border/60 text-sm font-medium text-brand-text hover:text-white hover:bg-brand-surface transition-colors">
                            + Adicionar Lembrete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}