import { useState, useEffect, FormEvent } from 'react';
import { Plus, MoreHorizontal, DollarSign, Clock, AlertCircle, Loader2, X } from 'lucide-react';
import { crmService, CrmDeal, CrmClient, CreateDealData, DealStage } from '@/services/crm.service';
import { useToast } from '@/contexts/ToastContext';

export function CrmPipeline() {
    const [deals, setDeals] = useState<CrmDeal[]>([]);
    const [clients, setClients] = useState<CrmClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Estados do Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<CreateDealData>({
        clientId: '',
        title: '',
        expectedValue: 0,
        probability: 50,
    });

    // Estados do Drag and Drop
    const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

    const toast = useToast();

    // ==========================================
    // INTEGRAÇÃO COM A API
    // ==========================================
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [dealsData, clientsData] = await Promise.all([
                crmService.getDeals(),
                crmService.getClients()
            ]);
            setDeals(dealsData);
            setClients(clientsData);
        } catch (error) {
            console.error('Erro ao buscar dados do Kanban:', error);
            toast.error('Não foi possível carregar o funil de vendas.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateDeal = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!formData.clientId || !formData.title.trim()) {
            toast.error('Preencha os campos obrigatórios.');
            return;
        }

        try {
            setIsSubmitting(true);
            await crmService.createDeal(formData);
            toast.success('Oportunidade criada com sucesso!');
            setIsModalOpen(false);
            setFormData({ clientId: '', title: '', expectedValue: 0, probability: 50 });
            fetchData();
        } catch (error) {
            console.error('Erro ao criar oportunidade:', error);
            toast.error('Erro ao salvar oportunidade.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================
    // SISTEMA DE DRAG AND DROP (Nativo)
    // ==========================================
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, dealId: string) => {
        setDraggedDealId(dealId);
        // Define o dado sendo arrastado (necessário pro Firefox)
        e.dataTransfer.setData('text/plain', dealId); 
        // Efeito visual no cursor
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessário para permitir o "Drop"
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStage: DealStage) => {
        e.preventDefault();
        
        if (!draggedDealId) return;

        const dealToMove = deals.find(d => d.id === draggedDealId);
        if (!dealToMove || dealToMove.stage === targetStage) {
            setDraggedDealId(null);
            return;
        }

        // 1. Atualização Otimista (Muda na UI instantaneamente)
        const originalDeals = [...deals];
        setDeals(prevDeals => prevDeals.map(d => 
            d.id === draggedDealId ? { ...d, stage: targetStage } : d
        ));

        // 2. Envia para a API
        try {
            await crmService.updateDealStage(draggedDealId, targetStage);
        } catch (error) {
            console.error('Erro ao mover card:', error);
            toast.error('Erro de conexão. Card retornou ao estágio original.');
            setDeals(originalDeals); // Reverte se der erro
        } finally {
            setDraggedDealId(null);
        }
    };

    // ==========================================
    // CONFIGURAÇÃO DAS COLUNAS (STAGES)
    // ==========================================
    const stages: { id: DealStage; title: string; color: string }[] = [
        { id: 'NEW_LEAD', title: 'Novos Leads', color: 'border-blue-500/50 text-blue-500' },
        { id: 'FIRST_CONTACT', title: 'Primeiro Contato', color: 'border-purple-500/50 text-purple-500' },
        { id: 'NEGOTIATION', title: 'Em Negociação', color: 'border-yellow-500/50 text-yellow-500' },
        { id: 'WAITING_REPLY', title: 'Aguardando Retorno', color: 'border-orange-500/50 text-orange-500' },
        { id: 'PROPOSAL_SENT', title: 'Proposta Enviada', color: 'border-brand-neon/50 text-brand-neon' },
        { id: 'POST_SALES', title: 'Pós-Venda', color: 'border-green-500/50 text-green-500' },
    ];

    // ==========================================
    // UTILS
    // ==========================================
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const calculateDaysInStage = (updatedAt: string) => {
        const diffTime = Math.abs(new Date().getTime() - new Date(updatedAt).getTime());
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="flex flex-col h-full animate-fade-in relative">
            
            {/* OVERLAY DE LOADING INICIAL */}
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0A0A0B]/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
                        <span className="text-brand-muted text-sm font-medium tracking-widest uppercase">Carregando Funil...</span>
                    </div>
                </div>
            )}

            {/* CABEÇALHO */}
            <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">Funil de Vendas</h1>
                    <p className="text-sm text-brand-muted mt-1">Arraste os cards para avançar as oportunidades.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-neon text-[#0A0A0B] px-5 py-2.5 rounded-xl font-bold hover:bg-brand-neon/90 transition-colors shadow-[0_0_15px_rgba(255,94,0,0.2)]"
                >
                    <Plus className="w-5 h-5" />
                    Nova Oportunidade
                </button>
            </div>

            {/* KANBAN BOARD */}
            <div className="flex-1 overflow-x-auto custom-scrollbar pb-4">
                <div className="flex gap-4 h-full min-h-[500px]">
                    {stages.map((stage) => {
                        const stageDeals = deals.filter((d) => d.stage === stage.id);
                        const totalValue = stageDeals.reduce((acc, curr) => acc + Number(curr.expectedValue), 0);

                        return (
                            <div 
                                key={stage.id} 
                                className={`flex flex-col w-80 flex-shrink-0 bg-brand-surface/20 border border-brand-border/40 rounded-2xl overflow-hidden transition-colors ${
                                    draggedDealId ? 'hover:bg-brand-surface/40 hover:border-brand-neon/30' : ''
                                }`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, stage.id)}
                            >
                                {/* CABEÇALHO DA COLUNA */}
                                <div className={`p-4 border-b-2 bg-[#0A0A0B]/50 ${stage.color}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-sm tracking-wide uppercase">{stage.title}</h3>
                                        <span className="bg-brand-surface text-brand-muted text-xs px-2 py-0.5 rounded-md border border-brand-border/50">
                                            {stageDeals.length}
                                        </span>
                                    </div>
                                    <div className="text-xs text-brand-muted font-medium">
                                        {formatCurrency(totalValue)}
                                    </div>
                                </div>

                                {/* LISTA DE CARDS */}
                                <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[100px]">
                                    {stageDeals.map((deal) => {
                                        const daysInStage = calculateDaysInStage(deal.updatedAt);
                                        const isDragging = draggedDealId === deal.id;
                                        
                                        return (
                                            <div 
                                                key={deal.id} 
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, deal.id)}
                                                className={`bg-[#0A0A0B] border p-4 rounded-xl cursor-grab active:cursor-grabbing hover:border-brand-neon/50 hover:shadow-[0_0_10px_rgba(255,94,0,0.1)] transition-all group ${
                                                    isDragging ? 'opacity-40 border-brand-neon border-dashed' : 'border-brand-border/60 opacity-100'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="text-sm font-bold text-white group-hover:text-brand-neon transition-colors leading-tight">
                                                        {deal.title}
                                                    </h4>
                                                    <button className="text-brand-muted hover:text-white transition-colors">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                
                                                <p className="text-xs text-brand-muted font-medium mb-4">{deal.client?.name || 'Cliente desconhecido'}</p>
                                                
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="flex items-center gap-1 text-white/90 font-semibold">
                                                            <DollarSign className="w-3.5 h-3.5 text-brand-neon" />
                                                            {formatCurrency(Number(deal.expectedValue))}
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                            deal.probability > 70 ? 'bg-green-500/10 text-green-500' : 
                                                            deal.probability > 30 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                                        }`}>
                                                            {deal.probability}%
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-border/30">
                                                        <div className="flex items-center gap-1 text-[10px] text-brand-muted">
                                                            <Clock className="w-3 h-3" />
                                                            {daysInStage} dias
                                                        </div>
                                                        {daysInStage > 7 && (
                                                            <span title="Muito tempo nesta etapa" className="cursor-help">
                                                                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Botão de Adição Rápida */}
                                    <button 
                                        onClick={() => setIsModalOpen(true)}
                                        className="w-full py-2.5 rounded-xl border border-dashed border-brand-border/50 text-xs font-medium text-brand-muted hover:text-white hover:border-brand-neon/50 transition-colors flex items-center justify-center gap-2 mt-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Adicionar Lead
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL DE NOVA OPORTUNIDADE MANTIDO INTACTO... */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0d0d0f] border border-brand-border/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                        
                        <div className="flex items-center justify-between p-5 border-b border-brand-border/40 bg-brand-surface/30">
                            <h2 className="text-lg font-bold text-white">Nova Oportunidade</h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-brand-muted hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDeal} className="p-5 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-medium text-brand-muted mb-1 uppercase tracking-wider">Vincular ao Cliente *</label>
                                <select
                                    required
                                    className="w-full bg-[#0A0A0B] border border-brand-border/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon transition-colors appearance-none"
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                                >
                                    <option value="" disabled>Selecione um cliente...</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-brand-muted mb-1 uppercase tracking-wider">Título da Oportunidade *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-[#0A0A0B] border border-brand-border/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon transition-colors"
                                    placeholder="Ex: Contrato Anual Painéis BR-153"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-brand-muted mb-1 uppercase tracking-wider">Valor Estimado (R$)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full bg-[#0A0A0B] border border-brand-border/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon transition-colors"
                                        placeholder="0.00"
                                        value={formData.expectedValue || ''}
                                        onChange={(e) => setFormData({...formData, expectedValue: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-brand-muted mb-1 uppercase tracking-wider">Probabilidade (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-full bg-[#0A0A0B] border border-brand-border/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon transition-colors"
                                        value={formData.probability}
                                        onChange={(e) => setFormData({...formData, probability: Number(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4 pt-4 border-t border-brand-border/40">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-brand-border/60 text-sm font-medium text-brand-text hover:text-white hover:bg-brand-surface transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-brand-neon text-[#0A0A0B] py-2.5 rounded-xl text-sm font-bold hover:bg-brand-neon/90 transition-colors flex items-center justify-center shadow-[0_0_15px_rgba(255,94,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Negócio'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}