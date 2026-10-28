import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InteractiveMap, MapPanel } from '@/features/map/InteractiveMap';
import { ArrowRight, Check, ChevronLeft, Loader2, Maximize, Minimize, Plus, Search, Send, ShoppingCart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { api } from '@/lib/axios';
import { panelsService } from '@/services/panels.service';
import { useCart, Panel } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { nextSellerPhone } from '@/lib/contacts';
import { pricingService, describeCoupon, Quote } from '@/services/pricing.service';
import { Seo } from '@/components/Seo';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { parseImpacts, formatImpacts } from '@/lib/impacts';
import { btnGhost, btnPrimary, eyebrow } from '@/lib/ui';

/** Desconto do plano anual exibido nos cards (mesma regra do backend). */
const ANNUAL_DISCOUNT = 0.3;
/** Prazos aceitos pelo checkout (1 a 36 meses no backend). */
const MONTHS = [1, 2, 3, 4, 5, 6, 9, 12, 18, 24, 36];
const field = 'w-full border border-white/15 bg-ink-900 px-3.5 py-3 text-sm text-ink-100 placeholder:text-ink-500 focus:border-brand-neon focus:outline-none disabled:opacity-50';

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
    // A busca da Home chega como /mapa?q=...
    const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') ?? '');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(searchParams.get('checkout') === 'true');
    useEscapeKey(isCheckoutOpen, () => setIsCheckoutOpen(false));
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Checkout Flow State Management
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'crm'>('cart');
    const [months, setMonths] = useState(1);
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, label: string } | null>(null);
    const [couponQuote, setCouponQuote] = useState<Quote | null>(null);
    const [checkoutForm, setCheckoutForm] = useState({ 
        name: '', email: '', phone: '', company: '', message: '' 
    });

    /**
     * LocalStorage Synchronization Hook.
     * Hydrates checkout state across component mounts and routing boundaries.
     */
    useEffect(() => {
        let savedData: string | null = null;
        try {
            // Dados pessoais ficam só na aba atual (sessionStorage), nunca persistidos no navegador
            localStorage.removeItem('@t3:checkoutSync');
            savedData = sessionStorage.getItem('@t3:checkoutSync');
        } catch { /* storage indisponível */ }
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.months) setMonths(parsed.months);
                if (parsed.appliedCoupon?.code && parsed.appliedCoupon?.label) setAppliedCoupon(parsed.appliedCoupon);
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
        try {
            sessionStorage.setItem('@t3:checkoutSync', JSON.stringify({
                months, appliedCoupon, checkoutForm
            }));
        } catch { /* storage indisponível */ }
    }, [months, appliedCoupon, checkoutForm]);

    /**
     * Viewport Scroll Lock Hook.
     * Prevents underlying document scrolling when modals or fullscreen mode are active.
     */
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
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch = !q || [panel.name, panel.city, panel.state, panel.address].some((v) => String(v ?? '').toLowerCase().includes(q));
        const matchesState = selectedState ? panel.state === selectedState : true;
        const matchesCity = selectedCity ? panel.city === selectedCity : true;
        return matchesSearch && matchesState && matchesCity;
    });

    /**
     * Financial Aggregations and Checkout Calculations.
     */
    const totalCartImpacts = cart.reduce((acc, cartItem) => {
        const livePanel = panels.find(p => p.id === cartItem.id);
        return acc + parseImpacts(livePanel ? livePanel.impacts : cartItem.impacts);
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

    // Desconto do cupom vem sempre do servidor (cotação oficial)
    const couponDiscount = appliedCoupon && couponQuote ? couponQuote.couponDiscount : 0;
    const finalTotalValue = subtotalAfterTerm - couponDiscount;
    const finalMonthlyValue = finalTotalValue / months;

    const cartKey = cart.map(p => p.id).join(',');

    /**
     * Revalida o cupom no servidor sempre que carrinho ou prazo mudam
     * (valor mínimo e descontos fixos dependem do total).
     */
    useEffect(() => {
        if (!appliedCoupon || cart.length === 0) {
            setCouponQuote(null);
            return;
        }
        let cancelled = false;
        pricingService.quote(cart.map(p => p.id), months, appliedCoupon.code)
            .then(quote => { if (!cancelled) setCouponQuote(quote); })
            .catch((err) => {
                if (cancelled) return;
                setAppliedCoupon(null);
                setCouponQuote(null);
                addToast(err.response?.data?.error || 'Cupom inválido ou expirado.', 'error');
            });
        return () => { cancelled = true; };
    }, [appliedCoupon?.code, cartKey, months]);

    const handleApplyCoupon = async () => {
        const code = couponInput.trim().toUpperCase();
        if (!code || cart.length === 0) return;
        try {
            const quote = await pricingService.quote(cart.map(p => p.id), months, code);
            if (!quote.coupon) throw new Error('Cupom inválido.');
            setCouponQuote(quote);
            setAppliedCoupon({ code: quote.coupon.code, label: describeCoupon(quote.coupon) });
            addToast(`Cupom ${quote.coupon.code} aplicado! (${describeCoupon(quote.coupon)})`, 'success');
        } catch (err: any) {
            addToast(err.response?.data?.error || 'Cupom inválido ou expirado.', 'error');
            setAppliedCoupon(null);
        }
    };


    /**
     * Transaction Submission Handler.
     * Pushes deal data to CRM API and formats communication payload for WhatsApp dispatch.
     */
    const handleWhatsAppSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Valores são recalculados no servidor; enviamos apenas as escolhas do cliente
            const structuredItems = cart.map(p => ({ panelId: p.id }));

            // Abre a aba antes do await para não ser bloqueada como pop-up
            const waWindow = window.open('', '_blank');

            const { data: createdDeal } = await api.post('/crm/deals/checkout', {
                clientDetails: {
                    name: checkoutForm.name,
                    email: checkoutForm.email,
                    phone: checkoutForm.phone,
                    company: checkoutForm.company,
                    message: checkoutForm.message.trim()
                },
                contractMonths: months,
                couponCode: appliedCoupon?.code,
                items: structuredItems,
                source: 'INTERACTIVE_MAP_WA'
            }).catch((err) => {
                waWindow?.close();
                throw err;
            });

            const official: Quote | undefined = createdDeal?.quote;
            const officialMonthly = official?.monthlyValue ?? finalMonthlyValue;
            const officialTotal = official?.finalValue ?? finalTotalValue;
            const targetPhone = nextSellerPhone();

            let text = `*Novo Pedido de Orçamento - T3 OOH*\n\n`;
            text += `*Cliente:* ${checkoutForm.name}\n`;
            text += `*Empresa:* ${checkoutForm.company || 'Não informada'}\n\n`;
            text += `*Painéis Selecionados (${cart.length}):*\n`;
            cart.forEach(p => { text += `- ${p.name} (${p.city})\n`; });
            text += `\n*Duração:* ${months} meses\n`;
            text += `*Investimento Mensal:* ${formatCurrency(officialMonthly)}\n`;
            text += `*Valor Total da Campanha:* ${formatCurrency(officialTotal)}\n`;
            
            if (checkoutForm.message) text += `\n*Observações:* ${checkoutForm.message}\n`;

            const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
            
            addToast('Redirecionando para o WhatsApp comercial...', 'success');
            clearCart();
            setAppliedCoupon(null);
            setCouponInput('');
            setIsCheckoutOpen(false);
            setCheckoutStep('cart');
            setCheckoutForm({ name: '', email: '', phone: '', company: '', message: '' });
            
            if (waWindow) waWindow.location.href = waUrl;
            else window.open(waUrl, '_blank');
        } catch (err: any) {
            console.error("Checkout Exception:", err);
            addToast(err.response?.data?.error || 'Erro ao processar pedido. Verifique os dados e tente novamente.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const priceLabel = (p: { price?: number | string | null }) => {
        const base = Number(p.price) || 0;
        return base > 0 ? `${formatCurrency(base * (1 - ANNUAL_DISCOUNT))}/mês no plano anual` : 'Valor sob consulta';
    };
    const hasFilters = Boolean(searchTerm || selectedState || selectedCity);
    const clearFilters = () => { setSearchTerm(''); setSelectedState(''); setSelectedCity(''); };
    const closeCheckout = () => { setIsCheckoutOpen(false); setCheckoutStep('cart'); };
    const pick = (id: string) => { setSelectedPanelId(id); };

    /** Card do painel (lista lateral e faixa do celular). */
    const PanelCard = ({ panel, compact }: { panel: Panel; compact?: boolean }) => {
        const inCart = isInCart(panel.id);
        const active = selectedPanelId === panel.id;
        const impacts = parseImpacts(panel.impacts);
        return (
            <article
                className={`group flex border bg-ink-900 transition-colors ${active ? 'border-brand-neon' : inCart ? 'border-white/40' : 'border-white/[0.08] hover:border-white/25'} ${compact ? 'w-[300px] shrink-0 snap-start' : ''}`}
            >
                <button type="button" onClick={() => pick(panel.id)} className="relative w-24 shrink-0 overflow-hidden bg-ink-850 sm:w-28" aria-label={`Ver ${panel.name} no mapa`}>
                    <img src={panel.images?.[0] || '/placeholder.svg'} alt="" loading="lazy" className="h-full w-full object-cover grayscale-[30%] transition duration-500 group-hover:grayscale-0" />
                </button>
                <div className="flex min-w-0 flex-1 flex-col p-3">
                    <button type="button" onClick={() => pick(panel.id)} className="min-w-0 text-left">
                        <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">{[panel.city, panel.state].filter(Boolean).join(' · ')}</p>
                        <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-ink-100">{panel.name}</p>
                    </button>
                    <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                        <p className="font-mono text-xs leading-tight">
                            <span className="block text-ink-100">{impacts ? `${formatImpacts(impacts)}/dia` : '—'}</span>
                            {Number(panel.price) > 0 && <span className="block text-brand-neon">{formatCurrency(Number(panel.price) * (1 - ANNUAL_DISCOUNT))}/mês</span>}
                        </p>
                        <button
                            type="button"
                            onClick={() => toggleInCart(panel)}
                            aria-pressed={inCart}
                            aria-label={inCart ? `Remover ${panel.name} do orçamento` : `Adicionar ${panel.name} ao orçamento`}
                            className={`flex h-9 w-9 shrink-0 items-center justify-center transition-colors ${inCart ? 'border border-white/40 text-ink-100 hover:border-white' : 'bg-brand-neon text-ink-950 hover:bg-brand-neonHover'}`}
                        >
                            {inCart ? <Check className="h-4 w-4" strokeWidth={2} /> : <Plus className="h-4 w-4" strokeWidth={2} />}
                        </button>
                    </div>
                </div>
            </article>
        );
    };

    return (
        <>
        <Seo title="Mapa de painéis" description="Veja no mapa os painéis de LED e pontos de mídia OOH disponíveis, filtre por cidade e monte seu orçamento." path="/mapa" />
        <div className={isFullscreen ? 'fixed inset-0 z-[600] flex bg-ink-950' : 'relative flex h-[calc(100dvh-5rem)] min-h-[560px] w-full bg-ink-950'}>

            {/* ============================ LISTA LATERAL (desktop) ============================ */}
            <aside className={`hidden w-[420px] shrink-0 flex-col border-r border-white/[0.08] bg-ink-950 md:flex ${isSidebarOpen ? '' : 'md:hidden'}`}>
                <div className="border-b border-white/[0.08] p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className={eyebrow}>Mapa <span className="text-brand-neon">/</span> {isLoading ? 'carregando' : `${filteredPanels.length} de ${panels.length} pontos`}</p>
                            <h1 className="mt-3 text-3xl font-light uppercase leading-none tracking-tight text-ink-100">Painéis no mapa</h1>
                        </div>
                        <button type="button" onClick={() => setIsSidebarOpen(false)} className="p-2 text-ink-400 hover:text-ink-100" aria-label="Recolher lista"><ChevronLeft className="h-5 w-5" /></button>
                    </div>
                    <div className="mt-5 flex flex-col gap-2">
                        <div className="relative">
                            <label htmlFor="map-search" className="sr-only">Buscar painéis</label>
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
                            <input id="map-search" type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Avenida, bairro ou cidade" className={`${field} pl-10`} autoComplete="off" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label htmlFor="map-state" className="sr-only">Estado</label>
                                <select id="map-state" value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(''); }} className={field}>
                                    {stateOptions.map((o) => <option key={o.value} value={o.value}>{o.value ? o.label : 'Todos os estados'}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="map-city" className="sr-only">Cidade</label>
                                <select id="map-city" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} disabled={cityOptions.length <= 1} className={field}>
                                    {cityOptions.map((o) => <option key={o.value} value={o.value}>{o.value ? o.label : 'Todas as cidades'}</option>)}
                                </select>
                            </div>
                        </div>
                        {hasFilters && <button type="button" onClick={clearFilters} className="self-start text-sm text-ink-400 underline-offset-4 hover:text-ink-100 hover:underline">Limpar filtros</button>}
                    </div>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto p-3">
                    {isLoading ? (
                        <div className="flex flex-col gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse bg-ink-900" />)}</div>
                    ) : filteredPanels.length === 0 ? (
                        <div className="border border-dashed border-white/15 p-6">
                            <p className="text-ink-100">Nenhum ponto encontrado</p>
                            <p className="mt-2 text-sm text-ink-400">{hasFilters ? 'Ajuste a busca ou os filtros.' : 'Não há painéis disponíveis agora.'}</p>
                            {hasFilters && <button type="button" onClick={clearFilters} className={`mt-4 ${btnGhost}`}>Limpar filtros</button>}
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-2">{filteredPanels.map((panel) => <li key={panel.id}><PanelCard panel={panel} /></li>)}</ul>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="border-t border-white/[0.08] p-4">
                        <button type="button" onClick={() => setIsCheckoutOpen(true)} className={`${btnPrimary} w-full`}>
                            <ShoppingCart className="h-4 w-4" aria-hidden="true" /> Ver orçamento · <span className="font-mono">{cart.length}</span>
                        </button>
                    </div>
                )}
            </aside>

            {/* ============================ MAPA ============================ */}
            <div className="relative min-w-0 flex-1">
                {isLoading ? (
                    <div className="absolute inset-0 animate-pulse bg-ink-900" aria-busy="true" aria-label="Carregando mapa" />
                ) : (
                    <InteractiveMap
                        panels={filteredPanels as MapPanel[]}
                        selectedPanelId={selectedPanelId}
                        onSelect={pick}
                        onToggle={(p) => toggleInCart(p as Panel)}
                        isInCart={isInCart}
                        priceLabel={priceLabel}
                    />
                )}

                {/* Controles sobre o mapa (desktop) */}
                <div className="pointer-events-none absolute left-4 right-4 top-4 z-[400] hidden items-start justify-between md:flex">
                    {!isSidebarOpen ? (
                        <button type="button" onClick={() => setIsSidebarOpen(true)} className="pointer-events-auto inline-flex items-center gap-2 border border-white/15 bg-ink-950/90 px-4 py-2.5 text-sm text-ink-100 backdrop-blur hover:border-white/40">
                            <Search className="h-4 w-4" aria-hidden="true" /> Lista de painéis <span className="font-mono text-ink-400">{filteredPanels.length}</span>
                        </button>
                    ) : <span />}
                    <button type="button" onClick={() => setIsFullscreen(!isFullscreen)} className="pointer-events-auto border border-white/15 bg-ink-950/90 p-2.5 text-ink-100 backdrop-blur hover:border-white/40" aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}>
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </button>
                </div>

                {/* Busca (celular) */}
                <div className="absolute left-3 right-3 top-3 z-[400] flex gap-2 md:hidden">
                    <div className="relative flex-1">
                        <label htmlFor="map-search-m" className="sr-only">Buscar painéis</label>
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
                        <input id="map-search-m" type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Avenida, bairro ou cidade" className={`${field} border-white/20 bg-ink-950/95 pl-10 backdrop-blur`} autoComplete="off" />
                    </div>
                    <button type="button" onClick={() => setIsFullscreen(!isFullscreen)} className="shrink-0 border border-white/20 bg-ink-950/95 px-3 text-ink-100" aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}>
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </button>
                </div>

                {/* Faixa de cards (celular) */}
                <div className="absolute inset-x-0 bottom-0 z-[400] flex flex-col gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
                    {cart.length > 0 && (
                        <div className="px-3">
                            <button type="button" onClick={() => setIsCheckoutOpen(true)} className={`${btnPrimary} w-full`}>
                                <ShoppingCart className="h-4 w-4" aria-hidden="true" /> Ver orçamento · <span className="font-mono">{cart.length}</span>
                            </button>
                        </div>
                    )}
                    <div className="flex snap-x gap-2 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {filteredPanels.map((panel) => <PanelCard key={panel.id} panel={panel} compact />)}
                        {!isLoading && filteredPanels.length === 0 && <p className="border border-white/15 bg-ink-950/95 px-4 py-3 text-sm text-ink-300">Nenhum ponto com essa busca.</p>}
                    </div>
                </div>
            </div>

            {/* ============================ ORÇAMENTO (gaveta) ============================ */}
            <AnimatePresence>
                {isCheckoutOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCheckout} className="fixed inset-0 z-[99998] bg-ink-950/80" />
                        <motion.aside
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                            className="fixed inset-y-0 right-0 z-[99999] flex w-full flex-col border-l border-white/10 bg-ink-950 md:w-[480px]"
                            role="dialog" aria-modal="true" aria-labelledby="map-checkout-title"
                        >
                            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
                                <div>
                                    <p className={eyebrow}>{checkoutStep === 'cart' ? 'Passo 1 de 2' : 'Passo 2 de 2'}</p>
                                    <h2 id="map-checkout-title" className="mt-1 text-xl font-light uppercase tracking-tight text-ink-100">{checkoutStep === 'cart' ? 'Seu orçamento' : 'Seus dados'}</h2>
                                </div>
                                <button type="button" onClick={closeCheckout} className="p-2 text-ink-400 hover:text-ink-100" aria-label="Fechar"><X className="h-5 w-5" /></button>
                            </div>

                            <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
                                {checkoutStep === 'cart' ? (
                                    cart.length === 0 ? (
                                        <div className="mt-8">
                                            <p className="text-2xl font-light uppercase tracking-tight text-ink-100">Nenhum painel ainda</p>
                                            <p className="mt-3 text-ink-400">Use o botão + nos cards ou "Adicionar ao orçamento" no mapa.</p>
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
                                            {cart.map((p) => (
                                                <li key={p.id} className="flex gap-4 py-4">
                                                    <img src={p.images?.[0] || '/placeholder.svg'} alt="" className="h-16 w-20 shrink-0 bg-ink-900 object-cover" />
                                                    <div className="flex min-w-0 flex-1 flex-col">
                                                        <p className="truncate text-sm font-medium text-ink-100">{p.name}</p>
                                                        <p className="truncate font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400">{[p.city, p.state].filter(Boolean).join(' · ')}</p>
                                                        <div className="mt-auto flex items-end justify-between pt-2">
                                                            <span className="font-mono text-sm text-ink-100">{formatCurrency(Number(p.price) || 0)}<span className="text-xs text-ink-400">/mês</span></span>
                                                            <button type="button" onClick={() => toggleInCart(p)} className="text-xs text-ink-400 underline-offset-4 hover:text-ink-100 hover:underline">Remover</button>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )
                                ) : (
                                    <form id="crm-checkout-form" onSubmit={handleWhatsAppSubmit} className="flex flex-col gap-5">
                                        <dl className="grid grid-cols-2 gap-px border border-white/[0.08] bg-white/[0.08] font-mono text-sm">
                                            <div className="bg-ink-950 p-3"><dt className="text-xs text-ink-500">Painéis</dt><dd className="mt-1 text-ink-100">{cart.length}</dd></div>
                                            <div className="bg-ink-950 p-3"><dt className="text-xs text-ink-500">Alcance/dia</dt><dd className="mt-1 text-ink-100">{totalCartImpacts ? formatImpacts(totalCartImpacts) : '—'}</dd></div>
                                            <div className="bg-ink-950 p-3"><dt className="text-xs text-ink-500">Prazo</dt><dd className="mt-1 text-ink-100">{months} {months === 1 ? 'mês' : 'meses'}</dd></div>
                                            <div className="bg-ink-950 p-3"><dt className="text-xs text-ink-500">Total</dt><dd className="mt-1 text-brand-neon">{formatCurrency(finalTotalValue)}</dd></div>
                                        </dl>
                                        {[
                                            { id: 'name', label: 'Nome completo', type: 'text', auto: 'name', required: true },
                                            { id: 'email', label: 'E-mail', type: 'email', auto: 'email', required: true },
                                            { id: 'phone', label: 'WhatsApp', type: 'tel', auto: 'tel', required: true },
                                            { id: 'company', label: 'Empresa ou marca', type: 'text', auto: 'organization', required: false },
                                        ].map((f) => (
                                            <div key={f.id}>
                                                <label htmlFor={`mc-${f.id}`} className="mb-2 block text-sm text-ink-300">{f.label} {!f.required && <span className="text-ink-500">(opcional)</span>}</label>
                                                <input id={`mc-${f.id}`} type={f.type} autoComplete={f.auto} required={f.required} value={checkoutForm[f.id as keyof typeof checkoutForm]} onChange={(e) => setCheckoutForm({ ...checkoutForm, [f.id]: e.target.value })} className={field} />
                                            </div>
                                        ))}
                                        <div>
                                            <label htmlFor="mc-msg" className="mb-2 block text-sm text-ink-300">Observações <span className="text-ink-500">(opcional)</span></label>
                                            <textarea id="mc-msg" rows={3} value={checkoutForm.message} onChange={(e) => setCheckoutForm({ ...checkoutForm, message: e.target.value })} placeholder="Quando quer começar, público, dúvidas" className={`${field} resize-none`} />
                                        </div>
                                    </form>
                                )}
                            </div>

                            {checkoutStep === 'cart' ? (
                                <div className="flex shrink-0 flex-col gap-4 border-t border-white/[0.08] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor="mc-months" className="mb-2 block text-sm text-ink-300">Prazo</label>
                                            <select id="mc-months" value={months} onChange={(e) => setMonths(Number(e.target.value))} className={field}>
                                                {MONTHS.map((m) => <option key={m} value={m}>{m} {m === 1 ? 'mês' : 'meses'}{m >= 12 ? ' · 30%' : m >= 6 ? ' · 20%' : m >= 3 ? ' · 15%' : ''}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="mc-coupon" className="mb-2 block text-sm text-ink-300">Cupom</label>
                                            {appliedCoupon ? (
                                                <div className="flex h-[46px] items-center justify-between gap-2 border border-brand-neon/40 px-3 text-sm text-brand-neon">
                                                    <span className="truncate font-mono">{appliedCoupon.code}</span>
                                                    <button type="button" onClick={() => { setAppliedCoupon(null); setCouponInput(''); }} className="text-ink-400 hover:text-ink-100" aria-label="Remover cupom"><X className="h-4 w-4" /></button>
                                                </div>
                                            ) : (
                                                <div className="flex">
                                                    <input id="mc-coupon" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="CÓDIGO" className={`${field} min-w-0 font-mono uppercase`} />
                                                    <button type="button" onClick={handleApplyCoupon} disabled={!couponInput.trim() || cart.length === 0} className="border border-l-0 border-white/15 px-3 text-sm text-ink-100 hover:bg-ink-800 disabled:opacity-40">OK</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 text-sm">
                                        {termDiscountPercent > 0 && <p className="flex justify-between text-ink-400"><span>Desconto de prazo ({termDiscountPercent * 100}%)</span><span className="font-mono">− {formatCurrency(totalTermDiscount)}</span></p>}
                                        {couponDiscount > 0 && <p className="flex justify-between text-ink-400"><span>Cupom {appliedCoupon?.code}</span><span className="font-mono">− {formatCurrency(couponDiscount)}</span></p>}
                                        <p className="mt-2 flex items-end justify-between border-t border-white/[0.08] pt-3"><span className="text-ink-300">Investimento mensal</span><span className="font-mono text-2xl text-brand-neon">{formatCurrency(cart.length ? finalMonthlyValue : 0)}</span></p>
                                        <p className="text-right font-mono text-xs text-ink-400">Total da campanha: {formatCurrency(cart.length ? finalTotalValue : 0)}</p>
                                    </div>
                                    <button type="button" disabled={cart.length === 0 || isSubmitting} onClick={() => setCheckoutStep('crm')} className={`${btnPrimary} w-full`}>
                                        Continuar <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                </div>
                            ) : (
                                <div className="shrink-0 border-t border-white/[0.08] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                                    <p className="mb-4 text-xs text-ink-400">Ao enviar, o pedido chega ao comercial da T3 e abrimos o WhatsApp de um atendente com o resumo.</p>
                                    <button type="submit" form="crm-checkout-form" disabled={isSubmitting || !checkoutForm.name || !checkoutForm.email || !checkoutForm.phone} className={`${btnPrimary} w-full`}>
                                        {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Enviando</> : <><Send className="h-4 w-4" aria-hidden="true" /> Enviar pelo WhatsApp</>}
                                    </button>
                                    <button type="button" onClick={() => setCheckoutStep('cart')} className="mt-4 w-full text-center text-sm text-ink-400 hover:text-ink-100">Voltar ao orçamento</button>
                                </div>
                            )}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
        </>
    );
}
