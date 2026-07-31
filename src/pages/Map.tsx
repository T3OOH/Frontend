import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { InteractiveMap } from '@/features/map/InteractiveMap';
import { 
    Loader2, Search, X, ChevronLeft, ShoppingCart, Check, Send, 
    Zap, MapPin, Maximize, Minimize, Compass, Shield, MonitorPlay,
    Ticket, CalendarDays, Tag, CheckCircle2, MessageCircle, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { api } from '@/lib/axios';
import { panelsService } from '@/services/panels.service';
import { useCart, Panel } from '@/contexts/CartContext';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { CustomSelect } from '@/components/CustomSelect';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext'; 

export function Map() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { cart, toggleInCart, isInCart, clearCart } = useCart();
    const { addToast } = useToast();
    const { user } = useAuth();

    const [panels, setPanels] = useState<Panel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(searchParams.get('checkout') === 'true');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estado para o modo Tela Cheia
    const [isFullscreen, setIsFullscreen] = useState(false);

    // ============================================================================
    // ESTADOS UNIFICADOS DO CHECKOUT (CARRINHO + CRM)
    // ============================================================================
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'crm'>('cart');
    const [months, setMonths] = useState(1);
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number } | null>(null);
    const [checkoutForm, setCheckoutForm] = useState({ 
        name: '', email: '', phone: '', company: '', message: '' 
    });

    // Sincronização entre páginas (Map <-> Services) via LocalStorage
    useEffect(() => {
        const savedData = localStorage.getItem('@t3:checkoutSync');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.months) setMonths(parsed.months);
                if (parsed.appliedCoupon !== undefined) setAppliedCoupon(parsed.appliedCoupon);
                if (parsed.checkoutForm) setCheckoutForm(prev => ({ ...prev, ...parsed.checkoutForm }));
            } catch (e) {
                console.error("Erro ao ler sync do checkout:", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('@t3:checkoutSync', JSON.stringify({
            months, appliedCoupon, checkoutForm
        }));
    }, [months, appliedCoupon, checkoutForm]);

    // Efeito para travar o scroll da página quando em Fullscreen ou no Checkout
    useEffect(() => {
        if (isFullscreen || isCheckoutOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isFullscreen, isCheckoutOpen]);

    useEffect(() => {
        if (user && !checkoutForm.name) {
            const u = user as any; 
            setCheckoutForm(prev => ({
                ...prev,
                name: u.name || prev.name,
                email: u.email || prev.email,
                phone: u.phone || u.whatsapp || prev.phone,
                company: u.company || prev.company
            }));
        }
    }, [user, checkoutForm.name]);

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const formatImpacts = (rawImpacts: string | number) => {
        if (!rawImpacts) return '0';
        const strVal = String(rawImpacts).toLowerCase();
        
        let n = Number(strVal.replace(/\D/g, ''));
        
        if (strVal.includes('mil') && !strVal.includes('milh')) n *= 1000;
        else if (strVal.includes('mi') || strVal.includes('milh')) n *= 1000000;
        else if (strVal.includes('bi')) n *= 1000000000;

        if (n >= 1000000000) return (n / 1000000000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' bilhão';
        if (n >= 2000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' milhões';
        if (n >= 1000000) return '1 milhão';
        if (n >= 1000) return (n / 1000).toFixed(0) + ' mil';
        return n.toLocaleString('pt-BR');
    };

    useEffect(() => {
        const fetchPanels = async () => {
            try {
                setIsLoading(true);
                const data = await panelsService.getAllPanels();
                
                const validPanels = data
                    .filter((p: any) => p.status === 'AVAILABLE' && p.id)
                    .map((p: any) => ({
                        ...p,
                        id: p.id,
                        name: p.name || 'Sem Nome',
                        city: p.city || 'Desconhecida',
                        state: p.state || '',
                        lat: Number(p.lat) || 0, 
                        lng: Number(p.lng) || 0,
                        price: Number(p.price) || 0 
                    })) as Panel[];
                    
                setPanels(validPanels);
            } catch (error) {
                console.error("[Map] Fetch Panels Error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPanels();
    }, []);

    const stateOptions = useMemo(() => {
        const states = Array.from(new Set(panels.map(p => p.state).filter(Boolean))).sort();
        return [{ value: '', label: 'Todos os Estados' }, ...states.map(st => ({ value: st as string, label: st as string }))];
    }, [panels]);

    const cityOptions = useMemo(() => {
        const filtered = selectedState ? panels.filter(p => p.state === selectedState) : panels;
        const cities = Array.from(new Set(filtered.map(p => p.city).filter(Boolean))).sort();
        return [{ value: '', label: 'Todas as Cidades' }, ...cities.map(city => ({ value: city as string, label: city as string }))];
    }, [panels, selectedState]);

    const filteredPanels = panels.filter(panel => {
        const matchesSearch = panel.name?.toLowerCase().includes(searchTerm.toLowerCase()) || panel.city?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesState = selectedState ? panel.state === selectedState : true;
        const matchesCity = selectedCity ? panel.city === selectedCity : true;
        return matchesSearch && matchesState && matchesCity;
    });

    // ============================================================================
    // CÁLCULOS MATEMÁTICOS UNIFICADOS DO CHECKOUT
    // ============================================================================
    const monthOptions = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            value: String(i + 1),
            label: `${i + 1} ${i === 0 ? 'Mês' : 'Meses'}`
        }));
    }, []);

    const totalCartImpacts = cart.reduce((acc, cartItem) => {
        const livePanel = panels.find(p => p.id === cartItem.id);
        const impactToSum = livePanel ? livePanel.impacts : cartItem.impacts;
        const strVal = String(impactToSum || '').toLowerCase();
        let n = Number(strVal.replace(/\D/g, ''));
        if (strVal.includes('mil') && !strVal.includes('milh')) n *= 1000;
        else if (strVal.includes('mi') || strVal.includes('milh')) n *= 1000000;
        else if (strVal.includes('bi')) n *= 1000000000;
        return acc + n;
    }, 0);

    const baseMonthly = cart.reduce((acc, cartItem) => {
        const livePanel = panels.find(p => p.id === cartItem.id);
        return acc + (Number(livePanel ? livePanel.price : cartItem.price) || 0);
    }, 0);

    const volumeDiscount = cart.length > 1 ? baseMonthly * 0.10 : 0;
    const subtotalMonthly = baseMonthly - volumeDiscount;

    const totalContractValue = subtotalMonthly * months;
    const couponDiscount = appliedCoupon ? totalContractValue * appliedCoupon.discount : 0;
    const finalTotalValue = totalContractValue - couponDiscount;
    const finalMonthlyValue = finalTotalValue / months;

    const totalWithoutAnyDiscount = baseMonthly * months;
    const totalEconomy = totalWithoutAnyDiscount - finalTotalValue;

    const handleApplyCoupon = () => {
        if (!couponInput) return;
        if (couponInput.toUpperCase() === 'T3PRO') {
            setAppliedCoupon({ code: 'T3PRO', discount: 0.15 });
            addToast('Cupom Especial aplicado com sucesso! (15% OFF)', 'success');
        } else {
            addToast('Cupom inválido ou expirado.', 'error');
            setAppliedCoupon(null);
        }
    };

    const handleCRMSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const totalOriginalCartValue = cart.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
            const discountRatio = totalOriginalCartValue > 0 ? (finalMonthlyValue / totalOriginalCartValue) : 1;

            const structuredItems = cart.map(p => ({
                panelId: p.id,
                priceSnapshot: Number(p.price || 0) * discountRatio
            }));

            let extraNotes = checkoutForm.message;
            if (appliedCoupon || volumeDiscount > 0) {
                extraNotes += `\n\n[NOTAS DE DESCONTO]:`;
                if (appliedCoupon) extraNotes += ` Cupom ${appliedCoupon.code} (${appliedCoupon.discount * 100}% OFF).`;
                if (volumeDiscount > 0) extraNotes += ` Desconto de volume aplicado.`;
            }

            const payload = {
                clientDetails: {
                    name: checkoutForm.name,
                    email: checkoutForm.email,
                    phone: checkoutForm.phone,
                    company: checkoutForm.company,
                    message: extraNotes.trim()
                },
                contractMonths: months,
                originalValue: totalWithoutAnyDiscount,
                expectedValue: finalTotalValue,
                items: structuredItems,
                source: 'INTERACTIVE_MAP'
            };

            await api.post('/crm/deals/checkout', payload);

            addToast('Pedido enviado com sucesso! Nosso comercial entrará em contato.', 'success');
            clearCart();
            setIsCheckoutOpen(false);
            setCheckoutStep('cart');
            setCheckoutForm({ name: '', email: '', phone: '', company: '', message: '' });
            navigate('/dashboard');
        } catch (err: any) {
            console.error("Erro no Checkout:", err);
            const errorMsg = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Erro ao processar pedido. Verifique os dados informados.';
            addToast(errorMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={
            isFullscreen 
            ? "fixed inset-0 z-[9999] flex bg-[#0A0A0B] overflow-hidden" 
            : "flex-1 w-full flex bg-[#0A0A0B] relative overflow-hidden min-h-[calc(100vh-5rem)]"
        }>
            
            {/* --- MAPA BACKGROUND --- */}
            <div className="absolute inset-0 z-0 bg-brand-black">
                {isLoading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0A0A0B]/80 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-4" />
                        <p className="text-sm font-medium tracking-wide text-brand-muted uppercase">Sincronizando Circuito...</p>
                    </div>
                ) : (
                    <InteractiveMap panels={panels} selectedPanelId={selectedPanelId} />
                )}
            </div>

            {/* --- BOTÃO FULLSCREEN (SOMENTE DESKTOP) --- */}
            {!isCheckoutOpen && (
                <div className="hidden md:flex absolute top-6 right-6 z-[400] pointer-events-auto">
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-3 bg-[#111113]/90 backdrop-blur-md border border-white/10 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.6)] text-white hover:text-[#FF5E00] hover:border-[#FF5E00]/50 transition-all"
                        title={isFullscreen ? "Sair da Tela Cheia" : "Travar Mapa em Tela Cheia"}
                    >
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                </div>
            )}

            {/* ========================================================= */}
            {/* DESKTOP LAYOUT                                            */}
            {/* ========================================================= */}
            
            {/* Botão Flutuante Desktop */}
            <AnimatePresence>
                {!isSidebarOpen && !isCheckoutOpen && (
                    <motion.button
                        key="reopen-sidebar-btn"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        onClick={() => setIsSidebarOpen(true)}
                        className="hidden md:flex absolute top-6 left-6 z-[100] bg-[#0A0A0B]/85 backdrop-blur-xl border border-brand-border/40 px-5 py-3 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.9)] hover:border-brand-neon transition-all items-center gap-3 group cursor-pointer"
                    >
                        <Search className="w-5 h-5 text-brand-neon group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold text-white tracking-wide">Buscar Painéis</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Sidebar Desktop (Busca) */}
            <AnimatePresence initial={false}>
                {isSidebarOpen && !isCheckoutOpen && (
                    <motion.div initial={{ x: '-120%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-120%', opacity: 0 }} className="hidden md:flex absolute top-4 left-4 bottom-4 w-96 bg-[#0A0A0B]/85 backdrop-blur-2xl border border-brand-border/40 z-40 flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-brand-border/30 bg-brand-surface/10 flex-shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white tracking-tight">Pontos Disponíveis</h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 bg-brand-surface/50 border border-brand-border/40 hover:text-brand-neon rounded-lg text-brand-muted transition-all">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted z-10" />
                                    <Input
                                        placeholder="Buscar por avenida..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-1/2">
                                        <CustomSelect
                                            options={stateOptions}
                                            value={selectedState}
                                            onChange={(val: string) => { setSelectedState(val); setSelectedCity(''); }}
                                            placeholder="Estado"
                                        />
                                    </div>
                                    <div className={`w-1/2 ${!selectedState ? 'opacity-40 pointer-events-none' : ''}`}>
                                        <CustomSelect
                                            options={cityOptions}
                                            value={selectedCity}
                                            onChange={(val: string) => setSelectedCity(val)}
                                            placeholder="Cidade"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {filteredPanels.map((panel) => {
                                const inCart = isInCart(panel.id);
                                const isSelected = selectedPanelId === panel.id; 

                                return (
                                    <div 
                                        key={panel.id} 
                                        className={`flex flex-col p-3.5 rounded-xl border mb-3 transition-all duration-300 ${
                                            isSelected 
                                            ? 'bg-brand-neon/10 border-brand-neon shadow-[0_0_20px_rgba(255,94,0,0.15)] scale-[1.02]' 
                                            : 'bg-brand-surface/20 border-brand-border/30 hover:bg-brand-surface/40'
                                        }`}
                                    >
                                        <div className="flex gap-3 cursor-pointer mb-3" onClick={() => setSelectedPanelId(panel.id)}>
                                            <div className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border relative transition-colors ${isSelected ? 'border-brand-neon' : 'border-brand-border/50'}`}>
                                                <img src={panel.images?.[0] || '/placeholder.jpg'} alt={panel.name} className="w-full h-full object-cover" />
                                            </div>
                                            
                                            <div className="flex-1 flex flex-col justify-between overflow-hidden">
                                                <h4 className={`text-sm font-bold leading-tight line-clamp-2 transition-colors ${isSelected ? 'text-brand-neon' : 'text-white'}`}>
                                                    {panel.name}
                                                </h4>
                                                
                                                <div className="flex flex-col gap-1 mt-auto">
                                                    <div className="flex items-center gap-1.5 w-full">
                                                        <Zap className="w-4 h-4 text-[#FF5E00] flex-shrink-0 fill-[#FF5E00]" />
                                                        <span className="text-[17px] font-black text-[#FF5E00] tracking-tighter truncate">
                                                            {formatImpacts(panel.impacts || 0)}
                                                        </span>
                                                        <span className="text-[8px] text-[#FF5E00]/80 uppercase font-black leading-tight ml-auto text-right">
                                                            Impactos<br/>Diários
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between border-t border-brand-border/30 pt-1.5 mt-0.5">
                                                        <span className="text-[9px] text-brand-muted uppercase font-bold tracking-widest">Investimento</span>
                                                        <span className="text-xs font-semibold text-brand-muted">{formatCurrency(Number(panel.price) || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <Button
                                            variant={inCart ? 'secondary' : 'primary'}
                                            className="w-full text-xs py-2 h-auto"
                                            onClick={() => toggleInCart(panel)}
                                        >
                                            {inCart ? <><Check className="w-3.5 h-3.5 mr-1" /> Selecionado</> : 'Adicionar ao Orçamento'}
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>

                        <AnimatePresence>
                            {cart.length > 0 && (
                                <motion.div className="p-4 border-t border-brand-border/40 flex-shrink-0">
                                    <Button onClick={() => setIsCheckoutOpen(true)} className="w-full py-4 text-sm font-bold bg-brand-neon hover:bg-[#e05300] text-black shadow-[0_0_20px_rgba(255,94,0,0.3)]">
                                        <ShoppingCart className="w-5 h-5 mr-2" /> Solicitar Orçamento ({cart.length})
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ========================================================= */}
            {/* MOBILE LAYOUT (VISÃO LIMPA DE APLICATIVO)                   */}
            {/* ========================================================= */}
            
            {!isCheckoutOpen && (
                <>
                    {/* Barra de Pesquisa Superior Flutuante + Botão Fullscreen */}
                    <div className="md:hidden absolute top-4 left-4 right-4 z-[400] pointer-events-auto flex items-center gap-2">
                        <div className="flex-1 bg-[#111113]/95 backdrop-blur-xl border border-brand-border/40 rounded-full px-4 py-[11px] shadow-[0_8px_20px_rgba(0,0,0,0.6)] flex items-center gap-3 transition-all focus-within:border-brand-neon/50">
                            <Search className="w-5 h-5 text-brand-neon flex-shrink-0" />
                            <input 
                                className="bg-transparent border-none text-white w-full focus:outline-none text-[13px] placeholder-brand-muted"
                                placeholder="Buscar avenida ou região..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="p-1.5 text-brand-muted hover:text-white flex-shrink-0 bg-brand-surface/50 rounded-full">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Botão Fullscreen Mobile */}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="flex-shrink-0 flex items-center justify-center w-[44px] h-[44px] bg-[#111113]/95 backdrop-blur-xl border border-brand-border/40 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.6)] text-white hover:text-[#FF5E00] transition-all"
                            title={isFullscreen ? "Sair da Tela Cheia" : "Travar Mapa em Tela Cheia"}
                        >
                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Container Inferior (Pílula de Carrinho + Cards Compactos) */}
                    <div className={`md:hidden absolute left-0 right-0 z-[400] pointer-events-none flex flex-col items-center justify-end pb-2 transition-all duration-300 ${isFullscreen ? 'bottom-4' : 'bottom-[76px]'}`}>
                        
                        {/* Botão de Solicitar Orçamento (Estilo Pill) */}
                        <AnimatePresence>
                            {cart.length > 0 && (
                                <motion.div 
                                    initial={{ y: 20, opacity: 0, scale: 0.9 }} 
                                    animate={{ y: 0, opacity: 1, scale: 1 }} 
                                    exit={{ y: 20, opacity: 0, scale: 0.9 }}
                                    className="pointer-events-auto mb-4"
                                >
                                    <Button onClick={() => setIsCheckoutOpen(true)} className="rounded-full bg-brand-neon text-[#0A0A0B] font-black py-3 px-6 shadow-[0_10px_30px_rgba(255,94,0,0.4)] text-[13px] flex justify-center items-center gap-2 border border-transparent">
                                        <ShoppingCart className="w-4 h-4" />
                                        Ver Carrinho ({cart.length})
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Cards Horizontais dos Painéis (Design Compacto Horizontal) */}
                        <div className="w-full pointer-events-auto">
                            <div className="flex gap-3 overflow-x-auto snap-x custom-scrollbar px-4 pb-2">
                                {filteredPanels.map(panel => {
                                    const inCart = isInCart(panel.id);
                                    const isSelected = selectedPanelId === panel.id;

                                    return (
                                        <div 
                                            key={panel.id}
                                            onClick={() => setSelectedPanelId(panel.id)}
                                            className={`snap-start flex-shrink-0 w-[290px] h-[110px] bg-[#111113]/95 backdrop-blur-xl rounded-2xl overflow-hidden border transition-all shadow-xl flex flex-row ${
                                                isSelected ? 'border-brand-neon shadow-[0_0_15px_rgba(255,94,0,0.15)] scale-[1.02]' : 'border-white/10'
                                            }`}
                                        >
                                            {/* Imagem Pequena Esquerda */}
                                            <div className="w-[100px] h-full bg-black relative flex-shrink-0">
                                                <img src={panel.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover opacity-90" alt={panel.name} />
                                                <div className="absolute top-1.5 left-1.5 bg-[#0A0A0B]/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-1">
                                                    <Zap className="w-2.5 h-2.5 text-brand-neon" />
                                                    <span className="text-[9px] font-black text-white tracking-widest">{formatImpacts(panel.impacts || 0)}</span>
                                                </div>
                                            </div>

                                            {/* Informações Direita */}
                                            <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
                                                <div>
                                                    <h4 className="text-[13px] font-bold text-white line-clamp-2 leading-tight mb-1 pr-1">{panel.name}</h4>
                                                    <p className="text-[10px] text-brand-muted flex items-center gap-1 truncate">
                                                        <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{panel.city}</span>
                                                    </p>
                                                </div>
                                                
                                                <div className="flex justify-between items-center mt-1 border-t border-brand-border/20 pt-1.5">
                                                    <span className="text-sm font-black text-brand-neon tracking-tight">{formatCurrency(Number(panel.price) || 0)}</span>
                                                    
                                                    {/* Botão de Carrinho (Ícone) Reduzido para despoluir */}
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); toggleInCart(panel); }}
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors flex-shrink-0 ${
                                                            inCart 
                                                            ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                                                            : 'bg-brand-neon text-black'
                                                        }`}
                                                    >
                                                        {inCart ? <X className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Bottom Navigation Nativa (Oculta se Checkout Aberto ou em Fullscreen) */}
            {!isCheckoutOpen && !isFullscreen && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-2xl border-t border-brand-border/20 z-[500] px-6 py-3 flex justify-between items-center pb-safe">
                    <Link to="/" className="flex flex-col items-center gap-1 text-brand-muted hover:text-white transition-colors">
                        <Compass className="w-5 h-5" />
                        <span className="text-[9px] font-medium">Explorar</span>
                    </Link>
                    <Link to="/mapa" className="flex flex-col items-center gap-1 text-brand-neon">
                        <MapPin className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Mapa</span>
                    </Link>
                    <Link to="/servicos" className="flex flex-col items-center gap-1 text-brand-muted hover:text-white transition-colors">
                        <MonitorPlay className="w-5 h-5" />
                        <span className="text-[9px] font-medium">Painéis</span>
                    </Link>
                    <Link to="/contato" className="flex flex-col items-center gap-1 text-brand-muted hover:text-white transition-colors">
                        <Shield className="w-5 h-5" />
                        <span className="text-[9px] font-medium">Contato</span>
                    </Link>
                </div>
            )}

            {/* ========================================================= */}
            {/* CHECKOUT MODAL (UNIFICADO COM SERVICES)                     */}
            {/* ========================================================= */}
            
            <AnimatePresence>
                {isCheckoutOpen && (
                    <motion.div 
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 h-full w-full md:w-[480px] bg-[#0A0A0B] border-l border-white/10 z-[99999] flex flex-col shadow-2xl"
                    >
                        {/* HEADER DINÂMICO */}
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#111113] shrink-0 pt-[env(safe-area-inset-top,20px)] z-20 relative">
                            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-3">
                                {checkoutStep === 'cart' ? (
                                    <><ShoppingCart className="w-5 h-5 text-[#FF5E00]" /> Resumo do Pedido</>
                                ) : (
                                    <><Send className="w-5 h-5 text-[#FF5E00]" /> Finalizar Pedido CRM</>
                                )}
                            </h2>
                            <button onClick={() => { setIsCheckoutOpen(false); setCheckoutStep('cart'); }} className="text-brand-muted hover:text-white bg-[#0A0A0B] p-2 rounded-full border border-white/5">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* BODY DINÂMICO */}
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar relative z-10">
                            {checkoutStep === 'cart' ? (
                                cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-60">
                                        <ShoppingCart className="w-12 h-12 text-brand-muted mb-4" />
                                        <p className="text-sm text-brand-muted">Seu carrinho de orçamentos está vazio.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4 pb-4">
                                        {cart.map((p, i) => (
                                            <div key={p.id} className="flex gap-4 p-4 bg-[#111113] border border-white/5 rounded-xl relative shadow-md">
                                                <div className="w-5 h-5 absolute -top-2 -left-2 bg-[#FF5E00] text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-md z-10">{i + 1}</div>
                                                <img src={p.images?.[0] || '/placeholder.jpg'} alt={p.name} className="w-16 h-16 rounded-lg object-cover bg-black" />
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <h4 className="text-sm font-bold text-white leading-tight mb-1 truncate pr-2">{p.name}</h4>
                                                    <p className="text-xs text-brand-muted mb-3"><MapPin className="w-3 h-3 inline-block -mt-0.5" /> {p.city}</p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-[#25D366]">{formatCurrency(Number(p.price))}</span>
                                                        <button onClick={() => toggleInCart(p)} className="text-[9px] text-[#ff4d4d] font-bold uppercase tracking-wider hover:text-white bg-[#ff4d4d]/10 hover:bg-[#ff4d4d]/30 px-3 py-1.5 rounded-md transition-colors">Remover</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <form onSubmit={handleCRMSubmit} className="flex flex-col gap-6 animate-fade-in pb-4">
                                    <div className="bg-[#111113] rounded-[16px] p-5 border border-white/5">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] text-brand-muted font-bold uppercase tracking-widest flex items-center gap-2"><LayoutGrid className="w-3.5 h-3.5" /> Painéis no Carrinho</span>
                                            <span className="bg-white/10 text-white text-xs font-bold px-2 py-0.5 rounded">{cart.length} unid</span>
                                        </div>
                                        <div className="border-t border-white/5 my-4" />
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-[#FF5E00] font-bold uppercase tracking-widest mb-1">Alcance Total (Diário)</span>
                                                <span className="text-xl font-black text-[#FF5E00]">{formatImpacts(totalCartImpacts)}</span>
                                            </div>
                                            <div className="flex flex-col items-end text-right">
                                                {totalEconomy > 0 && <span className="text-[10px] text-red-400 font-medium line-through mb-0.5">{formatCurrency(totalWithoutAnyDiscount)}</span>}
                                                <span className="text-[9px] text-brand-muted font-bold uppercase tracking-widest mb-1">Investimento (C/ Desconto)</span>
                                                <span className="text-xl font-black text-[#25D366] leading-none mb-1.5">{formatCurrency(finalTotalValue)}</span>
                                                {totalEconomy > 0 && <span className="text-[9px] font-black text-[#25D366] bg-[#25D366]/10 px-2 py-0.5 rounded uppercase tracking-wider">Economia: {formatCurrency(totalEconomy)}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Seus Dados de Contato</h3>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-brand-muted">Nome Completo *</label>
                                            <input type="text" required value={checkoutForm.name} onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })} className="bg-[#111113] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-brand-neon outline-none" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-brand-muted">E-mail *</label>
                                                <input type="email" required value={checkoutForm.email} onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })} className="bg-[#111113] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-brand-neon outline-none" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-brand-muted">WhatsApp *</label>
                                                <input type="text" required value={checkoutForm.phone} onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })} className="bg-[#111113] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-brand-neon outline-none" />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-brand-muted">Empresa / Agência</label>
                                            <input type="text" value={checkoutForm.company} onChange={(e) => setCheckoutForm({ ...checkoutForm, company: e.target.value })} className="bg-[#111113] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-brand-neon outline-none" />
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-brand-muted">Observações (Opcional)</label>
                                            <textarea rows={3} placeholder="Mencione condições de pagamento, datas da campanha, etc." value={checkoutForm.message} onChange={(e) => setCheckoutForm({ ...checkoutForm, message: e.target.value })} className="bg-[#111113] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-brand-neon outline-none resize-none" />
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* FOOTER DINÂMICO */}
                        {checkoutStep === 'cart' ? (
                            <div className="bg-[#0A0A0B] p-5 lg:p-6 border-t border-white/5 shrink-0 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20 relative">
                                <div className="flex flex-col w-full mb-4">
                                    <div className="flex flex-col gap-3 border-b border-white/5 pb-4 mb-4">
                                        <div className="grid grid-cols-2 gap-3 items-end">
                                            <div className="flex flex-col gap-1.5 relative z-50">
                                                <label className="text-[9px] text-brand-muted uppercase tracking-widest font-bold">Duração da Campanha</label>
                                                <CustomSelect
                                                    options={monthOptions}
                                                    value={String(months)}
                                                    onChange={(val: string) => setMonths(Number(val))}
                                                    placeholder="Duração"
                                                    icon={<CalendarDays className="w-4 h-4" />}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5 h-full">
                                                <label className="text-[9px] text-brand-muted uppercase tracking-widest font-bold">Cupom Promocional</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="CUPOM"
                                                        value={couponInput}
                                                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                                        className="w-full bg-[#111113] border border-white/10 rounded-xl px-3 text-white text-xs font-bold focus:border-brand-neon outline-none uppercase placeholder:normal-case placeholder:font-normal h-[42px]"
                                                        disabled={appliedCoupon !== null}
                                                    />
                                                    {appliedCoupon ? (
                                                        <Button onClick={() => { setAppliedCoupon(null); setCouponInput(''); }} variant="secondary" className="px-3 h-[42px] text-red-500 border-red-500/30 hover:bg-red-500/10"><X className="w-4 h-4" /></Button>
                                                    ) : (
                                                        <Button onClick={handleApplyCoupon} className="px-3 h-[42px] bg-white/10 text-white hover:bg-brand-neon hover:text-[#0A0A0B] border-none text-xs transition-colors"><Tag className="w-4 h-4" /></Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {appliedCoupon && <p className="text-[10px] text-[#25D366] mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Cupom <b>{appliedCoupon.code}</b> aplicado!</p>}
                                    </div>

                                    <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                                        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Impacto Total</p>
                                        <p className="text-xl font-black text-[#FF5E00]">{formatImpacts(totalCartImpacts || 0)}</p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Investimento Mensal</span>
                                            {totalEconomy > 0 && <span className="text-[10px] text-red-400 font-medium line-through mb-0.5">{formatCurrency(baseMonthly)}/mês</span>}
                                            <span className="text-2xl font-black text-[#25D366] leading-none">{formatCurrency(finalMonthlyValue)}</span>
                                            <span className="text-[10px] text-brand-muted mt-1.5 font-medium">Total Campanha ({months}x): {formatCurrency(finalTotalValue)}</span>
                                        </div>

                                        {totalEconomy > 0 && (
                                            <div className="flex flex-col items-end">
                                                <span className="bg-[#25D366]/10 text-[#25D366] text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border border-[#25D366]/20">
                                                    Economia de {formatCurrency(totalEconomy)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    disabled={cart.length === 0 || isSubmitting}
                                    onClick={() => setCheckoutStep('crm')}
                                    isLoading={isSubmitting}
                                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-[#0A0A0B] font-black py-4 rounded-xl shadow-[0_0_20px_rgba(37,211,102,0.3)] border-none uppercase tracking-widest text-sm"
                                >
                                    <MessageCircle className="w-5 h-5 mr-2" /> Finalizar Cotação
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-[#0A0A0B] p-5 lg:p-6 border-t border-white/5 shrink-0 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex flex-col gap-3 z-20 relative">
                                <button onClick={() => setCheckoutStep('cart')} className="w-full py-2 text-xs font-bold text-brand-muted hover:text-white uppercase tracking-widest transition-colors">Voltar para Resumo</button>
                                <Button
                                    onClick={handleCRMSubmit}
                                    disabled={isSubmitting || !checkoutForm.name || !checkoutForm.email || !checkoutForm.phone}
                                    className="w-full bg-[#FF5E00] hover:brightness-110 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(255,94,0,0.3)] border-none uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Ticket className="w-5 h-5" />}
                                    Gerar Ticket Comercial CRM
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}