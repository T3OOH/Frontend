import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/axios';
import { 
    Ticket, Plus, Trash2, Copy, Check, 
    Calendar, DollarSign, Percent, AlertCircle, X
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
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Form State
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
            const response = await api.get('/coupons');
            setCoupons(response.data);
        } catch (error) {
            console.error("Erro ao carregar cupons", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/coupons', {
                ...formData,
                creatorId: user?.id
            });
            setIsCreating(false);
            setFormData({ code: '', discountType: 'PERCENTAGE', value: '', minValue: '', validUntil: '', singleUse: true });
            fetchCoupons();
        } catch (error) {
            console.error("Erro ao criar cupom", error);
            alert("Erro ao criar cupom. Verifique se o código já existe.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cupom?')) return;
        try {
            await api.delete(`/coupons/${id}`);
            setCoupons(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Erro ao excluir", error);
        }
    };

    const copyToClipboard = (id: string, code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const generateRandomCode = () => {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        setFormData(prev => ({ ...prev, code }));
    };

    const getStatus = (coupon: Coupon) => {
        if (coupon.isUsed) return <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-md border border-red-500/30">Usado</span>;
        if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) return <span className="text-xs bg-brand-muted/20 text-brand-muted px-2 py-1 rounded-md border border-brand-border">Expirado</span>;
        return <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-md border border-green-500/30">Ativo</span>;
    };

    return (
        <div className="max-w-7xl mx-auto animate-fade-in space-y-6">
            {/* HEADER */}
            <div className="flex justify-between items-center bg-[#0A0A0B]/50 p-6 rounded-2xl border border-brand-border/40 glass-panel">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-neon/10 flex items-center justify-center border border-brand-neon/20">
                        <Ticket className="w-6 h-6 text-brand-neon" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Cupons & Descontos</h1>
                        <p className="text-sm text-brand-muted">Gerencie códigos promocionais para seus clientes</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 bg-brand-neon text-[#0A0A0B] px-5 py-2.5 rounded-xl font-semibold hover:bg-brand-neon/90 transition-all"
                >
                    {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isCreating ? 'Cancelar' : 'Novo Cupom'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                {/* FORMULÁRIO DE CRIAÇÃO (Side Panel) */}
                {isCreating && (
                    <div className="w-full lg:w-96 flex-shrink-0 bg-[#0A0A0B]/80 glass-panel p-6 rounded-2xl border border-brand-border/40 animate-slide-in-right">
                        <h2 className="text-lg font-bold text-white mb-6">Criar Novo Cupom</h2>
                        
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm text-brand-muted mb-1">Código do Cupom</label>
                                <div className="flex gap-2">
                                    <input 
                                        required
                                        value={formData.code}
                                        onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                        className="w-full bg-[#0A0A0B] border border-brand-border/60 rounded-xl px-4 py-2 text-white focus:border-brand-neon outline-none uppercase"
                                        placeholder="EX: VERAO2026"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={generateRandomCode}
                                        className="bg-brand-surface border border-brand-border rounded-xl px-3 hover:text-brand-neon transition-colors"
                                        title="Gerar Aleatório"
                                    >
                                        <Ticket className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-brand-muted mb-1">Tipo</label>
                                    <select 
                                        value={formData.discountType}
                                        onChange={e => setFormData({...formData, discountType: e.target.value as any})}
                                        className="w-full bg-[#0A0A0B] border border-brand-border/60 rounded-xl px-4 py-2.5 text-white focus:border-brand-neon outline-none"
                                    >
                                        <option value="PERCENTAGE">Porcentagem (%)</option>
                                        <option value="FIXED_VALUE">Valor Fixo (R$)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-brand-muted mb-1">Valor</label>
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
                                            className="w-full bg-[#0A0A0B] border border-brand-border/60 rounded-xl pl-9 pr-4 py-2 text-white focus:border-brand-neon outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-brand-muted mb-1">Valor Mínimo (Opcional)</label>
                                <input 
                                    type="number"
                                    step="0.01"
                                    value={formData.minValue}
                                    onChange={e => setFormData({...formData, minValue: e.target.value})}
                                    className="w-full bg-[#0A0A0B] border border-brand-border/60 rounded-xl px-4 py-2 text-white focus:border-brand-neon outline-none"
                                    placeholder="Ex: 500.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-brand-muted mb-1">Validade (Opcional)</label>
                                <input 
                                    type="date"
                                    value={formData.validUntil}
                                    onChange={e => setFormData({...formData, validUntil: e.target.value})}
                                    className="w-full bg-[#0A0A0B] border border-brand-border/60 rounded-xl px-4 py-2 text-white focus:border-brand-neon outline-none [color-scheme:dark]"
                                />
                            </div>

                            <label className="flex items-center gap-3 p-3 bg-brand-surface/30 border border-brand-border/40 rounded-xl cursor-pointer hover:border-brand-neon/50 transition-colors">
                                <input 
                                    type="checkbox"
                                    checked={formData.singleUse}
                                    onChange={e => setFormData({...formData, singleUse: e.target.checked})}
                                    className="w-4 h-4 accent-brand-neon"
                                />
                                <span className="text-sm text-brand-text">Uso único por cliente</span>
                            </label>

                            <button type="submit" className="w-full bg-brand-neon text-[#0A0A0B] font-bold py-3 rounded-xl hover:bg-brand-neon/90 transition-all mt-4">
                                Gerar Cupom
                            </button>
                        </form>
                    </div>
                )}

                {/* GRID DE CUPONS */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {isLoading ? (
                        <div className="col-span-full text-center py-12 text-brand-neon">Carregando cupons...</div>
                    ) : coupons.length === 0 ? (
                        <div className="col-span-full text-center py-12 border border-dashed border-brand-border/50 rounded-2xl text-brand-muted">
                            Nenhum cupom criado ainda.
                        </div>
                    ) : (
                        coupons.map(coupon => (
                            <div key={coupon.id} className="bg-gradient-to-br from-[#0A0A0B] to-brand-surface border border-brand-border/40 rounded-2xl p-5 relative overflow-hidden group hover:border-brand-neon/30 transition-all">
                                
                                {/* Efeito visual de ticket */}
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#040405] rounded-full border-r border-brand-border/40"></div>
                                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#040405] rounded-full border-l border-brand-border/40"></div>
                                
                                <div className="flex justify-between items-start mb-4 px-2">
                                    {getStatus(coupon)}
                                    <button 
                                        onClick={() => handleDelete(coupon.id)}
                                        className="text-brand-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="text-center mb-6">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <h3 className="text-2xl font-black text-brand-neon tracking-widest">{coupon.code}</h3>
                                        <button onClick={() => copyToClipboard(coupon.id, coupon.code)} className="text-brand-muted hover:text-white transition-colors">
                                            {copiedId === coupon.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-3xl font-bold text-white mt-2">
                                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}% OFF` : `R$ ${coupon.value.toFixed(2)}`}
                                    </p>
                                </div>

                                <div className="border-t border-dashed border-brand-border/50 pt-4 space-y-2 px-2">
                                    {coupon.minValue && (
                                        <div className="flex items-center gap-2 text-xs text-brand-muted">
                                            <DollarSign className="w-3.5 h-3.5" />
                                            <span>Mínimo: R$ {coupon.minValue.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {coupon.validUntil && (
                                        <div className="flex items-center gap-2 text-xs text-brand-muted">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>Até {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-brand-muted">
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
        </div>
    );
}