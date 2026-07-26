import { useState, useEffect, FormEvent } from 'react';
import { Plus, MoreHorizontal, DollarSign, Clock, AlertCircle, Loader2, X, Filter } from 'lucide-react';
import { crmService, CrmDeal, CrmClient, CreateDealData, DealStage } from '@/services/crm.service';
import { useToast } from '@/contexts/ToastContext';

/**
 * Componente principal do Funil de Vendas (Kanban / Pipeline).
 * Implementa arquitetura responsiva separando a interface em dois viewports:
 * - Desktop: Quadro Kanban tradicional com suporte a Drag and Drop nativo (HTML5).
 * - Mobile: Lista vertical agrupada por estágio (Stack) com seletores de ação diretos 
 *   para facilitar a transição de cards via touch.
 */
export function CrmPipeline() {
    const [deals, setDeals] = useState<CrmDeal[]>([]);
    const [clients, setClients] = useState<CrmClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<CreateDealData>({
        clientId: '',
        title: '',
        expectedValue: 0,
        probability: 50,
    });

    const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

    const toast = useToast();

    /**
     * Efeito de inicialização.
     * Carrega as oportunidades em andamento e a lista de clientes vinculáveis.
     */
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Busca assíncrona dos dados do Pipeline e da carteira de clientes.
     */
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

    /**
     * Submete o formulário para criação de uma nova oportunidade de negócio no topo do funil.
     * 
     * @param e - Evento de submissão do formulário.
     */
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

    /**
     * Inicializa a API nativa de Drag and Drop do HTML5.
     * 
     * @param e - Evento de drag.
     * @param dealId - Identificador único do card sendo movido.
     */
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, dealId: string) => {
        setDraggedDealId(dealId);
        e.dataTransfer.setData('text/plain', dealId); 
        e.dataTransfer.effectAllowed = 'move';
    };

    /**
     * Previne o comportamento padrão do navegador para habilitar áreas de soltura (drop zones).
     */
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move';
    };

    /**
     * Processa a finalização do evento de Drag and Drop (Desktop).
     * Reutiliza a lógica central de mudança de estágio.
     */
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStage: DealStage) => {
        e.preventDefault();
        if (!draggedDealId) return;
        await changeDealStage(draggedDealId, targetStage);
        setDraggedDealId(null);
    };

    /**
     * Altera o estágio de uma oportunidade de negócio.
     * Aplica UI Otimista para uma resposta visual instantânea e reverte a alteração
     * em caso de falha na comunicação com o servidor.
     * 
     * @param dealId - O identificador do card de negócio.
     * @param targetStage - O novo estágio (coluna) alvo.
     */
    const changeDealStage = async (dealId: string, targetStage: DealStage) => {
        const dealToMove = deals.find(d => d.id === dealId);
        if (!dealToMove || dealToMove.stage === targetStage) return;

        const originalDeals = [...deals];
        
        // UI Otimista: Atualiza localmente antes do retorno da API
        setDeals(prevDeals => prevDeals.map(d => 
            d.id === dealId ? { ...d, stage: targetStage } : d
        ));

        try {
            await crmService.updateDealStage(dealId, targetStage);
            toast.success('Oportunidade movida com sucesso.');
        } catch (error) {
            console.error('Erro ao mover card:', error);
            toast.error('Erro de conexão. Card retornou ao estágio original.');
            setDeals(originalDeals); 
        }
    };

    const stages: { id: DealStage; title: string; color: string; border: string }[] = [
        { id: 'NEW_LEAD', title: 'Novos Leads', color: 'text-blue-500', border: 'border-blue-500/50' },
        { id: 'FIRST_CONTACT', title: 'Primeiro Contato', color: 'text-purple-500', border: 'border-purple-500/50' },
        { id: 'NEGOTIATION', title: 'Em Negociação', color: 'text-yellow-500', border: 'border-yellow-500/50' },
        { id: 'WAITING_REPLY', title: 'Aguardando Retorno', color: 'text-orange-500', border: 'border-orange-500/50' },
        { id: 'PROPOSAL_SENT', title: 'Proposta Enviada', color: 'text-brand-neon', border: 'border-brand-neon/50' },
        { id: 'POST_SALES', title: 'Pós-Venda', color: 'text-green-500', border: 'border-green-500/50' },
    ];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const calculateDaysInStage = (updatedAt: string) => {
        const diffTime = Math.abs(new Date().getTime() - new Date(updatedAt).getTime());
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="w-full h-full flex flex-col relative animate-fade-in">
            
            {/* OVERLAY DE LOADING GLOBAL */}
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0A0A0B]/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
                        <span className="text-brand-muted text-xs font-bold tracking-widest uppercase">Carregando Funil...</span>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* VIEWPORT: DESKTOP                                           */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-[1600px] mx-auto w-full">
                
                <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-wide">Funil de Vendas</h1>
                        <p className="text-sm text-brand-muted mt-1">Arraste os cards para avançar as oportunidades no fluxo comercial.</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-brand-neon text-[#0A0A0B] px-5 py-2.5 rounded-xl font-bold hover:bg-[#FF5E00]/90 transition-colors shadow-[0_0_15px_rgba(255,94,0,0.2)]"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Oportunidade
                    </button>
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar pb-4">
                    <div className="flex gap-4 h-full min-h-[500px]">
                        {stages.map((stage) => {
                            const stageDeals = deals.filter((d) => d.stage === stage.id);
                            const totalValue = stageDeals.reduce((acc, curr) => acc + Number(curr.expectedValue), 0);

                            return (
                                <div 
                                    key={stage.id} 
                                    className={`flex flex-col w-[300px] flex-shrink-0 bg-[#0A0A0B]/50 border border-brand-border/40 rounded-2xl overflow-hidden transition-colors ${
                                        draggedDealId ? 'hover:bg-brand-surface/20 hover:border-brand-neon/30' : ''
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, stage.id)}
                                >
                                    <div className={`p-4 border-b-2 bg-[#111113]/80 ${stage.border}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={`font-bold text-[13px] tracking-wide uppercase ${stage.color}`}>{stage.title}</h3>
                                            <span className="bg-[#0A0A0B] text-brand-muted text-xs font-bold px-2.5 py-1 rounded-lg border border-brand-border/40">
                                                {stageDeals.length}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-brand-muted font-bold tracking-wider">
                                            {formatCurrency(totalValue)}
                                        </div>
                                    </div>

                                    <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[100px]">
                                        {stageDeals.map((deal) => {
                                            const daysInStage = calculateDaysInStage(deal.updatedAt);
                                            const isDragging = draggedDealId === deal.id;
                                            
                                            return (
                                                <div 
                                                    key={deal.id} 
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, deal.id)}
                                                    className={`bg-[#111113] border p-4 rounded-xl cursor-grab active:cursor-grabbing hover:border-brand-neon/50 transition-all group ${
                                                        isDragging ? 'opacity-40 border-brand-neon border-dashed' : 'border-brand-border/40 opacity-100 shadow-sm'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="text-[13px] font-bold text-white group-hover:text-brand-neon transition-colors leading-tight line-clamp-2">
                                                            {deal.title}
                                                        </h4>
                                                        <button className="text-brand-muted hover:text-white transition-colors shrink-0 ml-2">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    
                                                    <p className="text-[11px] text-brand-muted font-medium mb-4 truncate">{deal.client?.name || 'Cliente desconhecido'}</p>
                                                    
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="flex items-center gap-1 text-white/90 font-bold">
                                                                <DollarSign className="w-3.5 h-3.5 text-brand-neon" />
                                                                {formatCurrency(Number(deal.expectedValue))}
                                                            </span>
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                                                deal.probability > 70 ? 'bg-[#25D366]/10 text-[#25D366]' : 
                                                                deal.probability > 30 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                                            }`}>
                                                                {deal.probability}%
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-border/20">
                                                            <div className="flex items-center gap-1 text-[10px] text-brand-muted font-medium">
                                                                <Clock className="w-3 h-3" />
                                                                {daysInStage} {daysInStage === 1 ? 'dia' : 'dias'}
                                                            </div>
                                                            {daysInStage > 7 && (
                                                                <span title="Estagnado há mais de 7 dias" className="cursor-help">
                                                                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <button 
                                            onClick={() => setIsModalOpen(true)}
                                            className="w-full py-3 rounded-xl border border-dashed border-brand-border/40 text-[11px] font-bold uppercase tracking-widest text-brand-muted hover:text-white hover:border-brand-neon/50 hover:bg-[#111113] transition-colors flex items-center justify-center gap-2 mt-1"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Adicionar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* VIEWPORT: MOBILE (APP PATTERN NATIVO)                       */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full h-full pb-4">
                
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Filter className="w-5 h-5 text-brand-neon" /> Funil
                        </h1>
                        <p className="text-[11px] text-brand-muted mt-0.5">Gestão de oportunidades</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-10 h-10 bg-brand-neon text-[#0A0A0B] rounded-full flex items-center justify-center shadow-lg shadow-brand-neon/20 active:scale-95 transition-transform shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col gap-6">
                    {stages.map((stage) => {
                        const stageDeals = deals.filter((d) => d.stage === stage.id);
                        if (stageDeals.length === 0) return null; // Oculta estágios vazios no mobile para economizar espaço

                        return (
                            <div key={stage.id} className="flex flex-col">
                                <div className={`flex items-center justify-between border-b-2 ${stage.border} pb-2 mb-3`}>
                                    <h3 className={`font-black text-[11px] uppercase tracking-widest ${stage.color}`}>{stage.title}</h3>
                                    <span className="bg-[#111113] border border-white/5 text-brand-muted text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                        {stageDeals.length}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {stageDeals.map((deal) => {
                                        const daysInStage = calculateDaysInStage(deal.updatedAt);
                                        
                                        return (
                                            <div key={deal.id} className="bg-[#111113] border border-white/5 p-4 rounded-[20px] flex flex-col shadow-sm">
                                                <div className="flex items-start justify-between mb-1">
                                                    <h4 className="text-[14px] font-bold text-white leading-tight line-clamp-2 pr-2">
                                                        {deal.title}
                                                    </h4>
                                                </div>
                                                <p className="text-[11px] text-brand-muted font-medium mb-3 truncate">{deal.client?.name}</p>
                                                
                                                <div className="flex items-center justify-between mb-3 bg-[#0A0A0B] p-2.5 rounded-xl border border-white/5">
                                                    <span className="flex items-center gap-1.5 text-white/90 font-bold text-[13px]">
                                                        <DollarSign className="w-4 h-4 text-brand-neon" />
                                                        {formatCurrency(Number(deal.expectedValue))}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black ${
                                                        deal.probability > 70 ? 'bg-[#25D366]/10 text-[#25D366]' : 
                                                        deal.probability > 30 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                                    }`}>
                                                        {deal.probability}% Prob.
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1">
                                                        <select 
                                                            value={deal.stage}
                                                            onChange={(e) => changeDealStage(deal.id, e.target.value as DealStage)}
                                                            className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-[11px] font-bold text-brand-muted focus:outline-none focus:border-brand-neon appearance-none shadow-inner"
                                                        >
                                                            {stages.map(s => (
                                                                <option key={s.id} value={s.id}>{s.title}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center justify-center shrink-0 px-3 border border-white/5 bg-[#0A0A0B] rounded-xl h-[38px] text-[10px] text-brand-muted font-medium gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {daysInStage} {daysInStage === 1 ? 'dia' : 'dias'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bloco Espaçador Fantasma para Mobile */}
                <div className="h-[200px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
            </div>

            {/* ========================================================= */}
            {/* MODAL GLOBAL (CRIAÇÃO DE OPORTUNIDADE)                      */}
            {/* ========================================================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-end lg:items-center justify-center bg-[#0A0A0B]/80 backdrop-blur-md p-0 lg:p-4">
                    <div className="bg-[#121214] border-t lg:border border-brand-border/40 rounded-t-[32px] lg:rounded-[24px] w-full max-w-md overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:shadow-2xl animate-slide-up lg:animate-fade-in relative flex flex-col max-h-[90vh] pb-safe lg:pb-0">
                        
                        <div className="flex items-center justify-between p-5 border-b border-brand-border/40 bg-[#121214] lg:bg-brand-surface/30 sticky top-0 z-20">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-brand-neon" /> Nova Oportunidade
                            </h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-brand-muted hover:text-white bg-[#0A0A0B] p-2 rounded-full border border-white/5 transition-colors active:scale-95"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 lg:p-6">
                            <form id="pipelineForm" onSubmit={handleCreateDeal} className="flex flex-col gap-4 relative z-10">
                                <div>
                                    <label className="block text-[11px] font-bold text-brand-muted mb-1.5 uppercase tracking-widest ml-1">Vincular ao Cliente *</label>
                                    <select
                                        required
                                        className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl px-4 py-3.5 lg:py-3 text-[13px] text-white focus:outline-none focus:border-brand-neon transition-colors appearance-none shadow-inner"
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
                                    <label className="block text-[11px] font-bold text-brand-muted mb-1.5 uppercase tracking-widest ml-1">Título da Oportunidade *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl px-4 py-3.5 lg:py-3 text-[13px] text-white focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                                        placeholder="Ex: Contrato Anual Painéis BR-153"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-brand-muted mb-1.5 uppercase tracking-widest ml-1">Valor (R$)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl px-4 py-3.5 lg:py-3 text-[13px] text-white focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                                            placeholder="0.00"
                                            value={formData.expectedValue || ''}
                                            onChange={(e) => setFormData({...formData, expectedValue: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-brand-muted mb-1.5 uppercase tracking-widest ml-1">Probabilidade (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl px-4 py-3.5 lg:py-3 text-[13px] text-white focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                                            value={formData.probability}
                                            onChange={(e) => setFormData({...formData, probability: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>
                            </form>
                            
                            {/* Spacer Interno Modal Mobile */}
                            <div className="h-[20px] lg:hidden w-full shrink-0" />
                        </div>
                        
                        <div className="p-5 border-t border-brand-border/40 shrink-0 bg-[#121214] z-20">
                            <button
                                type="submit"
                                form="pipelineForm"
                                disabled={isSubmitting}
                                className="w-full bg-brand-neon text-[#0A0A0B] py-4 lg:py-3.5 rounded-xl text-[13px] font-black uppercase tracking-widest hover:bg-[#FF5E00]/90 transition-all flex items-center justify-center shadow-[0_10px_25px_rgba(255,94,0,0.3)] disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Negócio'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}