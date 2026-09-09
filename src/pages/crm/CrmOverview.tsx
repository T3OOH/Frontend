import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/axios';
import { 
    Target, DollarSign, TrendingUp, Users, Clock, 
    CheckCircle2, Loader2, ArrowRight, Briefcase 
} from 'lucide-react';

const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
};

export function CrmOverview() {
    const { user } = useAuth();
    const { addToast } = useToast();
    
    // =========================================================
    // ESTADOS
    // =========================================================
    const [metrics, setMetrics] = useState({
        totalExpectedValue: 0,
        totalActiveDeals: 0,
        totalClients: 0,
        totalWonValue: 0
    });
    
    const [myDeals, setMyDeals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // =========================================================
    // EFEITOS E BUSCA DE DADOS
    // =========================================================
    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        if (!user?.id) return;
        
        try {
            setIsLoading(true);
            const ordersRes = await api.get('/orders');

            // 1. Agrupamento de Pacotes (Igual ao Orders.tsx)
            const groupedMap = new Map();

            ordersRes.data.forEach((order: any) => {
                const dateKey = new Date(order.createdAt).toISOString().substring(0, 16);
                const groupKey = `${order.userId}-${dateKey}`;

                const startDate = order.startDate ? new Date(order.startDate) : new Date();
                const endDate = order.endDate ? new Date(order.endDate) : new Date();
                const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); 
                const months = Math.max(1, Math.round(diffDays / 30));

                if (!groupedMap.has(groupKey)) {
                    groupedMap.set(groupKey, {
                        id: order.id, 
                        createdAt: order.createdAt,
                        clientName: order.user?.name || 'Cliente Sem Nome',
                        clientPhone: order.user?.phone || 'Não informado',
                        company: order.company?.corporateName || order.user?.companyName || '',
                        status: order.status, 
                        expectedValue: order.totalValue,
                        months: months,
                        assignedTo: order.seller ? { id: order.seller.id, name: order.seller.name } : null,
                        items: order.items || []
                    });
                } else {
                    const group = groupedMap.get(groupKey);
                    group.expectedValue += order.totalValue;
                    if (order.items) {
                        group.items = [...group.items, ...order.items];
                    }
                }
            });

            const allPackages = Array.from(groupedMap.values());

            // 2. Filtra APENAS os pacotes atribuídos ao usuário logado (O Comercial)
            const myAssignedPackages = allPackages.filter(pkg => pkg.assignedTo?.id === user.id);

            // 3. Separa Ativos (Em negociação) de Concluídos (Ganhos)
            const activeDeals = myAssignedPackages.filter(pkg => pkg.status !== 'COMPLETED' && pkg.status !== 'REJECTED');
            const wonDeals = myAssignedPackages.filter(pkg => pkg.status === 'COMPLETED');

            // 4. Calcula as Métricas da Tela
            const totalExpectedValue = activeDeals.reduce((sum, pkg) => sum + pkg.expectedValue, 0);
            const totalWonValue = wonDeals.reduce((sum, pkg) => sum + pkg.expectedValue, 0);
            
            // Calcula clientes únicos baseados no telefone
            const uniqueClients = new Set(myAssignedPackages.map(pkg => pkg.clientPhone)).size;

            // Ordena os ativos pelos mais recentes
            activeDeals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setMetrics({
                totalExpectedValue,
                totalWonValue,
                totalActiveDeals: activeDeals.length,
                totalClients: uniqueClients
            });
            
            setMyDeals(activeDeals);

        } catch (error: any) {
            console.error("Erro ao carregar dados do CRM:", error);
            addToast("Falha ao carregar a sua fila de pedidos.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const statCards = [
        { title: 'Pipeline Ativo (Em aberto)', value: formatCurrency(metrics.totalExpectedValue), desc: 'Valor total em negociação', icon: Target, color: 'text-[#FF5E00]', bg: 'bg-[#FF5E00]/10' },
        { title: 'Negócios Fechados (Ganhos)', value: formatCurrency(metrics.totalWonValue), desc: 'Seu faturamento consolidado', icon: DollarSign, color: 'text-[#25D366]', bg: 'bg-[#25D366]/10' },
        { title: 'Oportunidades Abertas', value: metrics.totalActiveDeals, desc: 'Pacotes no seu funil', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { title: 'Sua Carteira de Clientes', value: metrics.totalClients, desc: 'Total de clientes únicos', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' }
    ];

    return (
        <div className="w-full h-full flex flex-col relative gap-6 pb-10 max-w-7xl mx-auto">

            {/* ========================================================= */}
            {/* VIEWPORT: DESKTOP E MOBILE COMPARTILHADO                  */}
            {/* ========================================================= */}
            
            <div className="flex flex-col gap-1 px-4 lg:px-0">
                <h1 className="text-2xl md:text-3xl font-bold text-brand-text tracking-tight">Olá, {user?.name?.split(' ')[0]}!</h1>
                <p className="text-sm text-brand-muted font-medium">Aqui está a sua fila de negociações delegadas pela gestão.</p>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 px-4 lg:px-0">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-brand-surface p-4 lg:p-6 rounded-[24px] border border-brand-border shadow-sm hover:shadow-md transition-all h-[140px] lg:h-auto flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2 lg:mb-4">
                            <div className={`p-2.5 lg:p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${stat.color}`} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-[10px] lg:text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1 lg:mb-1.5 line-clamp-2">{stat.title}</h3>
                            <p className="text-xl lg:text-2xl font-black text-brand-text tracking-tight mb-0 lg:mb-2">{stat.value}</p>
                            <p className="hidden lg:block text-[10px] text-brand-muted/80 uppercase tracking-wider font-bold">{stat.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px] px-4 lg:px-0">
                
                {/* FILA DE PEDIDOS DO COMERCIAL */}
                <div className="lg:col-span-2 bg-brand-surface rounded-[24px] border border-brand-border shadow-sm flex flex-col overflow-hidden transition-colors h-[500px]">
                    <div className="p-5 lg:p-6 border-b border-brand-border flex justify-between items-center bg-brand-background/50 shrink-0">
                        <div>
                            <h2 className="text-[15px] lg:text-lg font-bold text-brand-text flex items-center gap-2">
                                <Briefcase className="w-4 h-4 lg:w-5 lg:h-5 text-brand-neon" /> Sua Fila de Atendimento
                            </h2>
                            <p className="hidden lg:block text-xs text-brand-muted font-medium mt-1">Pacotes atribuídos a você aguardando negociação.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-2.5 w-2.5 lg:h-3 lg:w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 lg:h-3 lg:w-3 bg-brand-neon"></span>
                            </span>
                            <span className="text-[9px] lg:text-xs font-bold text-brand-neon uppercase tracking-widest">Ao Vivo</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 bg-brand-background/30 flex flex-col gap-4">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
                            </div>
                        ) : myDeals.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-brand-muted">
                                <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
                                <p className="font-medium text-sm">Nenhum pacote pendente na sua fila.</p>
                            </div>
                        ) : (
                            myDeals.map(deal => (
                                <Link 
                                    to={`/dashboard/crm/proposta/${deal.id}`} 
                                    key={deal.id} 
                                    className="p-5 rounded-2xl border bg-brand-surface border-brand-border hover:border-brand-neon/60 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                                >
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-sm font-bold text-brand-text group-hover:text-brand-neon transition-colors">{deal.clientName}</span>
                                            <span className="text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20">
                                                Aberto
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-brand-muted font-medium">
                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(deal.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="font-bold text-brand-text">{formatCurrency(deal.expectedValue)}</span>
                                            <span>({deal.items?.length || 0} Painéis)</span>
                                        </div>
                                    </div>

                                    <div className="mt-2 lg:mt-0 flex w-full lg:w-auto">
                                        <button className="w-full lg:w-auto bg-brand-background text-brand-text border border-brand-border group-hover:bg-brand-neon group-hover:text-black group-hover:border-brand-neon px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm">
                                            Analisar Proposta <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* PRÓXIMOS PASSOS */}
                <div className="lg:col-span-1 bg-brand-surface rounded-[24px] border border-brand-border shadow-sm flex flex-col transition-colors h-[500px]">
                    <div className="p-5 lg:p-6 border-b border-brand-border flex justify-between items-center bg-brand-background/50 shrink-0">
                        <h2 className="text-[15px] lg:text-lg font-bold text-brand-text">Próximos Passos</h2>
                        <span className="bg-brand-neon/10 text-brand-neon text-[9px] lg:text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-widest border border-brand-neon/20">Hoje</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 text-center bg-brand-background/30">
                        <CheckCircle2 className="w-10 h-10 lg:w-12 lg:h-12 text-brand-muted opacity-30 mb-3 lg:mb-4" />
                        <p className="text-xs lg:text-sm font-medium text-brand-muted mb-5 lg:mb-6">Nenhuma tarefa pendente para hoje.</p>
                        <button className="w-full py-3 rounded-xl border border-brand-border text-xs lg:text-sm font-bold text-brand-text hover:text-brand-neon hover:border-brand-neon/50 bg-brand-background active:bg-brand-surface transition-colors shadow-sm">
                            + Adicionar Lembrete
                        </button>
                    </div>
                </div>

            </div>
            
            {/* Spacer Mobile */}
            <div className="h-[50px] w-full shrink-0 pointer-events-none lg:hidden" />
        </div>
    );
}