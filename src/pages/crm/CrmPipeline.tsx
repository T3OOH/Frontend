import { useState, useEffect, FormEvent } from 'react';
import { Plus, DollarSign, Clock, AlertCircle, Loader2, X, Filter, MessageCircle } from 'lucide-react';
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
     * Abre o WhatsApp do cliente com uma mensagem pré-formatada.
     */
    const handleOpenWhatsApp = (e: React.MouseEvent, clientName?: string, phone?: string) => {
        e.stopPropagation(); // Previne que o click inicie um Drag ou outra ação do Card
        
        if (!phone) {
            toast.error('Cliente não possui telefone/WhatsApp cadastrado.');
            return;
        }

        // Limpa tudo que não for número
        const cleanPhone = phone.replace(/\D/g, '');
        const firstName = clientName ? clientName.split(' ')[0] : 'Cliente';
        const defaultText = `Olá, ${firstName}! Aqui é do time comercial da T3 OOH.`;
        
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultText)}`;
        window.open(waUrl, '_blank');
    };

    /**
     * Inicializa a API nativa de Drag and Drop do HTML5.
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
     */
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStage: DealStage) => {
        e.preventDefault();
        if (!draggedDealId) return;
        await changeDealStage(draggedDealId, targetStage);
        setDraggedDealId(null);
    };

    /**
     * Altera o estágio de uma oportunidade de negócio com UI Otimista.
     */
    const changeDealStage = async (dealId: string, targetStage: DealStage) => {
        const dealToMove = deals.find(d => d.id === dealId);
        if (!dealToMove || dealToMove.stage === targetStage) return;

        const originalDeals = [...deals];
        
        // UI Otimista
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
        { id: 'POST_SALES', title: 'Pós-Venda', color: 'text-[#25D366]', border: 'border-[#25D366]/50' },
    ];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const calculateDaysInStage = (updatedAt: string) => {
        const diffTime = Math.abs(new Date().getTime() - new Date(updatedAt).getTime());
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="w-full h-full flex flex-col relative animate-fade-in gap-6">
            
            {/* OVERLAY DE LOADING GLOBAL */}
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-brand-background/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
                        <span className="text-brand-muted text-xs font-bold tracking-widest uppercase">Carregando Funil...</span>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* VIEWPORT: DESKTOP                                         */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-[1600px] mx-auto w-full">
                
                <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-text tracking-tight flex items-center gap-2">
                            <Filter className="w-6 h-6 text-brand-neon" /> Funil de Vendas
                        </h1>
                        <p className="text-sm text-brand-muted mt-1 font-medium">Arraste os cards para avançar as oportunidades no fluxo comercial.</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-brand-neon text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-neonHover transition-colors shadow-sm"
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
                                    className={`flex flex-col w-[320px] flex-shrink-0 bg-brand-background border border-brand-border rounded-[24px] overflow-hidden transition-colors shadow-sm ${
                                        draggedDealId ? 'hover:bg-brand-surface/50 hover:border-brand-neon/50' : ''
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, stage.id)}
                                >
                                    <div className={`p-5 border-b-2 bg-brand-surface/80 backdrop-blur-sm ${stage.border}`}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <h3 className={`font-bold text-[13px] tracking-wide uppercase ${stage.color}`}>{stage.title}</h3>
                                            <span className="bg-brand-background text-brand-text text-[11px] font-bold px-2.5 py-1 rounded-lg border border-brand-border">
                                                {stageDeals.length}
                                            </span>
                                        </div>
                                        <div className="text-[12px] text-brand-muted font-bold tracking-wider">
                                            {formatCurrency(totalValue)}
                                        </div>
                                    </div>

                                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4 min-h-[100px]">
                                        {stageDeals.map((deal) => {
                                            const daysInStage = calculateDaysInStage(deal.updatedAt);
                                            const isDragging = draggedDealId === deal.id;
                                            
                                            return (
                                                <div 
                                                    key={deal.id} 
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, deal.id)}
                                                    className={`bg-brand-surface border border-brand-border p-5 rounded-[20px] cursor-grab active:cursor-grabbing hover:border-brand-neon/50 transition-all group shadow-sm ${
                                                        isDragging ? 'opacity-40 border-brand-neon border-dashed' : 'opacity-100'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <h4 className="text-[14px] font-bold text-brand-text group-hover:text-brand-neon transition-colors leading-tight line-clamp-2 pr-2">
                                                            {deal.title}
                                                        </h4>
                                                        <button 
                                                            onClick={(e) => handleOpenWhatsApp(e, deal.client?.name, (deal.client as any)?.whatsapp || (deal.client as any)?.phone)}
                                                            className="text-[#25D366] hover:text-white bg-[#25D366]/10 hover:bg-[#25D366] p-2 rounded-full transition-colors shrink-0 shadow-sm"
                                                            title="Chamar no WhatsApp"
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    
                                                    <p className="text-[12px] text-brand-muted font-medium mb-4 truncate">{deal.client?.name || 'Cliente desconhecido'}</p>
                                                    
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="flex items-center gap-1.5 text-brand-text font-bold">
                                                                <DollarSign className="w-3.5 h-3.5 text-brand-neon" />
                                                                {formatCurrency(Number(deal.expectedValue))}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                                                deal.probability > 70 ? 'bg-[#25D366]/10 text-[#25D366]' : 
                                                                deal.probability > 30 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                                            }`}>
                                                                {deal.probability}%
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between mt-1 pt-3 border-t border-brand-border">
                                                            <div className="flex items-center gap-1.5 text-[11px] text-brand-muted font-bold">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {daysInStage} {daysInStage === 1 ? 'dia' : 'dias'}
                                                            </div>
                                                            {daysInStage > 7 && (
                                                                <span title="Estagnado há mais de 7 dias" className="cursor-help">
                                                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <button 
                                            onClick={() => setIsModalOpen(true)}
                                            className="w-full py-4 rounded-[20px] border-2 border-dashed border-brand-border text-[11px] font-bold uppercase tracking-widest text-brand-muted hover:text-brand-text hover:border-brand-neon/50 hover:bg-brand-surface transition-colors flex items-center justify-center gap-2 mt-2"
                                        >
                                            <Plus className="w-4 h-4" /> Adicionar
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
                
                <div className="flex items-center justify-between mb-6 px-2 mt-2">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-text tracking-tight flex items-center gap-2">
                            <Filter className="w-6 h-6 text-brand-neon" /> Funil
                        </h1>
                        <p className="text-[11px] font-medium text-brand-muted mt-0.5">Gestão de oportunidades</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-12 h-12 bg-brand-neon text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform shrink-0"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col gap-6">
                    {stages.map((stage) => {
                        const stageDeals = deals.filter((d) => d.stage === stage.id);
                        if (stageDeals.length === 0) return null; // Oculta estágios vazios no mobile

                        return (
                            <div key={stage.id} className="flex flex-col">
                                <div className={`flex items-center justify-between border-b-2 ${stage.border} pb-3 mb-4 px-2`}>
                                    <h3 className={`font-black text-[12px] uppercase tracking-widest ${stage.color}`}>{stage.title}</h3>
                                    <span className="bg-brand-surface border border-brand-border text-brand-text text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                                        {stageDeals.length}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {stageDeals.map((deal) => {
                                        const daysInStage = calculateDaysInStage(deal.updatedAt);
                                        
                                        return (
                                            <div key={deal.id} className="bg-brand-surface border border-brand-border p-5 rounded-[24px] flex flex-col shadow-sm transition-colors">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="text-[15px] font-bold text-brand-text leading-tight line-clamp-2 pr-3">
                                                        {deal.title}
                                                    </h4>
                                                    <button 
                                                        onClick={(e) => handleOpenWhatsApp(e, deal.client?.name, (deal.client as any)?.whatsapp || (deal.client as any)?.phone)}
                                                        className="text-[#25D366] hover:text-white bg-[#25D366]/10 hover:bg-[#25D366] p-2 rounded-full transition-colors shrink-0 shadow-sm"
                                                        title="Chamar no WhatsApp"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className="text-[12px] text-brand-muted font-medium mb-4 truncate">{deal.client?.name}</p>
                                                
                                                <div className="flex items-center justify-between mb-4 bg-brand-background p-3.5 rounded-[16px] border border-brand-border shadow-sm">
                                                    <span className="flex items-center gap-1.5 text-brand-text font-bold text-[14px]">
                                                        <DollarSign className="w-4 h-4 text-brand-neon" />
                                                        {formatCurrency(Number(deal.expectedValue))}
                                                    </span>
                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${
                                                        deal.probability > 70 ? 'bg-[#25D366]/10 text-[#25D366]' : 
                                                        deal.probability > 30 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                                    }`}>
                                                        {deal.probability}% Prob.
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 mt-1">
                                                    <div className="flex-1">
                                                        <select 
                                                            value={deal.stage}
                                                            onChange={(e) => changeDealStage(deal.id, e.target.value as DealStage)}
                                                            className="w-full bg-brand-background border border-brand-border rounded-[16px] px-4 py-3.5 text-[12px] font-bold text-brand-muted focus:outline-none focus:border-brand-neon appearance-none shadow-sm transition-colors"
                                                        >
                                                            {stages.map(s => (
                                                                <option key={s.id} value={s.id}>{s.title}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center justify-center shrink-0 px-4 border border-brand-border bg-brand-background rounded-[16px] h-[46px] text-[11px] text-brand-muted font-bold gap-2 shadow-sm">
                                                        <Clock className="w-4 h-4 text-brand-neon" />
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

                {/* Espaçador fantasma Mobile */}
                <div className="h-[200px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
            </div>

            {/* ========================================================= */}
            {/* MODAL GLOBAL (CRIAÇÃO DE OPORTUNIDADE)                      */}
            {/* ========================================================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-end lg:items-center justify-center bg-brand-background/80 backdrop-blur-md p-0 lg:p-4">
                    <div className="bg-brand-surface border-t lg:border border-brand-border rounded-t-[32px] lg:rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-slide-up lg:animate-fade-in relative flex flex-col max-h-[90vh] pb-safe lg:pb-0 transition-colors">
                        
                        <div className="flex items-center justify-between p-6 lg:p-8 border-b border-brand-border bg-brand-surface sticky top-0 z-20">
                            <h2 className="text-xl font-bold text-brand-text flex items-center gap-2 tracking-tight">
                                <Plus className="w-6 h-6 text-brand-neon" /> Nova Oportunidade
                            </h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-brand-muted hover:text-brand-text bg-brand-background p-2.5 rounded-full border border-brand-border transition-colors active:scale-95 shadow-sm"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
                            <form id="pipelineForm" onSubmit={handleCreateDeal} className="flex flex-col gap-5 relative z-10">
                                <div>
                                    <label className="block text-[11px] font-bold text-brand-muted mb-2 uppercase tracking-widest ml-1">Vincular ao Cliente *</label>
                                    <select
                                        required
                                        className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-4 lg:py-3.5 text-[14px] font-medium text-brand-text focus:outline-none focus:border-brand-neon transition-colors appearance-none shadow-sm"
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
                                    <label className="block text-[11px] font-bold text-brand-muted mb-2 uppercase tracking-widest ml-1">Título da Oportunidade *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-4 lg:py-3.5 text-[14px] font-medium text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-sm"
                                        placeholder="Ex: Contrato Anual Painéis BR-153"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-brand-muted mb-2 uppercase tracking-widest ml-1">Valor Estimado (R$)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-4 lg:py-3.5 text-[14px] font-medium text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-sm"
                                            placeholder="0.00"
                                            value={formData.expectedValue || ''}
                                            onChange={(e) => setFormData({...formData, expectedValue: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-brand-muted mb-2 uppercase tracking-widest ml-1">Probabilidade (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-4 lg:py-3.5 text-[14px] font-medium text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-sm"
                                            value={formData.probability}
                                            onChange={(e) => setFormData({...formData, probability: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>
                            </form>
                            
                            {/* Spacer Interno Modal Mobile */}
                            <div className="h-[30px] lg:hidden w-full shrink-0" />
                        </div>
                        
                        <div className="p-6 lg:p-8 border-t border-brand-border shrink-0 bg-brand-surface z-20">
                            <button
                                type="submit"
                                form="pipelineForm"
                                disabled={isSubmitting}
                                className="w-full bg-brand-neon text-white py-4 rounded-xl text-[14px] font-bold uppercase tracking-widest hover:bg-brand-neonHover transition-all flex items-center justify-center shadow-md disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
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