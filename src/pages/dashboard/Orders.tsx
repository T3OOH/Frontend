import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Loader2, Calendar, MapPin, ReceiptText } from 'lucide-react';
import { ordersService, OrderData, OrderStatus } from '@/services/orders.service';
import { useToast } from '@/contexts/ToastContext';
import { CustomSelect } from '@/components/CustomSelect';

/**
 * Componente principal de Gestao de Pedidos.
 * Implementa arquitetura responsiva com Viewports separados (Desktop Table vs Mobile Cards)
 * para garantir a melhor experiencia de usuario (UX) em diferentes dispositivos.
 */
export function Orders() {
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    
    const toast = useToast();

    /**
     * Efeito de inicializacao.
     * Busca todos os pedidos registrados no backend assim que o componente e montado.
     */
    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Busca as operacoes de pedidos da API e gerencia os estados de carregamento.
     */
    async function fetchOrders() {
        try {
            setIsLoading(true);
            const data = await ordersService.getAllOrders();
            setOrders(data);
        } catch (error) {
            console.error("Erro ao buscar pedidos:", error);
            toast.error("Erro ao carregar a lista de pedidos.");
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Atualiza assincronamente o status de um pedido no backend e reflete a mudanca
     * no estado local para evitar uma nova requisicao HTTP pesada.
     * 
     * @param orderId - Identificador unico do pedido.
     * @param newStatus - O novo status que sera aplicado (ex: APPROVED, REJECTED).
     */
    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            setUpdatingId(orderId);
            await ordersService.updateOrderStatus(orderId, newStatus as OrderStatus);
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o));
            toast.success("Status atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            toast.error("Falha ao atualizar o status do pedido.");
        } finally {
            setUpdatingId(null);
        }
    };

    /**
     * Filtra a lista de pedidos baseada na entrada de texto do usuario (nome do cliente ou painel)
     * e no status selecionado no dropdown.
     */
    const filteredOrders = orders.filter((order) => {
        const searchTarget = searchTerm.toLowerCase();
        const matchesSearch = 
            order.user.name.toLowerCase().includes(searchTarget) || 
            (order.panel?.name || '').toLowerCase().includes(searchTarget);
        
        const matchesStatus = statusFilter === '' || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const statusOptions = [
        { value: 'PENDING', label: 'Pendente' },
        { value: 'APPROVED', label: 'Aprovado' },
        { value: 'COMPLETED', label: 'Concluído' },
        { value: 'REJECTED', label: 'Rejeitado' }
    ];

    const filterOptions = [
        { value: '', label: 'Todos os Status' },
        ...statusOptions
    ];

    /**
     * Formata valores numericos em formato de moeda nacional (BRL).
     */
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    /**
     * Formata strings de data ISO em formato brasileiro padrao (DD/MM/YYYY).
     */
    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateString));
    };

    return (
        <div className="w-full h-full flex flex-col">
            
            {/* ========================================================= */}
            {/* DESKTOP LAYOUT                                              */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-7xl mx-auto w-full">
                
                {/* Header */}
                <div className="flex-shrink-0 mb-6">
                    <h1 className="text-2xl font-bold text-brand-text tracking-tight mb-1 flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-brand-neon" />
                        Gestão de Pedidos
                    </h1>
                    <p className="text-sm text-brand-muted">Acompanhe e gerencie as requisições de painéis e serviços.</p>
                </div>

                {/* Filtros */}
                <div className="glass-panel p-3 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between flex-shrink-0 mb-4 border-brand-border/40 relative z-20">
                    <div className="w-full sm:w-[400px] relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input
                            placeholder="Buscar por cliente ou painel..."
                            className="w-full bg-brand-black/50 border border-brand-border/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-neon transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="w-full sm:w-64 relative">
                        <CustomSelect
                            options={filterOptions}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="Todos os Status"
                        />
                    </div>
                </div>

                {/* Tabela Desktop */}
                <div className="flex-1 min-h-0 glass-panel rounded-xl overflow-hidden flex flex-col relative border-brand-border/40 z-10">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-brand-black/50 backdrop-blur-sm">
                            <Loader2 className="w-6 h-6 text-brand-neon animate-spin" />
                        </div>
                    )}

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead className="sticky top-0 bg-[#0d0d0f] z-40 shadow-sm">
                                <tr className="border-b border-brand-border/40">
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Data / Cliente</th>
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Painel / Serviço</th>
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Valor</th>
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Ação / Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border/20 relative z-0">
                                {!isLoading && filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-8 text-center text-sm text-brand-muted">
                                            Nenhum pedido encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-brand-surface/40 transition-colors group">
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-xs text-brand-muted">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(order.createdAt)}
                                                    </div>
                                                    <div className="font-semibold text-sm text-brand-text">
                                                        {order.user.name}
                                                    </div>
                                                    <div className="text-xs text-brand-muted">{order.user.email}</div>
                                                </div>
                                            </td>
                                            
                                            <td className="px-5 py-4">
                                                {order.panel ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="font-medium text-sm text-brand-text">
                                                            {order.panel.name}
                                                        </div>
                                                        {(order.panel.city || order.panel.state) && (
                                                            <div className="flex items-center gap-1.5 text-xs text-brand-muted">
                                                                <MapPin className="w-3 h-3" />
                                                                {order.panel.city} {order.panel.state ? `- ${order.panel.state}` : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-brand-muted italic">Serviço Avulso</span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="font-semibold text-sm text-brand-text">
                                                    {formatCurrency(order.totalValue)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                {updatingId === order.id ? (
                                                    <div className="flex items-center gap-2 text-sm text-brand-muted">
                                                        <Loader2 className="w-4 h-4 animate-spin text-brand-neon" />
                                                        Atualizando...
                                                    </div>
                                                ) : (
                                                    <div className="w-48">
                                                        <CustomSelect
                                                            options={statusOptions}
                                                            value={order.status}
                                                            onChange={(val) => handleStatusChange(order.id, val)}
                                                        />
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MOBILE LAYOUT (APP PATTERN NATIVO)                          */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full pb-[100px]">
                
                {/* Header Mobile */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-brand-neon" /> Pedidos
                        </h1>
                        <p className="text-[11px] text-brand-muted mt-0.5">Gerenciamento de requisições</p>
                    </div>
                </div>

                {/* Filtros Mobile */}
                <div className="flex flex-col gap-3 mb-4 relative z-50">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted z-10" />
                        <input
                            placeholder="Buscar cliente ou painel..."
                            className="w-full bg-[#111113] border border-brand-border/40 rounded-2xl pl-11 pr-4 py-3.5 text-[13px] text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <CustomSelect
                        options={filterOptions}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        placeholder="Filtrar por Status"
                    />
                </div>

                {/* Lista de Cards Mobile */}
                <div className="flex flex-col gap-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-3" />
                            <span className="text-xs text-brand-muted uppercase font-bold tracking-widest">Sincronizando...</span>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="bg-[#111113]/50 border border-brand-border/20 rounded-2xl p-8 flex flex-col items-center text-center mt-2">
                            <ReceiptText className="w-10 h-10 text-brand-border mb-3" />
                            <h3 className="text-sm font-bold text-white mb-1">Nenhum pedido</h3>
                            <p className="text-xs text-brand-muted">Não encontramos registros com estes filtros.</p>
                        </div>
                    ) : (
                        filteredOrders.map((order, index) => (
                            <div 
                                key={order.id} 
                                style={{ zIndex: filteredOrders.length - index }} 
                                className="bg-[#111113] border border-white/5 rounded-[20px] p-4 flex flex-col shadow-md relative"
                            >
                                {/* Secao Cliente e Data */}
                                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                                    <div className="flex flex-col flex-1 min-w-0 pr-3">
                                        <span className="font-bold text-white text-[15px] truncate">{order.user.name}</span>
                                        <span className="text-xs text-brand-muted truncate">{order.user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-brand-muted font-medium bg-brand-surface/40 px-2 py-1.5 rounded-lg border border-white/5 shrink-0">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(order.createdAt)}
                                    </div>
                                </div>

                                {/* Secao Item e Preco */}
                                <div className="flex flex-col gap-3 py-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-[9px] uppercase font-bold text-brand-muted tracking-widest mb-1">Referência do Item</span>
                                            {order.panel ? (
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-white leading-tight line-clamp-2 mb-1">{order.panel.name}</span>
                                                    {(order.panel.city || order.panel.state) && (
                                                        <span className="text-[10px] text-brand-muted flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-brand-neon" /> {order.panel.city} - {order.panel.state}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[13px] font-bold text-white italic">Serviço Avulso</span>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-col items-end shrink-0 bg-[#0A0A0B] border border-white/5 px-3 py-2 rounded-xl">
                                            <span className="text-[9px] uppercase font-bold text-brand-muted tracking-widest mb-0.5">Valor Autorizado</span>
                                            <span className="text-[14px] font-black text-[#25D366]">{formatCurrency(order.totalValue)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Secao Atualizacao de Status */}
                                <div className="pt-3 border-t border-brand-border/20 flex flex-col gap-2 relative">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted ml-1">Controle de Status</label>
                                    {updatingId === order.id ? (
                                        <div className="flex items-center justify-center gap-2 h-12 text-[13px] font-bold text-brand-neon bg-brand-neon/10 rounded-xl border border-brand-neon/20">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processando...
                                        </div>
                                    ) : (
                                        <CustomSelect
                                            options={statusOptions}
                                            value={order.status}
                                            onChange={(val) => handleStatusChange(order.id, val)}
                                        />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
}