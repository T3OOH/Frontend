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

    useEffect(() => {
        fetchCoupons();
    }, []);

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

    const copyToClipboard = (id: string, code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        addToast("Código copiado para a área de transferência!", "success");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const generateRandomCode = () => {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        setFormData(prev => ({ ...prev, code }));
    };

    const getStatus = (coupon: Coupon) => {
        if (coupon.isUsed) return <span className="text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 px-2.5 py-1 rounded-md border border-red-500/20">Usado</span>;
        if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) return <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-background text-brand-muted px-2.5 py-1 rounded-md border border-brand-border">Expirado</span>;
        return <span className="text-[10px] font-bold uppercase tracking-widest bg-[#25D366]/10 text-[#25D366] px-2.5 py-1 rounded-md border border-[#25D366]/20">Ativo</span>;
    };

    return (
        <div className="w-full h-full flex flex-col relative gap-6">

            {/* ========================================================= */}
            {/* VIEWPORT: DESKTOP                                         */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-7xl mx-auto w-full animate-fade-in gap-6">
                
                {/* CABEÇALHO */}
                <div className="flex-shrink-0 flex justify-between items-center bg-brand-surface p-6 rounded-[24px] border border-brand-border shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-neon/10 flex items-center justify-center border border-brand-neon/20">
                            <Ticket className="w-6 h-6 text-brand-neon" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-brand-text tracking-tight">Cupons & Descontos</h1>
                            <p className="text-sm text-brand-muted font-medium">Gerencie códigos promocionais para seus clientes.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-2 bg-brand-neon text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-neonHover transition-all shadow-sm hover:shadow-[0_0_20px_rgba(255,94,0,0.3)]"
                    >
                        {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {isCreating ? 'Cancelar Criação' : 'Novo Cupom'}
                    </button>
                </div>

                <div className="flex flex-1 min-h-0 gap-6 items-start">
                    
                    {/* GRID DE CUPONS */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 h-full pb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {isLoading ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-4" />
                                    <span className="text-sm font-bold tracking-widest uppercase text-brand-muted">Carregando cupons...</span>
                                </div>
                            ) : coupons.length === 0 ? (
                                <div className="col-span-full text-center py-20 border-2 border-dashed border-brand-border rounded-[24px] bg-brand-background/50">
                                    <Ticket className="w-10 h-10 text-brand-muted mx-auto mb-3 opacity-50" />
                                    <h3 className="text-brand-text font-bold text-lg mb-1">Nenhum cupom gerado</h3>
                                    <p className="text-sm text-brand-muted font-medium">Crie seu primeiro código de desconto no painel.</p>
                                </div>
                            ) : (
                                coupons.map(coupon => (
                                    <div key={coupon.id} className="bg-brand-surface border border-brand-border rounded-[24px] p-6 relative overflow-hidden group hover:border-brand-neon/40 transition-all shadow-sm">
                                        
                                        {/* Entalhes Laterais (Ticket Effect) */}
                                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-background rounded-full border-r border-brand-border"></div>
                                        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-background rounded-full border-l border-brand-border"></div>
                                        
                                        <div className="flex justify-between items-start mb-5 px-2 relative z-10">
                                            {getStatus(coupon)}
                                            <button 
                                                onClick={() => handleDelete(coupon.id)}
                                                className="text-brand-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-background p-2 rounded-lg border border-brand-border"
                                                title="Excluir Cupom"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="text-center mb-6 relative z-10">
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <h3 className="text-[24px] font-black text-brand-neon tracking-widest">{coupon.code}</h3>
                                                <button onClick={() => copyToClipboard(coupon.id, coupon.code)} className="text-brand-muted hover:text-brand-text transition-colors p-2 bg-brand-background rounded-lg border border-brand-border">
                                                    {copiedId === coupon.id ? <Check className="w-4 h-4 text-[#25D366]" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-3xl font-bold text-brand-text mt-2 tracking-tight">
                                                {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}% OFF` : `R$ ${coupon.value.toFixed(2)}`}
                                            </p>
                                        </div>

                                        <div className="border-t border-dashed border-brand-border pt-5 space-y-2.5 px-3 relative z-10">
                                            {coupon.minValue && (
                                                <div className="flex items-center gap-2 text-[12px] text-brand-muted font-bold">
                                                    <DollarSign className="w-4 h-4 text-brand-neon" />
                                                    <span>Mínimo: R$ {coupon.minValue.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {coupon.validUntil && (
                                                <div className="flex items-center gap-2 text-[12px] text-brand-muted font-bold">
                                                    <Calendar className="w-4 h-4 text-brand-neon" />
                                                    <span>Até {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-[12px] text-brand-muted font-bold">
                                                <AlertCircle className="w-4 h-4 text-brand-neon" />
                                                <span>{coupon.singleUse ? 'Uso único por cliente' : 'Uso ilimitado'}</span>
                                            </div>
                                            {coupon.usedBy && (
                                                <div className="mt-4 pt-4 border-t border-brand-border text-xs text-brand-muted font-medium">
                                                    Usado por: <strong className="text-brand-text font-bold">{coupon.usedBy.name}</strong>
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
                        <div className="w-[380px] flex-shrink-0 bg-brand-surface p-8 rounded-[24px] border border-brand-border shadow-sm animate-slide-in-right h-fit sticky top-0 transition-colors">
                            <h2 className="text-lg font-bold text-brand-text mb-6 flex items-center gap-2 border-b border-brand-border pb-4">
                                <Plus className="w-5 h-5 text-brand-neon" /> Novo Cupom
                            </h2>
                            
                            <form onSubmit={handleCreate} className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-1.5 ml-1">Código do Cupom *</label>
                                    <div className="flex gap-2">
                                        <input 
                                            required
                                            value={formData.code}
                                            onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                            className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3.5 text-brand-text focus:border-brand-neon outline-none uppercase text-sm shadow-sm transition-colors"
                                            placeholder="EX: VERAO2026"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={generateRandomCode}
                                            className="bg-brand-background border border-brand-border rounded-xl px-4 text-brand-muted hover:text-brand-neon hover:border-brand-neon transition-colors shadow-sm"
                                            title="Gerar Aleatório"
                                        >
                                            <Ticket className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-1.5 ml-1">Tipo</label>
                                        <select 
                                            value={formData.discountType}
                                            onChange={e => setFormData({...formData, discountType: e.target.value as any})}
                                            className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3.5 text-brand-text text-sm focus:border-brand-neon outline-none shadow-sm appearance-none transition-colors"
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
                                                className="w-full bg-brand-background border border-brand-border rounded-xl pl-9 pr-4 py-3.5 text-brand-text text-sm focus:border-brand-neon outline-none shadow-sm transition-colors"
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
                                        className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3.5 text-brand-text text-sm focus:border-brand-neon outline-none shadow-sm transition-colors"
                                        placeholder="Ex: 500.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-1.5 ml-1">Validade (Opcional)</label>
                                    <input 
                                        type="date"
                                        value={formData.validUntil}
                                        onChange={e => setFormData({...formData, validUntil: e.target.value})}
                                        className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3.5 text-brand-text text-sm focus:border-brand-neon outline-none shadow-sm transition-colors"
                                    />
                                </div>

                                <label className="flex items-center gap-3 p-4 bg-brand-background border border-brand-border rounded-xl cursor-pointer hover:border-brand-neon/50 transition-colors shadow-sm mt-2">
                                    <input 
                                        type="checkbox"
                                        checked={formData.singleUse}
                                        onChange={e => setFormData({...formData, singleUse: e.target.checked})}
                                        className="w-5 h-5 accent-brand-neon"
                                    />
                                    <span className="text-sm font-bold text-brand-text">Uso único por cliente</span>
                                </label>

                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full bg-brand-neon text-white font-bold uppercase tracking-widest text-[13px] py-4 rounded-xl hover:bg-brand-neonHover transition-all mt-4 flex items-center justify-center shadow-md active:scale-[0.98] disabled:opacity-50"
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
            <div className="flex lg:hidden flex-col w-full h-full relative gap-4 pb-[100px]">
                
                {/* Cabeçalho Mobile */}
                <div className="flex items-center justify-between mt-2 px-4">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-text tracking-tight flex items-center gap-2">
                            Cupons
                        </h1>
                        <p className="text-[11px] text-brand-muted font-medium mt-0.5">Gerencie os descontos</p>
                    </div>
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="w-12 h-12 bg-brand-neon text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                {/* Lista de Cupons (Stack) */}
                <div className="flex flex-col gap-4 px-4 relative z-10">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-3" />
                            <span className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">Carregando...</span>
                        </div>
                    ) : coupons.length === 0 ? (
                        <div className="bg-brand-surface border border-brand-border rounded-[24px] p-8 flex flex-col items-center text-center shadow-sm">
                            <Ticket className="w-10 h-10 text-brand-muted mb-3 opacity-50" />
                            <h3 className="text-sm font-bold text-brand-text mb-1">Nenhum cupom</h3>
                            <p className="text-[11px] text-brand-muted font-medium">Crie seu primeiro código clicando no botão (+).</p>
                        </div>
                    ) : (
                        coupons.map(coupon => (
                            <div key={coupon.id} className="bg-brand-surface border border-brand-border rounded-[24px] p-6 flex flex-col shadow-sm relative overflow-hidden transition-colors">
                                
                                {/* Entalhe de Ticket (Design) */}
                                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-background rounded-full border-r border-brand-border"></div>
                                <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-background rounded-full border-l border-brand-border"></div>
                                
                                <div className="flex justify-between items-start mb-4 border-b border-brand-border pb-4 px-1">
                                    {getStatus(coupon)}
                                    <button 
                                        onClick={() => handleDelete(coupon.id)}
                                        className="p-2 bg-brand-background border border-brand-border text-brand-muted hover:text-red-500 rounded-lg active:scale-95 transition-all shadow-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="text-center mb-6">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <h3 className="text-[22px] font-black text-brand-neon tracking-widest leading-none">{coupon.code}</h3>
                                        <button onClick={() => copyToClipboard(coupon.id, coupon.code)} className="text-brand-muted hover:text-brand-text bg-brand-background border border-brand-border p-2 rounded-lg active:scale-95 shadow-sm transition-colors">
                                            {copiedId === coupon.id ? <Check className="w-4 h-4 text-[#25D366]" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[28px] font-bold text-brand-text mt-2 leading-none tracking-tight">
                                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}% OFF` : `R$ ${coupon.value.toFixed(2)}`}
                                    </p>
                                </div>

                                <div className="border-t border-dashed border-brand-border pt-5 flex flex-col gap-2.5 px-2 relative z-10">
                                    {coupon.minValue && (
                                        <div className="flex items-center gap-2 text-[12px] text-brand-muted font-bold">
                                            <DollarSign className="w-4 h-4 text-brand-neon" />
                                            <span>Mínimo: R$ {coupon.minValue.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {coupon.validUntil && (
                                        <div className="flex items-center gap-2 text-[12px] text-brand-muted font-bold">
                                            <Calendar className="w-4 h-4 text-brand-neon" />
                                            <span>Até {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-[12px] text-brand-muted font-bold">
                                        <AlertCircle className="w-4 h-4 text-brand-neon" />
                                        <span>{coupon.singleUse ? 'Uso único' : 'Uso ilimitado'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ========================================================= */}
            {/* MODAL GLOBAL (CRIAÇÃO NO MOBILE)                            */}
            {/* ========================================================= */}
            {isCreating && (
                <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-brand-background/80 backdrop-blur-md lg:hidden">
                    <div className="bg-brand-surface border-t border-brand-border rounded-t-[32px] p-6 w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl relative animate-slide-up pb-safe transition-colors">
                        
                        <div className="flex items-center justify-between mb-6 sticky top-0 bg-brand-surface z-10 pb-4 border-b border-brand-border">
                            <h3 className="text-lg font-bold text-brand-text tracking-tight flex items-center gap-2">
                                <Plus className="w-5 h-5 text-brand-neon" /> Novo Cupom
                            </h3>
                            <button onClick={() => setIsCreating(false)} className="p-2 bg-brand-background rounded-full border border-brand-border text-brand-muted hover:text-brand-text transition-colors shadow-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreate} className="flex flex-col gap-5">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 ml-1">Código do Cupom *</label>
                                <div className="flex gap-2">
                                    <input 
                                        required
                                        value={formData.code}
                                        onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                        className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3.5 text-[14px] text-brand-text focus:outline-none focus:border-brand-neon uppercase shadow-sm transition-colors"
                                        placeholder="EX: VERAO2026"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={generateRandomCode}
                                        className="bg-brand-background border border-brand-border rounded-xl px-4 active:scale-95 transition-transform shadow-sm flex items-center justify-center text-brand-muted hover:text-brand-neon"
                                    >
                                        <Ticket className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 ml-1">Tipo</label>
                                    <select 
                                        value={formData.discountType}
                                        onChange={e => setFormData({...formData, discountType: e.target.value as any})}
                                        className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3.5 text-[14px] text-brand-text focus:outline-none focus:border-brand-neon shadow-sm appearance-none transition-colors"
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
                                            className="w-full bg-brand-background border border-brand-border rounded-xl pl-9 pr-4 py-3.5 text-[14px] text-brand-text focus:outline-none focus:border-brand-neon shadow-sm transition-colors"
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
                                    className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3.5 text-[14px] text-brand-text focus:outline-none focus:border-brand-neon shadow-sm transition-colors"
                                    placeholder="Ex: 500.00"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 ml-1">Validade (Opcional)</label>
                                <input 
                                    type="date"
                                    value={formData.validUntil}
                                    onChange={e => setFormData({...formData, validUntil: e.target.value})}
                                    className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3.5 text-[14px] text-brand-text focus:outline-none focus:border-brand-neon shadow-sm transition-colors"
                                />
                            </div>

                            <label className="flex items-center gap-3 p-4 bg-brand-background border border-brand-border rounded-xl cursor-pointer hover:border-brand-neon/50 transition-colors shadow-sm mt-2">
                                <input 
                                    type="checkbox"
                                    checked={formData.singleUse}
                                    onChange={e => setFormData({...formData, singleUse: e.target.checked})}
                                    className="w-5 h-5 accent-brand-neon"
                                />
                                <span className="text-sm font-bold text-brand-text">Uso único por cliente</span>
                            </label>

                            <button 
                                type="submit"
                                disabled={isSubmitting} 
                                className="w-full bg-brand-neon text-white font-bold uppercase tracking-widest text-[14px] py-4 rounded-xl hover:bg-brand-neonHover transition-all mt-4 flex items-center justify-center shadow-md active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gerar Cupom'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}