import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { InteractiveMap } from '@/features/map/InteractiveMap';
import { 
    Loader2, Search, X, ChevronLeft, ShoppingCart, Check, Send, 
    Zap, MapPin, Maximize, Minimize, Compass, Shield, MonitorPlay, Tag, CheckCircle2, LayoutGrid
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

/**
 * Interface Component: Map Integration & Interactive Catalog
 * Handles geo-spatial data visualization, complex state management for the shopping cart,
 * checkout flow synchronization, and responsive UI behaviors.
 */
export function Map() {
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
    
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Checkout Flow State Management
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'crm'>('cart');
    const [months, setMonths] = useState(1);
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number } | null>(null);
    const [checkoutForm, setCheckoutForm] = useState({ 
        name: '', email: '', phone: '', company: '', message: '' 
    });

    /**
     * LocalStorage Synchronization Hook.
     * Hydrates checkout state across component mounts and routing boundaries.
     */
    useEffect(() => {
        const savedData = localStorage.getItem('@t3:checkoutSync');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.months) setMonths(parsed.months);
                if (parsed.appliedCoupon !== undefined) setAppliedCoupon(parsed.appliedCoupon);
                if (parsed.checkoutForm) setCheckoutForm(prev => ({ ...prev, ...parsed.checkoutForm }));
            } catch (e) {
                console.error("State Hydration Error (Checkout):", e);
            }
        }
    }, []);

    /**
     * LocalStorage Persistence Hook.
     * Serializes checkout state to prevent data loss.
     */
    useEffect(() => {
        localStorage.setItem('@t3:checkoutSync', JSON.stringify({
            months, appliedCoupon, checkoutForm
        }));
    }, [months, appliedCoupon, checkoutForm]);

    /**
     * Viewport Scroll Lock Hook.
     * Prevents underlying document scrolling when modals or fullscreen mode are active.
     */
    useEffect(() => {
        if (isFullscreen || isCheckoutOpen || !!selectedPanelId) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isFullscreen, isCheckoutOpen, selectedPanelId]);

    /**
     * User Authentication Hydration.
     * Prefills the checkout form using the global authentication context.
     */
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

    /**
     * Impact Formatting Utility.
     * Normalizes and scales impression metrics for display.
     */
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

    /**
     * Data Fetching Hook.
     * Retrieves panel inventory and applies schema normalization to prevent map rendering errors.
     */
    useEffect(() => {
        const fetchPanels = async () => {
            try {
                setIsLoading(true);
                const data = await panelsService.getAllPanels();
                
                const validPanels = data
                    .filter((p: any) => p.status === 'AVAILABLE' && p.id)
                    .map((p: any) => {
                        const lat = Number(p.lat);
                        const lng = Number(p.lng);
                        return {
                            ...p,
                            id: p.id,
                            name: p.name || 'Sem Nome',
                            city: p.city || 'Desconhecida',
                            state: p.state || '',
                            lat: isNaN(lat) || lat === 0 ? -16.6868911 : lat, 
                            lng: isNaN(lng) || lng === 0 ? -49.2647943 : lng,
                            price: Number(p.price) || 0 
                        };
                    }) as Panel[];
                    
                setPanels(validPanels);
            } catch (error) {
                console.error("API Error (Panels Fetch):", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPanels();
    }, []);

    /**
     * Memoized Data Structures for Filtering.
     */
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

    /**
     * Financial Aggregations and Checkout Calculations.
     */
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

    let termDiscountPercent = 0;
    if (months >= 12) termDiscountPercent = 0.30;
    else if (months >= 6) termDiscountPercent = 0.20;
    else if (months >= 3) termDiscountPercent = 0.15;

    const totalWithoutAnyDiscount = baseMonthly * months;
    const totalTermDiscount = totalWithoutAnyDiscount * termDiscountPercent;
    const subtotalAfterTerm = totalWithoutAnyDiscount - totalTermDiscount;

    const couponDiscount = appliedCoupon ? subtotalAfterTerm * appliedCoupon.discount : 0;
    const finalTotalValue = subtotalAfterTerm - couponDiscount;
    const finalMonthlyValue = finalTotalValue / months;
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

    const SELLERS_PHONES = ['5562999999999', '5562888888888']; 

    /**
     * Transaction Submission Handler.
     * Pushes deal data to CRM API and formats communication payload for WhatsApp dispatch.
     */
    const handleWhatsAppSubmit = async (e: React.FormEvent) => {
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
            if (appliedCoupon || termDiscountPercent > 0) {
                extraNotes += `\n\n[Descontos Aplicados]:\n`;
                if (appliedCoupon) extraNotes += `- Cupom ${appliedCoupon.code} (${appliedCoupon.discount * 100}% OFF).\n`;
                if (termDiscountPercent > 0) extraNotes += `- Plano de ${months}x (${termDiscountPercent * 100}% OFF).`;
            }

            api.post('/crm/deals/checkout', {
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
                source: 'INTERACTIVE_MAP_WA'
            }).catch(e => console.error("API POST Error (CRM Integration):", e));

            const lastIndex = parseInt(localStorage.getItem('@t3:lastSeller') || '0', 10);
            const nextIndex = (lastIndex + 1) % SELLERS_PHONES.length;
            localStorage.setItem('@t3:lastSeller', nextIndex.toString());
            const targetPhone = SELLERS_PHONES[nextIndex];

            let text = `*Novo Pedido de Orçamento - T3 OOH*\n\n`;
            text += `*Cliente:* ${checkoutForm.name}\n`;
            text += `*Empresa:* ${checkoutForm.company || 'Não informada'}\n\n`;
            text += `*Painéis Selecionados (${cart.length}):*\n`;
            cart.forEach(p => { text += `- ${p.name} (${p.city})\n`; });
            text += `\n*Duração:* ${months} meses\n`;
            text += `*Investimento Mensal:* ${formatCurrency(finalMonthlyValue)}\n`;
            text += `*Valor Total da Campanha:* ${formatCurrency(finalTotalValue)}\n`;
            
            if (checkoutForm.message) text += `\n*Observações:* ${checkoutForm.message}\n`;

            const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
            
            addToast('Redirecionando para o WhatsApp comercial...', 'success');
            clearCart();
            setIsCheckoutOpen(false);
            setCheckoutStep('cart');
            setCheckoutForm({ name: '', email: '', phone: '', company: '', message: '' });
            
            window.open(waUrl, '_blank');
        } catch (err: any) {
            console.error("Checkout Exception:", err);
            addToast('Erro ao processar pedido. Verifique os dados e tente novamente.', 'error');
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
            
            {/* Map Engine Container */}
            <div className="absolute inset-0 z-0 bg-[#0A0A0B] [&_.leaflet-layer]:filter [&_.leaflet-layer]:invert [&_.leaflet-layer]:hue-rotate-180 [&_.leaflet-layer]:brightness-95 [&_.leaflet-layer]:contrast-90">
                {isLoading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0A0A0B]/90">
                        <Loader2 className="w-8 h-8 text-[#FF5E00] animate-spin mb-4" />
                        <p className="text-xs font-bold tracking-widest text-[#8F8F91] uppercase">Sincronizando Circuito...</p>
                    </div>
                ) : (
                    <InteractiveMap panels={panels as any[]} selectedPanelId={selectedPanelId} />
                )}
            </div>

            {/* Desktop Fullscreen Toggle */}
            {!isCheckoutOpen && (
                <div className="hidden md:flex absolute top-6 right-6 z-[400] pointer-events-auto">
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-3 bg-[#111113] border border-white/10 rounded-sm shadow-md text-white hover:text-[#FF5E00] transition-colors"
                        title={isFullscreen ? "Sair da Tela Cheia" : "Travar Mapa em Tela Cheia"}
                    >
                        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                </div>
            )}

            {/* ========================================================= */}
            {/* VIEWPORT: DESKTOP                                         */}
            {/* ========================================================= */}
            
            {/* Desktop Sidebar Toggle Trigger */}
            <AnimatePresence>
                {!isSidebarOpen && !isCheckoutOpen && (
                    <motion.button
                        key="reopen-sidebar-btn"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        onClick={() => setIsSidebarOpen(true)}
                        className="hidden md:flex absolute top-6 left-6 z-[100] bg-[#111113] border border-white/10 px-4 py-3 rounded-sm shadow-md hover:border-[#FF5E00]/50 transition-colors items-center gap-3 group cursor-pointer"
                    >
                        <Search className="w-4 h-4 text-[#FF5E00]" />
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest">Buscar Painéis</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Desktop Navigation Sidebar */}
            <AnimatePresence initial={false}>
                {isSidebarOpen && !isCheckoutOpen && (
                    <motion.div initial={{ x: '-100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-100%', opacity: 0 }} transition={{ type: "tween", duration: 0.2 }} className="hidden md:flex absolute top-0 left-0 bottom-0 w-[400px] bg-[#0A0A0B] border-r border-white/10 z-40 flex-col shadow-2xl">
                        <div className="p-6 border-b border-white/5 bg-[#111113] flex-shrink-0">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-sm font-black text-white uppercase tracking-widest">Inventário de Mídia</h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-sm text-[#8F8F91] transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8F8F91] z-10" />
                                    <Input
                                        placeholder="Buscar por avenida ou localização..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 bg-[#0A0A0B] border-white/10 text-[13px]"
                                    />
                                </div>
                                <div className="flex gap-3">
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

                        <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {filteredPanels.map((panel) => {
                                const inCart = isInCart(panel.id);
                                const isSelected = selectedPanelId === panel.id; 

                                return (
                                    <div 
                                        key={panel.id} 
                                        className={`flex flex-col p-4 rounded-sm border mb-3 transition-colors duration-200 cursor-pointer ${
                                            isSelected 
                                            ? 'bg-[#FF5E00]/5 border-[#FF5E00]/50' 
                                            : 'bg-[#111113] border-white/5 hover:border-white/20'
                                        }`}
                                        onClick={() => setSelectedPanelId(panel.id)}
                                    >
                                        <div className="flex gap-4 mb-4">
                                            <div className="w-20 h-20 rounded-sm overflow-hidden flex-shrink-0 bg-black">
                                                <img src={panel.images?.[0] || '/placeholder.jpg'} alt={panel.name} className="w-full h-full object-cover opacity-90" />
                                            </div>
                                            
                                            <div className="flex-1 flex flex-col justify-between overflow-hidden">
                                                <h4 className="text-[13px] font-bold text-white leading-tight line-clamp-2">
                                                    {panel.name}
                                                </h4>
                                                
                                                <div className="flex flex-col gap-1 mt-auto">
                                                    <div className="flex items-center gap-1.5 w-full">
                                                        <Zap className="w-3.5 h-3.5 text-[#FF5E00]" />
                                                        <span className="text-sm font-black text-[#FF5E00] truncate">
                                                            {formatImpacts(panel.impacts || 0)}
                                                        </span>
                                                        <span className="text-[8px] text-[#8F8F91] uppercase font-bold leading-tight ml-auto text-right">
                                                            Impactos<br/>Diários
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                                                        <span className="text-[9px] text-[#8F8F91] uppercase font-bold tracking-widest">Investimento</span>
                                                        <span className="text-xs font-black text-white">{formatCurrency(Number(panel.price) || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <Button
                                            type="button"
                                            variant={inCart ? 'secondary' : 'primary'}
                                            className={`w-full text-[11px] uppercase tracking-widest font-bold py-2.5 rounded-sm h-auto border ${inCart ? 'bg-white/5 border-white/10 text-white' : 'bg-[#111113] border-white/10 text-[#8F8F91] hover:text-[#FF5E00] hover:border-[#FF5E00]/50'}`}
                                            onClick={(e) => { e.stopPropagation(); toggleInCart(panel); }}
                                        >
                                            {inCart ? <><Check className="w-3 h-3 mr-1" /> Selecionado</> : 'Adicionar ao Orçamento'}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>

                        <AnimatePresence>
                            {cart.length > 0 && (
                                <motion.div className="p-5 border-t border-white/5 bg-[#111113] shrink-0">
                                    <Button type="button" onClick={() => setIsCheckoutOpen(true)} className="w-full py-4 text-[11px] uppercase tracking-widest font-black bg-[#25D366] hover:bg-[#20bd5a] text-[#0A0A0B] rounded-sm border-none">
                                        <ShoppingCart className="w-4 h-4 mr-2" /> Avançar ({cart.length})
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ========================================================= */}
            {/* VIEWPORT: MOBILE                                          */}
            {/* ========================================================= */}
            
            {!isCheckoutOpen && (
                <>
                    {/* Mobile Floating Search & Controls */}
                    <div className="md:hidden absolute top-4 left-4 right-4 z-[400] pointer-events-auto flex items-center gap-2">
                        <div className="flex-1 bg-[#111113] border border-white/10 rounded-sm px-4 py-2.5 shadow-md flex items-center gap-3">
                            <Search className="w-4 h-4 text-[#FF5E00] shrink-0" />
                            <input 
                                className="bg-transparent border-none text-white w-full focus:outline-none text-xs placeholder-[#8F8F91]"
                                placeholder="Buscar região..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button type="button" onClick={() => setSearchTerm('')} className="p-1 text-[#8F8F91] hover:text-white shrink-0">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="shrink-0 flex items-center justify-center w-[40px] h-[40px] bg-[#111113] border border-white/10 rounded-sm shadow-md text-white hover:text-[#FF5E00] transition-colors"
                        >
                            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Mobile Floating Bottom Context */}
                    <div className={`md:hidden absolute left-0 right-0 z-[400] pointer-events-none flex flex-col items-center justify-end pb-3 transition-all duration-300 ${isFullscreen ? 'bottom-4' : 'bottom-[76px]'}`}>
                        
                        <AnimatePresence>
                            {cart.length > 0 && (
                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }} 
                                    animate={{ y: 0, opacity: 1 }} 
                                    exit={{ y: 20, opacity: 0 }}
                                    className="pointer-events-auto mb-4 px-4 w-full"
                                >
                                    <Button type="button" onClick={() => setIsCheckoutOpen(true)} className="w-full rounded-sm bg-[#25D366] text-[#0A0A0B] font-black py-3.5 shadow-lg text-[11px] uppercase tracking-widest flex justify-center items-center gap-2 border-none">
                                        <ShoppingCart className="w-4 h-4" />
                                        Processar Orçamento ({cart.length})
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="w-full pointer-events-auto">
                            <div className="flex gap-3 overflow-x-auto snap-x px-4 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {filteredPanels.map(panel => {
                                    const inCart = isInCart(panel.id);
                                    const isSelected = selectedPanelId === panel.id;

                                    return (
                                        <div 
                                            key={panel.id}
                                            onClick={() => setSelectedPanelId(panel.id)}
                                            className={`snap-start flex-shrink-0 w-[280px] bg-[#111113] rounded-sm overflow-hidden border transition-colors shadow-md flex flex-row ${
                                                isSelected ? 'border-[#FF5E00]/50 bg-[#FF5E00]/5' : 'border-white/10'
                                            }`}
                                        >
                                            <div className="w-[90px] h-full bg-black relative shrink-0">
                                                <img src={panel.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover opacity-90" alt={panel.name} />
                                                <div className="absolute top-1 left-1 bg-[#0A0A0B]/90 px-1.5 py-0.5 rounded-sm border border-white/5 flex items-center gap-1">
                                                    <Zap className="w-2.5 h-2.5 text-[#FF5E00]" />
                                                    <span className="text-[8px] font-black text-white">{formatImpacts(panel.impacts || 0)}</span>
                                                </div>
                                            </div>

                                            <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
                                                <div>
                                                    <h4 className="text-xs font-bold text-white line-clamp-1 mb-0.5">{panel.name}</h4>
                                                    <p className="text-[9px] text-[#8F8F91] flex items-center gap-1 truncate font-bold uppercase tracking-wider">
                                                        <MapPin className="w-2.5 h-2.5 shrink-0" /> {panel.city}
                                                    </p>
                                                </div>
                                                
                                                <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
                                                    <span className="text-xs font-black text-white">{formatCurrency(Number(panel.price) || 0)}</span>
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleInCart(panel); }}
                                                        className={`w-6 h-6 rounded-sm flex items-center justify-center border transition-colors shrink-0 ${
                                                            inCart ? 'bg-white/10 border-white/20 text-white' : 'bg-[#0A0A0B] border-white/10 text-[#8F8F91] hover:text-[#FF5E00]'
                                                        }`}
                                                    >
                                                        {inCart ? <Check className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
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

            {/* Mobile Bottom Navigation */}
            {!isCheckoutOpen && !isFullscreen && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0B] border-t border-white/5 z-[500] px-6 py-3 flex justify-between items-center pb-safe">
                    <Link to="/" className="flex flex-col items-center gap-1 text-[#8F8F91] hover:text-white transition-colors">
                        <Compass className="w-4 h-4" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Início</span>
                    </Link>
                    <Link to="/mapa" className="flex flex-col items-center gap-1 text-[#FF5E00]">
                        <MapPin className="w-4 h-4" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Mapa</span>
                    </Link>
                    <Link to="/servicos" className="flex flex-col items-center gap-1 text-[#8F8F91] hover:text-white transition-colors">
                        <MonitorPlay className="w-4 h-4" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Painéis</span>
                    </Link>
                    <Link to="/contato" className="flex flex-col items-center gap-1 text-[#8F8F91] hover:text-white transition-colors">
                        <Shield className="w-4 h-4" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Contato</span>
                    </Link>
                </div>
            )}


            {/* ========================================================= */}
            {/* CHECKOUT MODAL (DRAWER)                                   */}
            {/* ========================================================= */}
            
            <AnimatePresence>
                {isCheckoutOpen && (
                    <motion.div 
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.2 }}
                        className="fixed inset-y-0 right-0 h-full w-full md:w-[480px] bg-[#0A0A0B] border-l border-white/10 z-[99999] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#111113] shrink-0 pt-[env(safe-area-inset-top,20px)]">
                            <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                                {checkoutStep === 'cart' ? (
                                    <><ShoppingCart className="w-4 h-4 text-[#FF5E00]" /> Resumo do Pedido</>
                                ) : (
                                    <><Send className="w-4 h-4 text-[#25D366]" /> Enviar Orçamento</>
                                )}
                            </h2>
                            <button type="button" onClick={() => { setIsCheckoutOpen(false); setCheckoutStep('cart'); }} className="text-[#8F8F91] hover:text-white bg-[#0A0A0B] p-2 rounded-sm border border-white/5 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-6 relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {checkoutStep === 'cart' ? (
                                cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                                        <ShoppingCart className="w-10 h-10 text-[#8F8F91]/50 mb-4" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-[#8F8F91]">Carrinho Vazio</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {cart.map((p, i) => (
                                            <div key={p.id} className="flex gap-4 p-4 bg-[#111113] border border-white/5 rounded-sm relative">
                                                <div className="w-5 h-5 absolute -top-2 -left-2 bg-[#FF5E00] text-black font-black text-[10px] rounded-sm flex items-center justify-center shadow-md z-10">{i + 1}</div>
                                                <img src={p.images?.[0] || '/placeholder.jpg'} alt={p.name} className="w-16 h-16 rounded-sm object-cover bg-black" />
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <h4 className="text-xs font-bold text-white leading-tight mb-1 truncate">{p.name}</h4>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F91] mb-3 flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.city}</p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-black text-white">{formatCurrency(Number(p.price))}</span>
                                                        <button type="button" onClick={() => toggleInCart(p)} className="text-[9px] text-[#ff4d4d] font-bold uppercase tracking-widest hover:text-white bg-[#ff4d4d]/10 hover:bg-[#ff4d4d]/30 px-2.5 py-1.5 rounded-sm transition-colors border border-[#ff4d4d]/20">Remover</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <form id="crm-checkout-form" onSubmit={handleWhatsAppSubmit} className="flex flex-col gap-6 pb-4">
                                    <div className="bg-[#111113] rounded-sm p-6 border border-white/5">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] text-[#8F8F91] font-bold uppercase tracking-widest flex items-center gap-2"><LayoutGrid className="w-3.5 h-3.5" /> Oportunidade</span>
                                            <span className="bg-white/5 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm border border-white/10">{cart.length} Pontos</span>
                                        </div>
                                        <div className="border-t border-white/5 my-4" />
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-[#FF5E00] font-bold uppercase tracking-widest mb-1">Alcance Diário</span>
                                                <span className="text-lg font-black text-[#FF5E00]">{formatImpacts(totalCartImpacts)}</span>
                                            </div>
                                            <div className="flex flex-col items-end text-right">
                                                {totalEconomy > 0 && <span className="text-[10px] text-[#8F8F91] line-through mb-0.5">{formatCurrency(totalWithoutAnyDiscount)}</span>}
                                                <span className="text-[9px] text-[#8F8F91] font-bold uppercase tracking-widest mb-1">Valor Liquido</span>
                                                <span className="text-lg font-black text-white leading-none mb-1.5">{formatCurrency(finalTotalValue)}</span>
                                                {totalEconomy > 0 && <span className="text-[9px] font-black text-[#25D366] bg-[#25D366]/10 px-2 py-0.5 rounded-sm border border-[#25D366]/20 uppercase tracking-widest">Economia: {formatCurrency(totalEconomy)}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-[11px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Detalhes de Contato</h3>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-[#8F8F91] font-bold uppercase tracking-widest">Nome Completo *</label>
                                            <input type="text" required value={checkoutForm.name} onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })} className="bg-[#0A0A0B] border border-white/10 rounded-sm p-3 text-white text-sm focus:border-[#FF5E00] outline-none transition-colors" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] text-[#8F8F91] font-bold uppercase tracking-widest">E-mail *</label>
                                                <input type="email" required value={checkoutForm.email} onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })} className="bg-[#0A0A0B] border border-white/10 rounded-sm p-3 text-white text-sm focus:border-[#FF5E00] outline-none transition-colors" />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] text-[#8F8F91] font-bold uppercase tracking-widest">WhatsApp *</label>
                                                <input type="text" required value={checkoutForm.phone} onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })} className="bg-[#0A0A0B] border border-white/10 rounded-sm p-3 text-white text-sm focus:border-[#FF5E00] outline-none transition-colors" />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-[#8F8F91] font-bold uppercase tracking-widest">Empresa / Marca</label>
                                            <input type="text" value={checkoutForm.company} onChange={(e) => setCheckoutForm({ ...checkoutForm, company: e.target.value })} className="bg-[#0A0A0B] border border-white/10 rounded-sm p-3 text-white text-sm focus:border-[#FF5E00] outline-none transition-colors" />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-[#8F8F91] font-bold uppercase tracking-widest">Observações (Opcional)</label>
                                            <textarea rows={3} value={checkoutForm.message} onChange={(e) => setCheckoutForm({ ...checkoutForm, message: e.target.value })} className="bg-[#0A0A0B] border border-white/10 rounded-sm p-3 text-white text-sm focus:border-[#FF5E00] outline-none resize-none transition-colors" />
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Footer (Actions) */}
                        {checkoutStep === 'cart' ? (
                            <div className="bg-[#111113] p-6 border-t border-white/5 shrink-0 pb-safe">
                                <div className="flex flex-col w-full mb-6">
                                    <div className="flex flex-col gap-4 border-b border-white/5 pb-6 mb-6">
                                        <div className="grid grid-cols-2 gap-4 items-end">
                                            <div className="flex flex-col gap-2 relative z-50">
                                                <label className="text-[10px] text-[#8F8F91] uppercase tracking-widest font-bold">Contrato (Meses)</label>
                                                <CustomSelect
                                                    options={monthOptions}
                                                    value={String(months)}
                                                    onChange={(val: string) => setMonths(Number(val))}
                                                    placeholder="Duração"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2 h-full">
                                                <label className="text-[10px] text-[#8F8F91] uppercase tracking-widest font-bold">Cupom OFF</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="CÓDIGO"
                                                        value={couponInput}
                                                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                                        className="w-full bg-[#0A0A0B] border border-white/10 rounded-sm px-3 text-white text-xs font-bold focus:border-[#FF5E00] outline-none uppercase placeholder:normal-case placeholder:font-normal h-[42px] transition-colors"
                                                        disabled={appliedCoupon !== null}
                                                    />
                                                    {appliedCoupon ? (
                                                        <Button type="button" onClick={() => { setAppliedCoupon(null); setCouponInput(''); }} className="px-3 h-[42px] bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 rounded-sm transition-colors"><X className="w-4 h-4" /></Button>
                                                    ) : (
                                                        <Button type="button" onClick={handleApplyCoupon} className="px-3 h-[42px] bg-white/5 text-[#8F8F91] hover:text-white border border-white/10 hover:border-white/20 rounded-sm transition-colors"><Tag className="w-4 h-4" /></Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {termDiscountPercent > 0 && <p className="text-[10px] text-[#25D366] font-bold uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Bonificação de {termDiscountPercent * 100}% aplicada</p>}
                                        {appliedCoupon && <p className="text-[10px] text-[#25D366] font-bold uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Voucher ativo</p>}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-[#8F8F91] uppercase tracking-widest mb-1">Custo Operacional Mensal</span>
                                            {totalEconomy > 0 && <span className="text-[11px] text-[#8F8F91] font-medium line-through mb-0.5">{formatCurrency(baseMonthly)}</span>}
                                            <span className="text-2xl font-black text-white leading-none">{formatCurrency(finalMonthlyValue)}</span>
                                            <span className="text-[10px] text-[#8F8F91] mt-2 font-bold uppercase tracking-widest">Budget Total: {formatCurrency(finalTotalValue)}</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    disabled={cart.length === 0 || isSubmitting}
                                    onClick={() => setCheckoutStep('crm')}
                                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-[#0A0A0B] font-black py-4 rounded-sm border-none uppercase tracking-widest text-[11px] transition-colors"
                                >
                                    Avançar Etapa
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-[#111113] p-6 border-t border-white/5 shrink-0 pb-safe flex flex-col gap-4 z-20 relative">
                                <button type="button" onClick={() => setCheckoutStep('cart')} className="w-full py-2 text-[10px] font-bold text-[#8F8F91] hover:text-white uppercase tracking-widest transition-colors">Voltar para Especificações</button>
                                <Button
                                    type="submit"
                                    form="crm-checkout-form"
                                    disabled={isSubmitting || !checkoutForm.name || !checkoutForm.email || !checkoutForm.phone}
                                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-[#0A0A0B] font-black py-4 rounded-sm border-none uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Finalizar e Enviar
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}