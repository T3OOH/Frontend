import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/axios';
import { 
    Ticket, Plus, Trash2, Copy, Check, 
    Calendar, DollarSign, Percent, AlertCircle, X, Loader2
} from 'lucide-react';

interface Coupon {
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_VALUE';
    value: number;
    minValue: number | null;
    validUntil: string | null;
    singleUse: boolean;
    isUsed: boolean;
    createdAt: string;
    usedBy?: { name: string } | null;
}

/**
 * Componente de Gestão de Cupons e Descontos (CRM).
 * Implementa arquitetura responsiva separando a interface em dois viewports:
 * - Desktop: Grid interativo com painel lateral dinâmico para criação.
 * - Mobile: Lista em stack (cartões nativos) com modal de criação em tela cheia
 *   e espaçador fantasma inferior para evitar colisões com a navegação do app.
 */
export function CrmCoupons() {
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        code: '',
        discountType: 'PERCENTAGE',
        value: '',
        minValue: '',
        validUntil: '',
        singleUse: true
    });

    /**
     * Efeito de inicialização.
     * Busca os cupons ativos no sistema ao carregar o componente.
     */
    useEffect(() => {
        fetchCoupons();
    }, []);

    /**
     * Requisita a lista de cupons promocionais através da API.
     */
    const fetchCoupons = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/coupons');
            setCoupons(response.data);
        } catch (error) {
            console.error("Erro ao carregar cupons", error);
            addToast("Falha ao carregar a lista de cupons.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Valida e envia o payload de criação de um novo cupom.
     * @param e - Evento de submissão do formulário.
     */
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await api.post('/coupons', {
                ...formData,
                creatorId: user?.id
            });
            setIsCreating(false);
            setFormData({ code: '', discountType: 'PERCENTAGE', value: '', minValue: '', validUntil: '', singleUse: true });
            addToast("Cupom gerado com sucesso!", "success");
            fetchCoupons();
        } catch (error) {
            console.error("Erro ao criar cupom", error);
            addToast("Erro ao criar cupom. Verifique se o código já existe.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Solicita a exclusão de um cupom existente após confirmação do usuário.
     * @param id - Identificador único do cupom.
     */
    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este cupom? Essa ação não pode ser desfeita.')) return;
        try {
            await api.delete(`/coupons/${id}`);
            setCoupons(prev => prev.filter(c => c.id !== id));
            addToast("Cupom excluído com sucesso.", "success");
        } catch (error) {
            console.error("Erro ao excluir", error);
            addToast("Falha ao excluir o cupom.", "error");
        }
    };

    /**
     * Copia o código do cupom para a área de transferência do dispositivo
     * e fornece feedback visual temporário.
     * 
     * @param id - Identificador do cupom para controle de estado visual.
     * @param code - O código em texto a ser copiado.
     */
    const copyToClipboard = (id: string, code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        addToast("Código copiado para a área de transferência!", "success");
        setTimeout(() => setCopiedId(null), 2000);
    };

    /**
     * Gera uma string alfanumérica aleatória (8 caracteres) para ser usada como código.
     */
    const generateRandomCode = () => {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        setFormData(prev => ({ ...prev, code }));
    };

    /**
     * Avalia as regras de negócio de um cupom e retorna um selo visual (Badge)
     * indicando se está Ativo, Usado ou Expirado.
     * 
     * @param coupon - Objeto do cupom a ser avaliado.
     * @returns Elemento JSX com a estilização correta.
     */
    const getStatus = (coupon: Coupon) => {
        if (coupon.isUsed) return <span className="text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 px-2.5 py-1 rounded-md border border-red-500/20">Usado</span>;
        if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) return <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-surface/50 text-brand-muted px-2.5 py-1 rounded-md border border-brand-border/50">Expirado</span>;
        return <span className="text-[10px] font-bold uppercase tracking-widest bg-[#25D366]/10 text-[#25D366] px-2.5 py-1 rounded-md border border-[#25D366]/20">Ativo</span>;
    };

    return (
        <div className="w-full h-full flex flex-col relative">

            {/* ========================================================= */}
            {/* VIEWPORT: DESKTOP                                           */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-7xl mx-auto w-full animate-fade-in">
                
                {/* CABEÇALHO */}
                <div className="flex-shrink-0 flex justify-between items-center bg-[#0A0A0B]/50 p-6 rounded-2xl border border-brand-border/40 glass-panel mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-neon/10 flex items-center justify-center border border-brand-neon/20">
                            <Ticket className="w-6 h-6 text-brand-neon" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-wide">Cupons & Descontos</h1>
                            <p className="text-sm text-brand-muted">Gerencie códigos promocionais para seus clientes.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-2 bg-brand-neon text-[#0A0A0B] px-5 py-2.5 rounded-xl font-bold hover:bg-brand-neon/90 transition-all shadow-[0_0_15px_rgba(255,94,0,0.2)]"
                    >
                        {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {isCreating ? 'Cancelar Criação' : 'Novo Cupom'}
                    </button>
                </div>

                <div className="flex flex-1 min-h-0 gap-6 items-start">
                    
                    {/* GRID DE CUPONS */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 h-full pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {isLoading ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-4" />
                                    <span className="text-sm font-medium text-brand-muted">Carregando cupons...</span>
                                </div>
                            ) : coupons.length === 0 ? (
                                <div className="col-span-full text-center py-16 border border-dashed border-brand-border/50 rounded-2xl bg-[#0A0A0B]/30">
                                    <Ticket className="w-10 h-10 text-brand-border mx-auto mb-3" />
                                    <h3 className="text-white font-bold text-lg mb-1">Nenhum cupom gerado</h3>
                                    <p className="text-sm text-brand-muted">Crie seu primeiro código de desconto ao lado.</p>
                                </div>
                            ) : (
                                coupons.map(coupon => (
                                    <div key={coupon.id} className="bg-gradient-to-br from-[#0A0A0B] to-brand-surface/30 border border-brand-border/40 rounded-2xl p-5 relative overflow-hidden group hover:border-brand-neon/30 transition-all shadow-md">
                                        
                                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#040405] rounded-full border-r border-brand-border/40"></div>
                                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#040405] rounded-full border-l border-brand-border/40"></div>
                                        
                                        <div className="flex justify-between items-start mb-4 px-2">
                                            {getStatus(coupon)}
                                            <button 
                                                onClick={() => handleDelete(coupon.id)}
                                                className="text-brand-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-surface/50 p-1.5 rounded-lg border border-brand-border/40"
                                                title="Excluir Cupom"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="text-center mb-6">
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <h3 className="text-2xl font-black text-brand-neon tracking-widest">{coupon.code}</h3>
                                                <button onClick={() => copyToClipboard(coupon.id, coupon.code)} className="text-brand-muted hover:text-white transition-colors p-1.5 bg-brand-surface/50 rounded-md border border-brand-border/40">
                                                    {copiedId === coupon.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                            <p className="text-3xl font-bold text-white mt-2">
                                                {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}% OFF` : `R$ ${coupon.value.toFixed(2)}`}
                                            </p>
                                        </div>

                                        <div className="border-t border-dashed border-brand-border/50 pt-4 space-y-2 px-2">
                                            {coupon.minValue && (
                                                <div className="flex items-center gap-2 text-xs text-brand-muted font-medium">
                                                    <DollarSign className="w-3.5 h-3.5" />
                                                    <span>Mínimo: R$ {coupon.minValue.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {coupon.validUntil && (
                                                <div className="flex items-center gap-2 text-xs text-brand-muted font-medium">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>Até {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-brand-muted font-medium">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                <span>{coupon.singleUse ? 'Uso único' : 'Uso ilimitado'}</span>
                                            </div>
                                            {coupon.usedBy && (
                                                <div className="mt-3 pt-3 border-t border-brand-border/30 text-xs text-brand-muted">
                                                    Usado por: <strong className="text-white">{coupon.usedBy.name}</strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* PAINEL LATERAL DE CRIAÇÃO */}
                    {isCreating && (
                        <div className="w-96 flex-shrink-0 bg-[#0A0A0B]/80 glass-panel p-6 rounded-2xl border border-brand-border/40 animate-slide-in-right h-fit sticky top-0">
                            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-brand-neon" /> Criar Novo Cupom
                            </h2>
                            
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-1.5 ml-1">Código do Cupom *</label>
                                    <div className="flex gap-2">
                                        <input 
                                            required
                                            value={formData.code}
                                            onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                            className="w-full bg-[#111113] border border-brand-border/60 rounded-xl px-4 py-2.5 text-white focus:border-brand-neon outline-none uppercase text-sm shadow-inner"
                                            placeholder="EX: VERAO2026"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={generateRandomCode}
                                            className="bg-[#111113] border border-brand-border/60 rounded-xl px-4 hover:text-brand-neon hover:border-brand-neon/50 transition-colors shadow-inner"
                                            title="Gerar Aleatório"
                                        >
                                            <Ticket className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-1.5 ml-1">Tipo</label>
                                        <select 
                                            value={formData.discountType}
                                            onChange={e => setFormData({...formData, discountType: e.target.value as any})}
                                            className="w-full bg-[#111113] border border-brand-border/60 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-neon outline-none shadow-inner appearance-none"
                                        >
                                            <option value="PERCENTAGE">Porcentagem (%)</option>
                                            <option value="FIXED_VALUE">Valor Fixo (R$)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-1.5 ml-1">Valor *</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted">
                                                {formData.discountType === 'PERCENTAGE' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                            </div>
                                            <input 
                                                required
                                                type="number"
                                                step="0.01"
                                                value={formData.value}
                                                onChange={e => setFormData({...formData, value: e.target.value})}
                                                className="w-full bg-[#111113] border border-brand-border/60 rounded-xl pl-9 pr-4 py-3 text-white text-sm focus:border-brand-neon outline-none shadow-inner"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-1.5 ml-1">Valor Mínimo (Opcional)</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        value={formData.minValue}
                                        onChange={e => setFormData({...formData, minValue: e.target.value})}
                                        className="w-full bg-[#111113] border border-brand-border/60 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-neon outline-none shadow-inner"
                                        placeholder="Ex: 500.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-1.5 ml-1">Validade (Opcional)</label>
                                    <input 
                                        type="date"
                                        value={formData.validUntil}
                                        onChange={e => setFormData({...formData, validUntil: e.target.value})}
                                        className="w-full bg-[#111113] border border-brand-border/60 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-neon outline-none [color-scheme:dark] shadow-inner"
                                    />
                                </div>

                                <label className="flex items-center gap-3 p-4 bg-[#111113] border border-brand-border/40 rounded-xl cursor-pointer hover:border-brand-neon/50 transition-colors shadow-inner mt-2">
                                    <input 
                                        type="checkbox"
                                        checked={formData.singleUse}
                                        onChange={e => setFormData({...formData, singleUse: e.target.checked})}
                                        className="w-4 h-4 accent-brand-neon"
                                    />
                                    <span className="text-sm font-bold text-brand-text">Uso único por cliente</span>
                                </label>

                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full bg-brand-neon text-[#0A0A0B] font-black uppercase tracking-widest text-[13px] py-4 rounded-xl hover:bg-[#FF5E00]/90 transition-all mt-4 flex items-center justify-center shadow-[0_10px_25px_rgba(255,94,0,0.3)] active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gerar Cupom'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================================= */}
            {/* VIEWPORT: MOBILE (APP PATTERN NATIVO)                       */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full h-full relative">
                
                {/* Cabeçalho Mobile */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-brand-neon" /> Cupons
                        </h1>
                        <p className="text-[11px] text-brand-muted mt-0.5">Gerencie os descontos</p>
                    </div>
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="w-10 h-10 bg-brand-neon text-[#0A0A0B] rounded-full flex items-center justify-center shadow-lg shadow-brand-neon/20 active:scale-95 transition-transform"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Lista de Cupons (Stack) */}
                <div className="flex flex-col gap-4 relative z-10">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-3" />
                            <span className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">Carregando...</span>
                        </div>
                    ) : coupons.length === 0 ? (
                        <div className="bg-[#111113]/50 border border-brand-border/20 rounded-2xl p-8 flex flex-col items-center text-center mt-2">
                            <Ticket className="w-10 h-10 text-brand-border mb-3" />
                            <h3 className="text-sm font-bold text-white mb-1">Nenhum cupom</h3>
                            <p className="text-[11px] text-brand-muted">Crie seu primeiro código promocional clicando no botão (+).</p>
                        </div>
                    ) : (
                        coupons.map(coupon => (
                            <div key={coupon.id} className="bg-[#111113] border border-white/5 rounded-[20px] p-5 flex flex-col shadow-md relative overflow-hidden">
                                
                                {/* Entalhe de Ticket (Design) */}
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#050505] rounded-full border-r border-white/5"></div>
                                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#050505] rounded-full border-l border-white/5"></div>
                                
                                <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-3">
                                    {getStatus(coupon)}
                                    <button 
                                        onClick={() => handleDelete(coupon.id)}
                                        className="p-2 bg-brand-surface/50 border border-brand-border/40 text-brand-muted hover:text-red-500 rounded-lg active:scale-95 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="text-center mb-5">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <h3 className="text-[22px] font-black text-brand-neon tracking-widest leading-none">{coupon.code}</h3>
                                        <button onClick={() => copyToClipboard(coupon.id, coupon.code)} className="text-brand-muted bg-[#0A0A0B] border border-white/5 p-2 rounded-lg active:bg-[#111113]">
                                            {copiedId === coupon.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                    <p className="text-[28px] font-bold text-white mt-1 leading-none">
                                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}% OFF` : `R$ ${coupon.value.toFixed(2)}`}
                                    </p>
                                </div>

                                <div className="border-t border-dashed border-brand-border/40 pt-4 flex flex-col gap-2 px-2">
                                    {coupon.minValue && (
                                        <div className="flex items-center gap-2 text-[11px] text-brand-muted font-medium">
                                            <DollarSign className="w-3.5 h-3.5 text-brand-border" />
                                            <span>Mínimo: R$ {coupon.minValue.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {coupon.validUntil && (
                                        <div className="flex items-center gap-2 text-[11px] text-brand-muted font-medium">
                                            <Calendar className="w-3.5 h-3.5 text-brand-border" />
                                            <span>Até {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-[11px] text-brand-muted font-medium">
                                        <AlertCircle className="w-3.5 h-3.5 text-brand-border" />
                                        <span>{coupon.singleUse ? 'Uso único' : 'Uso ilimitado'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Bloco Espaçador Fantasma para Mobile */}
                <div className="h-[200px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
            </div>

            {/* ========================================================= */}
            {/* MODAL GLOBAL (CRIAÇÃO NO MOBILE)                            */}
            {/* ========================================================= */}
            {isCreating && (
                <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#0A0A0B]/80 backdrop-blur-md lg:hidden">
                    <div className="bg-[#121214] border-t border-brand-border/40 rounded-t-[32px] p-5 w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative animate-slide-up pb-safe">
                        
                        <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#121214] z-10 pb-2">
                            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                <Plus className="w-5 h-5 text-brand-neon" /> Novo Cupom
                            </h3>
                            <button onClick={() => setIsCreating(false)} className="p-2 bg-[#0A0A0B] rounded-full border border-white/5 text-brand-muted hover:text-white transition-colors active:scale-95">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreate} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 ml-1">Código do Cupom *</label>
                                <div className="flex gap-2">
                                    <input 
                                        required
                                        value={formData.code}
                                        onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                        className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl px-4 py-3.5 text-[13px] text-white focus:outline-none focus:border-brand-neon uppercase shadow-inner"
                                        placeholder="EX: VERAO2026"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={generateRandomCode}
                                        className="bg-[#0A0A0B] border border-brand-border/40 rounded-xl px-4 active:scale-95 transition-transform shadow-inner flex items-center justify-center text-brand-muted"
                                    >
                                        <Ticket className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 ml-1">Tipo</label>
                                    <select 
                                        value={formData.discountType}
                                        onChange={e => setFormData({...formData, discountType: e.target.value as any})}
                                        className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl px-4 py-3.5 text-[13px] text-white focus:outline-none focus:border-brand-neon shadow-inner appearance-none"
                                    >
                                        <option value="PERCENTAGE">Porcentagem (%)</option>
                                        <option value="FIXED_VALUE">Valor Fixo (R$)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 ml-1">Valor *</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted">
                                            {formData.discountType === 'PERCENTAGE' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                        </div>
                                        <input 
                                            required
                                            type="number"
                                            step="0.01"
                                            value={formData.value}
                                            onChange={e => setFormData({...formData, value: e.target.value})}
                                            className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl pl-9 pr-4 py-3.5 text-[13px] text-white focus:outline-none focus:border-brand-neon shadow-inner"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 ml-1">Valor Mínimo (Opcional)</label>
                                <input 
                                    type="number"
                                    step="0.01"
                                    value={formData.minValue}
                                    onChange={e => setFormData({...formData, minValue: e.target.value})}
                                    className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl px-4 py-3.5 text-[13px] text-white focus:outline-none focus:border-brand-neon shadow-inner"
                                    placeholder="Ex: 500.00"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 ml-1">Validade (Opcional)</label>
                                <input 
                                    type="date"
                                    value={formData.validUntil}
                                    onChange={e => setFormData({...formData, validUntil: e.target.value})}
                                    className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl px-4 py-3.5 text-[13px] text-white focus:outline-none focus:border-brand-neon [color-scheme:dark] shadow-inner"
                                />
                            </div>

                            <label className="flex items-center gap-3 p-4 bg-[#0A0A0B] border border-brand-border/40 rounded-xl cursor-pointer active:bg-brand-surface transition-colors shadow-inner mt-2">
                                <input 
                                    type="checkbox"
                                    checked={formData.singleUse}
                                    onChange={e => setFormData({...formData, singleUse: e.target.checked})}
                                    className="w-4 h-4 accent-brand-neon"
                                />
                                <span className="text-sm font-bold text-brand-text">Uso único por cliente</span>
                            </label>

                            <button 
                                type="submit"
                                disabled={isSubmitting} 
                                className="w-full bg-brand-neon text-[#0A0A0B] font-black uppercase tracking-widest text-[13px] py-4 rounded-xl hover:bg-[#FF5E00]/90 transition-all mt-4 flex items-center justify-center shadow-[0_10px_25px_rgba(255,94,0,0.3)] active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gerar Cupom'}
                            </button>
                        </form>
                        
                        {/* Bloco Espaçador Fantasma Interno ao Modal */}
                        <div className="h-[40px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
                    </div>
                </div>
            )}
        </div>
    );
}