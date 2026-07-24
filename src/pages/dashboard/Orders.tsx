import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Loader2, Calendar, MapPin } from 'lucide-react';
import { ordersService, OrderData, OrderStatus } from '@/services/orders.service';
import { useToast } from '@/contexts/ToastContext';
import { CustomSelect } from '@/components/CustomSelect';

export function Orders() {
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    
    const toast = useToast();

    useEffect(() => {
        fetchOrders();
    }, []);

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

    const filteredOrders = orders.filter((order) => {
        const searchTarget = searchTerm.toLowerCase();
        const matchesSearch = 
            order.user.name.toLowerCase().includes(searchTarget) || 
            (order.panel?.name || '').toLowerCase().includes(searchTarget);
        
        const matchesStatus = statusFilter === '' || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const statusStyles = {
        PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        APPROVED: 'bg-brand-neon/10 text-brand-neon border-brand-neon/20',
        COMPLETED: 'bg-green-500/10 text-green-500 border-green-500/20',
        REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20'
    };

    const statusLabels = {
        PENDING: 'Pendente',
        APPROVED: 'Aprovado',
        COMPLETED: 'Concluído',
        REJECTED: 'Rejeitado'
    };

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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateString));
    };

    return (
        <div className="flex flex-col h-full max-w-7xl mx-auto w-full">
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

            {/* Tabela */}
            <div className="flex-1 min-h-0 glass-panel rounded-xl overflow-hidden flex flex-col relative border-brand-border/40">
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
    );
}