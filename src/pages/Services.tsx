import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Loader2, MapPin, Maximize, Plus, Search, ShoppingCart, Tag, X } from 'lucide-react';

import { api } from '@/lib/axios';
import { panelsService } from '@/services/panels.service';
import { useCart, Panel } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, Link } from 'react-router-dom';
import { pricingService, describeCoupon, Quote } from '@/services/pricing.service';
import { Seo } from '@/components/Seo';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { parseImpacts, formatImpacts } from '@/lib/impacts';
import { btnGhost, btnPrimary, eyebrow } from '@/lib/ui';
import { CustomSelect } from '@/components/CustomSelect';

/** Desconto do plano de 12 meses, usado nos preços de vitrine (mesma regra do backend). */
const ANNUAL_DISCOUNT = 0.3;
const spring = { type: 'spring', stiffness: 100, damping: 20 } as const;
const field = 'w-full border border-white/15 bg-ink-900 px-4 py-3 text-sm text-ink-100 placeholder:text-ink-500 focus:border-brand-neon focus:outline-none';

const formatCurrency = (value: number | string) => {
    const numericValue = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue);
};


// Interface estendida para o Carrinho local
interface CartPanel extends Panel {
    selectedMonths?: number;
    finalPrice?: number;
}

export function Services() {
    const { user } = useAuth();
    const { cart, toggleInCart, isInCart, clearCart } = useCart();
    const { addToast } = useToast();

    const [panels, setPanels] = useState<CartPanel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    const [selectedPanel, setSelectedPanel] = useState<CartPanel | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    useEscapeKey(Boolean(selectedPanel) || isSidebarOpen, () => { setSelectedPanel(null); setIsSidebarOpen(false); });

    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'crm' | 'success'>('cart');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estado Global de Meses para o Carrinho Inteiro
    const [cartMonths, setCartMonths] = useState<string>('12');

    // Estados para Cupom
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; label: string } | null>(null);
    const [couponQuote, setCouponQuote] = useState<Quote | null>(null);
    const [searchParams] = useSearchParams();

    const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', message: '' });

    // Autopreenchimento CRM
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || prev.name,
                email: user.email || prev.email,
                phone: (user as any).phone || prev.phone,
                company: (user as any).company || prev.company
            }));
        }
    }, [user]);

    // Trava o scroll do body quando o modal/sidebar abre
    useEffect(() => {
        if (isSidebarOpen || selectedPanel) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isSidebarOpen, selectedPanel]);

    // Busca os dados iniciais do banco com AbortController
    useEffect(() => {
        const controller = new AbortController();

        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                const panelsData = await panelsService.getAllPanels();
                
                if (!controller.signal.aborted) {
                    const validPanels = panelsData
                        .filter((p: any) => p.status === 'AVAILABLE' && p.id)
                        .map((p: any) => ({
                            ...p,
                            id: p.id,
                            name: p.name || 'Sem Nome',
                            city: p.city || 'Desconhecida',
                            state: p.state || '',
                            price: Number(p.price) || 0
                        })) as CartPanel[];
                    setPanels(validPanels);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("Erro ao carregar servicos:", error);
                }
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        };
        fetchInitialData();

        return () => controller.abort();
    }, []);

    // Links como /servicos?panelId=... abrem o painel indicado
    useEffect(() => {
        const panelId = searchParams.get('panelId');
        if (!panelId || panels.length === 0) return;
        const target = panels.find(p => p.id === panelId);
        if (target) setSelectedPanel(target);
    }, [searchParams, panels]);

    // Reseta o passo do checkout e cupom ao fechar a sidebar
    useEffect(() => {
        if (!isSidebarOpen) {
            const timer = setTimeout(() => {
                setCheckoutStep('cart');
                setCouponInput('');
                setAppliedCoupon(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isSidebarOpen]);

    // Filtros e Pesquisa
    const stateOptions = useMemo(() => {
        const states = Array.from(new Set(panels.map(p => p.state).filter(Boolean))).sort();
        return [{ value: '', label: 'Todos os Estados' }, ...states.map(st => ({ value: st as string, label: st as string }))];
    }, [panels]);

    const cityOptions = useMemo(() => {
        const filtered = selectedState ? panels.filter(p => p.state === selectedState) : panels;
        const cities = Array.from(new Set(filtered.map(p => p.city).filter(Boolean))).sort();
        return [{ value: '', label: 'Todas as Cidades' }, ...cities.map(city => ({ value: city as string, label: city as string }))];
    }, [panels, selectedState]);

    const filteredPanels = useMemo(() => {
        return panels.filter(panel => {
            const safeSearch = searchTerm.trim().toLowerCase();
            const matchesSearch = panel.name?.toLowerCase().includes(safeSearch) || panel.city?.toLowerCase().includes(safeSearch);
            const matchesState = selectedState ? panel.state === selectedState : true;
            const matchesCity = selectedCity ? panel.city === selectedCity : true;
            return matchesSearch && matchesState && matchesCity;
        });
    }, [panels, searchTerm, selectedState, selectedCity]);

    // ============================================================================
    // GERAÇÃO DINÂMICA DOS 12 MESES COM DESCONTOS EMBUTIDOS NO LABEL
    // ============================================================================
    const monthOptions = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const discount = month >= 12 ? 30 : month >= 6 ? 20 : month >= 3 ? 15 : 0;
        return {
            value: String(month),
            label: `${month} ${month > 1 ? 'meses' : 'mês'}${discount ? ` · ${discount}% de desconto` : ''}`
        };
    });

    // ============================================================================
    // LÓGICA FINANCEIRA DO CARRINHO (GLOBAL E DINÂMICA)
    // ============================================================================
    let cartDiscount = 0;
    const numericMonths = Number(cartMonths);
    if (numericMonths >= 12) cartDiscount = 0.30;
    else if (numericMonths >= 6) cartDiscount = 0.20;
    else if (numericMonths >= 3) cartDiscount = 0.15;

    const baseCartMonthlyValue = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const discountedCartMonthlyValue = baseCartMonthlyValue * (1 - cartDiscount);
    
    // Com cupom, o valor oficial vem do servidor
    const finalCartMonthlyValue = appliedCoupon && couponQuote ? couponQuote.monthlyValue : discountedCartMonthlyValue;
    const cartKey = cart.map(p => p.id).join(',');

    // Revalida o cupom no servidor quando carrinho ou prazo mudam
    useEffect(() => {
        if (!appliedCoupon || cart.length === 0) {
            setCouponQuote(null);
            return;
        }
        let cancelled = false;
        pricingService.quote(cart.map(p => p.id), numericMonths, appliedCoupon.code)
            .then(quote => { if (!cancelled) setCouponQuote(quote); })
            .catch((err) => {
                if (cancelled) return;
                setAppliedCoupon(null);
                setCouponQuote(null);
                addToast(err.response?.data?.error || 'Cupom inválido ou expirado.', 'error');
            });
        return () => { cancelled = true; };
    }, [appliedCoupon?.code, cartKey, numericMonths]);

    const handleApplyCoupon = async () => {
        const code = couponInput.trim().toUpperCase();
        if (!code || cart.length === 0) return;

        try {
            const quote = await pricingService.quote(cart.map(p => p.id), numericMonths, code);
            if (!quote.coupon) throw new Error('Cupom inválido.');
            setCouponQuote(quote);
            setAppliedCoupon({ code: quote.coupon.code, label: describeCoupon(quote.coupon) });
            addToast(`Cupom ${quote.coupon.code} aplicado com sucesso!`, 'success');
        } catch (err: any) {
            addToast(err.response?.data?.error || 'Cupom inválido ou expirado.', 'error');
            setAppliedCoupon(null);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput('');
        addToast('Cupom removido.', 'info');
    };

    const handleOrderSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user?.id) {
            addToast('Você precisa estar logado para realizar um pedido.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const maxMonths = Number(cartMonths);

            let extraNotes = formData.message;
            extraNotes += `\nCliente: ${formData.name} | Tel: ${formData.phone} | Agência/Empresa: ${formData.company}`;

            // Valores, descontos e cupom são calculados pelo servidor; o usuário vem do token
            await api.post('/orders', {
                months: maxMonths,
                couponCode: appliedCoupon?.code,
                notes: extraNotes.trim(),
                items: cart.map((panel) => ({ panelId: panel.id }))
            });

            setCheckoutStep('success');
            clearCart();
            setFormData({ name: '', email: '', phone: '', company: '', message: '' });

        } catch (err: any) {
            console.error("Erro ao salvar pacote de pedidos no banco de dados:", err);
            addToast(err.response?.data?.error || 'Ocorreu um erro ao processar seu pedido. Tente novamente.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetFilters = () => { setSearchTerm(''); setSelectedState(''); setSelectedCity(''); };
    const hasFilters = Boolean(searchTerm || selectedState || selectedCity);
    const closeSidebar = () => { setIsSidebarOpen(false); if (checkoutStep === 'success') setCheckoutStep('cart'); };

    return (
        <>
        <Seo title="Catálogo de painéis" description="Catálogo de painéis de LED e mídia exterior com localização, formato e investimento. Monte seu pacote e solicite orçamento." path="/servicos" />

        {/* ============================ CABEÇALHO (sobre o vídeo da cidade) ============================ */}
        <section className="mx-auto grid max-w-[1400px] grid-cols-1 items-end gap-8 px-4 pb-14 pt-12 md:grid-cols-[1fr_auto] md:px-8 md:pb-20 lg:pt-20">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-400">
                    Inventário <span className="text-brand-neon">/</span> {isLoading ? 'carregando' : `${panels.length} ${panels.length === 1 ? 'ponto disponível' : 'pontos disponíveis'}`}
                </p>
                <h1 className="text-[2.75rem] font-light uppercase leading-[0.95] tracking-tight text-ink-100 sm:text-6xl xl:text-7xl">
                    Catálogo<br /><span className="text-brand-neon">de painéis.</span>
                </h1>
                <p className="mt-8 max-w-[50ch] text-base leading-relaxed text-ink-300">
                    Escolha os pontos da campanha e defina o prazo no resumo. Os valores já mostram o desconto do plano anual.
                </p>
            </motion.div>
            <button type="button" onClick={() => setIsSidebarOpen(true)} className={`${btnGhost} relative self-end bg-ink-950/60 backdrop-blur-sm`}>
                <ShoppingCart className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Resumo do projeto
                {cart.length > 0 && <span className="ml-1 bg-brand-neon px-2 py-0.5 font-mono text-xs text-ink-950" aria-label={`${cart.length} painéis no projeto`}>{cart.length}</span>}
            </button>
        </section>

        {/* ============================ FILTROS (fixos ao rolar) ============================ */}
        <div className="sticky top-20 z-20 border-y border-white/[0.08] bg-ink-950/95 backdrop-blur-sm">
            <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:px-8">
                <div className="relative flex-1">
                    <label htmlFor="catalog-search" className="sr-only">Buscar painéis</label>
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" strokeWidth={1.75} aria-hidden="true" />
                    <input id="catalog-search" type="search" placeholder="Avenida, região ou nome do painel" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-white/15 bg-ink-900 py-3 pl-11 pr-4 text-sm text-ink-100 placeholder:text-ink-500 focus:border-brand-neon focus:outline-none" autoComplete="off" />
                </div>
                <div className="grid grid-cols-2 gap-3 md:w-[420px]">
                    <div>
                        <label htmlFor="catalog-state" className="sr-only">Estado</label>
                        <CustomSelect tone="site" id="catalog-state" value={selectedState} onChange={(v) => { setSelectedState(v); setSelectedCity(''); }} className="py-3"
                            options={stateOptions.map((o) => ({ value: o.value, label: o.label }))} />
                    </div>
                    <div>
                        <label htmlFor="catalog-city" className="sr-only">Cidade</label>
                        <CustomSelect tone="site" id="catalog-city" value={selectedCity} onChange={setSelectedCity} disabled={cityOptions.length <= 1} className="py-3"
                            options={cityOptions.map((o) => ({ value: o.value, label: o.label }))} />
                    </div>
                </div>
                {hasFilters && <button type="button" onClick={resetFilters} className="text-sm text-ink-400 underline-offset-4 hover:text-ink-100 hover:underline">Limpar</button>}
                {/* Atalho para o resumo, visível mesmo depois de rolar o cabeçalho */}
                {cart.length > 0 && (
                    <button type="button" onClick={() => setIsSidebarOpen(true)} className="inline-flex items-center justify-center gap-2 bg-brand-neon px-4 py-3 text-sm font-semibold text-ink-950 hover:bg-brand-neonHover">
                        <ShoppingCart className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Resumo · <span className="font-mono">{cart.length}</span>
                    </button>
                )}
            </div>
        </div>

        {/* ============================ GRADE DE PAINÉIS ============================ */}
        <section className="bg-ink-950">
            <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-14">
                {isLoading ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" aria-busy="true" aria-label="Carregando painéis">
                        {Array.from({ length: 6 }, (_, i) => (
                            <div key={i} className="bg-ink-900">
                                <div className="aspect-[4/3] animate-pulse bg-ink-850" />
                                <div className="space-y-3 p-5"><div className="h-3 w-1/3 animate-pulse bg-ink-800" /><div className="h-5 w-2/3 animate-pulse bg-ink-800" /><div className="h-10 animate-pulse bg-ink-800" /></div>
                            </div>
                        ))}
                    </div>
                ) : filteredPanels.length === 0 ? (
                    <div className="border border-dashed border-white/15 p-10 md:p-16">
                        <h2 className="text-2xl font-light uppercase tracking-tight text-ink-100">Nenhum ponto encontrado</h2>
                        <p className="mt-3 max-w-[50ch] text-ink-400">
                            {hasFilters ? 'Nenhum painel bate com a busca e os filtros escolhidos.' : 'Não há painéis disponíveis agora. Fale com o comercial para saber das próximas liberações.'}
                        </p>
                        {hasFilters
                            ? <button type="button" onClick={resetFilters} className={`mt-6 ${btnGhost}`}>Limpar filtros</button>
                            : <Link to="/contato" className={`mt-6 ${btnGhost}`}>Falar com o comercial</Link>}
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                        {filteredPanels.map((panel, i) => {
                            const inCart = isInCart(panel.id);
                            const basePrice = Number(panel.price) || 0;
                            const impacts = parseImpacts(panel.impacts);
                            return (
                                <motion.li
                                    key={panel.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-40px' }}
                                    transition={{ ...spring, delay: (i % 4) * 0.05 }}
                                    className={`group flex flex-col bg-ink-900 outline outline-1 -outline-offset-1 ${inCart ? 'outline-brand-neon' : 'outline-transparent'}`}
                                >
                                    <button type="button" onClick={() => setSelectedPanel(panel)} className="relative block aspect-[4/3] overflow-hidden bg-ink-850 text-left" aria-label={`Ver detalhes de ${panel.name}`}>
                                        <img src={panel.images?.[0] || '/placeholder.svg'} alt="" loading="lazy" className="h-full w-full object-cover grayscale-[35%] transition duration-700 group-hover:scale-[1.03] group-hover:grayscale-0" />
                                        <span className="absolute left-0 top-0 bg-ink-950 px-3 py-1.5 font-mono text-[11px] text-ink-300">{String(i + 1).padStart(2, '0')}</span>
                                        <span className="absolute bottom-0 right-0 flex items-center gap-1.5 bg-ink-950 px-3 py-1.5 text-xs text-ink-100 opacity-0 transition-opacity group-hover:opacity-100">
                                            <Maximize className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" /> Detalhes
                                        </span>
                                    </button>
                                    <div className="flex flex-1 flex-col p-5">
                                        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-ink-400">
                                            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                                            <span className="truncate">{[panel.city, panel.state].filter(Boolean).join(' · ')}</span>
                                        </p>
                                        <h2 className="mt-2 line-clamp-2 text-lg font-medium tracking-tight text-ink-100">{panel.name}</h2>
                                        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-4 font-mono text-xs">
                                            <div><dt className="text-ink-500">Impactos/dia</dt><dd className="mt-1 text-ink-100">{impacts ? formatImpacts(impacts) : '—'}</dd></div>
                                            <div><dt className="text-ink-500">Formato</dt><dd className="mt-1 truncate text-ink-100">{panel.size || '—'}</dd></div>
                                        </dl>
                                        <div className="mt-auto pt-5">
                                            {basePrice > 0 ? (
                                                <p className="font-mono">
                                                    <span className="block text-xs text-ink-500 line-through">{formatCurrency(basePrice)}</span>
                                                    <span className="text-xl text-brand-neon">{formatCurrency(basePrice * (1 - ANNUAL_DISCOUNT))}</span>
                                                    <span className="text-xs text-ink-400"> /mês no plano anual</span>
                                                </p>
                                            ) : <p className="text-sm text-ink-400">Valor sob consulta</p>}
                                            <button
                                                type="button"
                                                onClick={() => toggleInCart(panel)}
                                                aria-pressed={inCart}
                                                className={`mt-4 w-full ${inCart ? btnGhost : btnPrimary}`}
                                            >
                                                {inCart ? <><Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> No projeto · remover</> : <><Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Adicionar ao projeto</>}
                                            </button>
                                        </div>
                                    </div>
                                </motion.li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </section>

        {/* ============================ DETALHES DO PAINEL ============================ */}
        <AnimatePresence>
            {selectedPanel && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[99999] flex items-center justify-center bg-ink-950/90 p-4" role="dialog" aria-modal="true" aria-labelledby="panel-title">
                    <div className="absolute inset-0" onClick={() => setSelectedPanel(null)} />
                    <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={spring} className="relative z-10 flex max-h-[90vh] w-full max-w-[960px] flex-col overflow-hidden border border-white/10 bg-ink-950 md:flex-row">
                        <button type="button" aria-label="Fechar" onClick={() => setSelectedPanel(null)} className="absolute right-0 top-0 z-10 bg-ink-950 p-3 text-ink-300 hover:text-ink-100"><X className="h-5 w-5" strokeWidth={1.75} /></button>

                        <div className="relative h-[240px] shrink-0 bg-ink-900 md:h-auto md:w-1/2">
                            <img src={selectedPanel.images?.[0] || '/placeholder.svg'} alt={`Painel ${selectedPanel.name}`} className="h-full w-full object-cover" />
                        </div>

                        <div className="flex flex-col overflow-y-auto p-6 md:w-1/2 md:p-10">
                            <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-ink-400">
                                <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" /> {[selectedPanel.city, selectedPanel.state].filter(Boolean).join(' · ')}
                            </p>
                            <h2 id="panel-title" className="mt-3 text-3xl font-light uppercase leading-tight tracking-tight text-ink-100">{selectedPanel.name}</h2>

                            <dl className="mt-8 grid grid-cols-2 border-t border-white/[0.08] font-mono text-sm">
                                <div className="border-b border-white/[0.08] py-4 pr-4"><dt className="text-xs text-ink-500">Impactos por dia</dt><dd className="mt-1 text-ink-100">{selectedPanel.impacts || '—'}</dd></div>
                                <div className="border-b border-l border-white/[0.08] py-4 pl-4"><dt className="text-xs text-ink-500">Formato</dt><dd className="mt-1 text-ink-100">{selectedPanel.size || '—'}</dd></div>
                                <div className="col-span-2 border-b border-white/[0.08] py-4"><dt className="text-xs text-ink-500">Resolução</dt><dd className="mt-1 text-ink-100">{selectedPanel.px || '—'}</dd></div>
                            </dl>

                            <div className="mt-auto pt-8">
                                {Number(selectedPanel.price) > 0 ? (
                                    <p className="font-mono">
                                        <span className="block text-xs text-ink-500">Plano anual · de <span className="line-through">{formatCurrency(Number(selectedPanel.price))}</span> por</span>
                                        <span className="text-3xl text-brand-neon">{formatCurrency(Number(selectedPanel.price) * (1 - ANNUAL_DISCOUNT))}</span>
                                        <span className="text-sm text-ink-400"> /mês</span>
                                    </p>
                                ) : <p className="text-ink-400">Valor sob consulta</p>}
                                <button type="button" onClick={() => { toggleInCart(selectedPanel); setSelectedPanel(null); }} className={`mt-6 w-full ${isInCart(selectedPanel.id) ? btnGhost : btnPrimary}`}>
                                    {isInCart(selectedPanel.id) ? 'Remover do projeto' : 'Adicionar ao projeto'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* ============================ RESUMO DO PROJETO (gaveta lateral) ============================ */}
        <AnimatePresence>
            {isSidebarOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeSidebar} className="fixed inset-0 z-[99998] bg-ink-950/80" />
                    <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }} className="fixed bottom-0 right-0 top-0 z-[99999] flex w-full flex-col border-l border-white/10 bg-ink-950 md:w-[480px]" role="dialog" aria-modal="true" aria-labelledby="cart-title">
                        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-5">
                            <div>
                                <p className={eyebrow}>{checkoutStep === 'crm' ? 'Passo 2 de 2' : checkoutStep === 'cart' ? 'Passo 1 de 2' : 'Pronto'}</p>
                                <h2 id="cart-title" className="mt-1 text-xl font-light uppercase tracking-tight text-ink-100">
                                    {checkoutStep === 'success' ? 'Pedido registrado' : checkoutStep === 'cart' ? 'Resumo do projeto' : 'Seus dados'}
                                </h2>
                            </div>
                            <button type="button" aria-label="Fechar" onClick={closeSidebar} className="p-2 text-ink-400 hover:text-ink-100"><X className="h-5 w-5" strokeWidth={1.75} /></button>
                        </div>

                        <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto p-6">
                            {checkoutStep === 'success' ? (
                                <div role="status" className="mt-12">
                                    <span className="flex h-12 w-12 items-center justify-center bg-brand-neon text-ink-950"><Check className="h-6 w-6" strokeWidth={2} aria-hidden="true" /></span>
                                    <h3 className="mt-6 text-3xl font-light uppercase tracking-tight text-ink-100">Projeto enviado</h3>
                                    <p className="mt-3 leading-relaxed text-ink-400">O comercial recebeu os painéis e os valores do seu projeto e vai falar com você em breve. Você acompanha o pedido no seu perfil.</p>
                                </div>
                            ) : checkoutStep === 'cart' ? (
                                cart.length === 0 ? (
                                    <div className="mt-12">
                                        <h3 className="text-2xl font-light uppercase tracking-tight text-ink-100">Nenhum painel ainda</h3>
                                        <p className="mt-3 text-ink-400">Use "Adicionar ao projeto" nos painéis do catálogo para montar sua campanha.</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
                                        {cart.map((p) => {
                                            const itemBasePrice = Number(p.price) || 0;
                                            return (
                                                <li key={p.id} className="flex gap-4 py-4">
                                                    <img src={p.images?.[0] || '/placeholder.svg'} alt="" className="h-20 w-24 shrink-0 bg-ink-900 object-cover" />
                                                    <div className="flex min-w-0 flex-1 flex-col">
                                                        <h4 className="truncate text-sm font-medium text-ink-100">{p.name}</h4>
                                                        <p className="mt-1 truncate text-xs uppercase tracking-[0.1em] text-ink-400">{[p.city, p.state].filter(Boolean).join(' · ')}</p>
                                                        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                                                            <p className="font-mono text-sm">
                                                                {cartDiscount > 0 && <span className="mr-2 text-xs text-ink-500 line-through">{formatCurrency(itemBasePrice)}</span>}
                                                                <span className="text-brand-neon">{formatCurrency(itemBasePrice * (1 - cartDiscount))}</span><span className="text-xs text-ink-400">/mês</span>
                                                            </p>
                                                            <button type="button" onClick={() => toggleInCart(p)} className="text-xs text-ink-400 underline-offset-4 hover:text-ink-100 hover:underline">Remover</button>
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )
                            ) : (
                                <form id="crm-form" onSubmit={handleOrderSubmit} className="flex flex-col gap-5">
                                    <div><label htmlFor="o-name" className="mb-2 block text-sm text-ink-300">Nome completo</label><input id="o-name" required autoComplete="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={field} /></div>
                                    <div><label htmlFor="o-phone" className="mb-2 block text-sm text-ink-300">WhatsApp</label><input id="o-phone" required type="tel" autoComplete="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={field} /></div>
                                    <div><label htmlFor="o-company" className="mb-2 block text-sm text-ink-300">Agência ou empresa <span className="text-ink-500">(opcional)</span></label><input id="o-company" autoComplete="organization" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className={field} /></div>
                                    <div><label htmlFor="o-msg" className="mb-2 block text-sm text-ink-300">Observações <span className="text-ink-500">(opcional)</span></label><textarea id="o-msg" rows={3} value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className={`${field} resize-none`} /></div>
                                </form>
                            )}
                        </div>

                        {checkoutStep === 'cart' ? (
                            <div className="flex shrink-0 flex-col gap-5 border-t border-white/[0.08] p-6">
                                <div>
                                    <label htmlFor="catalog-months" className="mb-2 block text-sm text-ink-300">Duração da campanha</label>
                                    <CustomSelect tone="site" id="catalog-months" value={cartMonths} onChange={setCartMonths} className="py-3"
                                        options={monthOptions.map((o) => ({ value: o.value, label: o.label }))} />
                                </div>

                                <div>
                                    <label htmlFor="coupon" className="mb-2 block text-sm text-ink-300">Cupom <span className="text-ink-500">(opcional)</span></label>
                                    {appliedCoupon ? (
                                        <div className="flex items-center justify-between gap-3 border border-brand-neon/40 px-4 py-3 text-sm text-brand-neon">
                                            <span className="flex items-center gap-2 truncate"><Tag className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" /> {appliedCoupon.code} · {appliedCoupon.label}</span>
                                            <button type="button" onClick={handleRemoveCoupon} className="text-xs text-ink-400 hover:text-ink-100">Remover</button>
                                        </div>
                                    ) : (
                                        <div className="flex">
                                            <input id="coupon" type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="CÓDIGO" className={`${field} font-mono uppercase`} />
                                            <button type="button" onClick={handleApplyCoupon} disabled={!couponInput.trim() || cart.length === 0} className="border border-l-0 border-white/15 px-5 text-sm text-ink-100 hover:bg-ink-800 disabled:opacity-40">Aplicar</button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-end justify-between border-t border-white/[0.08] pt-5">
                                    <span className="text-sm text-ink-400">Investimento mensal</span>
                                    <span className="font-mono text-3xl text-brand-neon">{formatCurrency(finalCartMonthlyValue)}</span>
                                </div>

                                <button type="button" disabled={cart.length === 0} onClick={() => setCheckoutStep('crm')} className={`${btnPrimary} w-full`}>
                                    Continuar <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                                </button>
                            </div>
                        ) : checkoutStep === 'crm' ? (
                            <div className="shrink-0 border-t border-white/[0.08] p-6">
                                {!user?.id && (
                                    <p role="alert" className="mb-4 text-sm text-ink-400">
                                        Para enviar o pedido, <Link to="/login" className="text-ink-100 underline underline-offset-4">entre na sua conta</Link> ou <Link to="/cadastro" className="text-ink-100 underline underline-offset-4">cadastre-se</Link>.
                                    </p>
                                )}
                                <button type="submit" form="crm-form" disabled={isSubmitting || !user?.id} className={`${btnPrimary} w-full`}>
                                    {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Enviando</> : 'Enviar pedido'}
                                </button>
                                <button type="button" onClick={() => setCheckoutStep('cart')} className="mt-4 w-full text-center text-sm text-ink-400 hover:text-ink-100">Voltar ao resumo</button>
                            </div>
                        ) : (
                            <div className="shrink-0 border-t border-white/[0.08] p-6">
                                <button type="button" onClick={closeSidebar} className={`${btnGhost} w-full`}>Fechar</button>
                            </div>
                        )}
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
        </>
    );
}
