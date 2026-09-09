import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ShoppingCart, X, Loader2, Search, Filter,
    Heart, Maximize, CheckCircle, Tag, Activity, ShieldCheck
} from 'lucide-react';

import { api } from '@/lib/axios';
import { panelsService } from '@/services/panels.service';
import { useCart, Panel } from '@/contexts/CartContext';
import { CustomSelect } from '@/components/CustomSelect';
import { Button } from '@/components/Button';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

const formatCurrency = (value: number | string) => {
    const numericValue = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue);
};

// Mock de cupons para simulação
const MOCK_COUPONS: { [key: string]: number } = {
    'T3OOH10': 0.10, // 10% de desconto adicional
    'VICTOR20': 0.20, // 20% de desconto adicional
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

    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [selectedPanel, setSelectedPanel] = useState<CartPanel | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'crm' | 'success'>('cart');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estado Global de Meses para o Carrinho Inteiro
    const [cartMonths, setCartMonths] = useState<string>('12');

    // Estados para Cupom
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

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

    // Reseta o passo do checkout e cupom ao fechar a sidebar
    useEffect(() => {
        if (!isSidebarOpen) {
            setTimeout(() => {
                setCheckoutStep('cart');
                setCouponInput('');
                setAppliedCoupon(null);
            }, 300);
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
            const safeSearch = searchTerm.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
        let discountLabel = '(Valor Base)';
        
        if (month >= 12) discountLabel = '(30% OFF)';
        else if (month >= 6) discountLabel = '(20% OFF)';
        else if (month >= 3) discountLabel = '(15% OFF)';

        return {
            value: String(month),
            label: `${month} Mês${month > 1 ? 'es' : ''} ${discountLabel}`
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
    
    const couponDiscountPercent = appliedCoupon ? appliedCoupon.discount : 0;
    const finalCartMonthlyValue = discountedCartMonthlyValue * (1 - couponDiscountPercent);

    const handleApplyCoupon = () => {
        const code = couponInput.trim().toUpperCase();
        if (!code) return;

        if (MOCK_COUPONS[code]) {
            setAppliedCoupon({ code: code, discount: MOCK_COUPONS[code] });
            addToast(`Cupom ${code} aplicado com sucesso!`, 'success');
        } else {
            addToast('Cupom inválido ou expirado.', 'error');
            setAppliedCoupon(null);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput('');
        addToast('Cupom removido.', 'info');
    };

    const toggleFavorite = (e: React.MouseEvent, panelId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setFavorites(prev => {
            const next = new Set(prev);
            if (next.has(panelId)) next.delete(panelId);
            else next.add(panelId);
            return next;
        });
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
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + maxMonths);

            let totalContractValue = 0;
            const structuredItems = cart.map((panel) => {
                const monthlyFinal = (Number(panel.price) || 0) * (1 - cartDiscount) * (1 - couponDiscountPercent);
                const totalItemValue = monthlyFinal * maxMonths;
                
                totalContractValue += totalItemValue;

                return {
                    panelId: panel.id,
                    priceSnapshot: totalItemValue
                };
            });

            let extraNotes = formData.message;
            extraNotes += `\n[Prazo da Campanha]: ${maxMonths} meses (${cartDiscount * 100}% de desconto de prazo).`;
            if (appliedCoupon) extraNotes += `\n[Cupom Aplicado]: ${appliedCoupon.code} (${appliedCoupon.discount * 100}% extra).`;
            extraNotes += `\nCliente: ${formData.name} | Tel: ${formData.phone} | Agência/Empresa: ${formData.company}`;

            await api.post('/orders', {
                userId: user.id,
                companyId: (user as any).companyId || null,
                status: 'PENDING',
                totalValue: totalContractValue,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                notes: extraNotes.trim(),
                items: structuredItems
            });

            setCheckoutStep('success');
            clearCart();
            setFormData({ name: '', email: '', phone: '', company: '', message: '' });

        } catch (err: any) {
            console.error("Erro ao salvar pacote de pedidos no banco de dados:", err);
            addToast('Ocorreu um erro ao processar seu pedido. Tente novamente.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Componente Interno do Card (Sem Seletor - Foco em Marketing)
    const PanelCard = ({ panel }: { panel: Panel }) => {
        const inCart = isInCart(panel.id);
        const isFavorite = favorites.has(panel.id);
        const basePrice = Number(panel.price) || 0;
        
        // Exibição padrão de Marketing (Preço de 12 Meses = 30% OFF)
        const marketingDiscount = 0.30;
        const marketingPrice = basePrice * (1 - marketingDiscount);

        return (
            <motion.div
                onClick={() => setSelectedPanel(panel)}
                whileHover={{ y: -5 }}
                className={`bg-[#111113] rounded-md overflow-hidden border transition-all flex flex-col cursor-pointer ${inCart ? 'border-[#FF5E00]' : 'border-white/10 hover:border-white/30'}`}
            >
                <div className="h-[220px] relative bg-black shrink-0 w-full border-b border-white/5 group">
                    <img src={panel.images?.[0] || '/placeholder.jpg'} alt={panel.name} className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" />

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-transparent text-white font-bold px-6 py-2.5 rounded-md border border-white/40 flex items-center gap-2 text-sm uppercase tracking-widest">
                            <Maximize className="w-4 h-4" /> Detalhes Técnicos
                        </div>
                    </div>

                    <button onClick={(e) => toggleFavorite(e, panel.id)} className="absolute top-3 right-3 bg-[#0A0A0B] p-2 rounded-md border border-white/10 z-10 hover:border-[#FF5E00]/50 transition-colors">
                        <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-[#FF5E00] text-[#FF5E00]' : 'text-white'}`} />
                    </button>
                    
                    <div className="absolute top-3 left-3 bg-[#FF5E00] text-white font-black px-2 py-1 rounded-sm text-[10px] uppercase tracking-widest">
                        -30% OFF Anual
                    </div>
                </div>
                
                <div className="p-5 flex flex-col flex-1 relative z-10">
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-white line-clamp-1 pr-2 mb-1 uppercase tracking-wide">{panel.name}</h3>
                        <p className="text-xs text-[#8F8F91] flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5 text-[#FF5E00] shrink-0" /> <span className="truncate">{panel.city} - {panel.state}</span></p>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto border-t border-white/10 pt-4">
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center text-[10px] text-[#8F8F91] uppercase font-bold tracking-wider mb-1">
                                <span>Valor Mensal (Plano 12x)</span>
                                <span className="line-through">{formatCurrency(basePrice)}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-2xl font-black text-[#25D366]">{formatCurrency(marketingPrice)}</span>
                            </div>
                        </div>

                        <button onClick={(e) => { e.stopPropagation(); toggleInCart(panel); }} className={`w-full py-3 rounded-md text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${inCart ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-[#FF5E00] text-white hover:bg-[#e05300]'}`}>
                            {inCart ? <><X className="w-4 h-4" /> Remover</> : <><ShoppingCart className="w-4 h-4" /> Adicionar</>}
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="relative w-full min-h-screen bg-[#0A0A0B] flex flex-col overflow-x-hidden selection:bg-[#FF5E00]/30 selection:text-[#FF5E00]">

            <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

            {/* HEADER E FILTROS */}
            <div className="flex flex-col max-w-[1400px] mx-auto px-6 relative z-10 w-full pt-28 pb-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3">
                            Catálogo De Painéis
                        </h1>
                        <p className="text-[#8F8F91] mt-3 font-medium text-sm md:text-base">Escolha Os Melhores Pontos Para Sua Campanha E Personalize A Duração No Carrinho.</p>
                    </div>
                    
                    <button onClick={() => setIsSidebarOpen(true)} className="relative bg-[#111113] border border-white/10 px-8 py-4 rounded-md text-white font-bold hover:border-[#FF5E00] hover:text-white uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2">
                        <ShoppingCart className="w-4 h-4" /> Resumo do Projeto
                        {cart.length > 0 && <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#FF5E00] text-white text-xs font-black rounded-sm flex items-center justify-center">{cart.length}</span>}
                    </button>
                </div>

                {/* BARRA DE FILTROS SÓLIDA */}
                <div className="bg-[#111113] p-4 md:p-6 rounded-md mb-12 border border-white/10 relative z-20 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-[#8F8F91] group-focus-within:text-[#FF5E00] transition-colors" /></div>
                        <input type="text" placeholder="Buscar por avenida, região ou nome do painel..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-12 pr-4 py-3.5 bg-[#0A0A0B] border border-white/10 rounded-md text-white placeholder:text-[#8F8F91] focus:outline-none focus:border-[#FF5E00] transition-colors font-medium text-sm" autoComplete="off" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 md:w-5/12">
                        <div className="w-full relative z-30"><CustomSelect options={stateOptions} value={selectedState} onChange={(val: string) => { setSelectedState(val); setSelectedCity(''); }} placeholder="Estado" icon={<Filter className="w-4 h-4" />} /></div>
                        <div className={`w-full relative z-20 ${!selectedState && cityOptions.length === 1 ? 'opacity-40 pointer-events-none' : ''}`}><CustomSelect options={cityOptions} value={selectedCity} onChange={(val: string) => setSelectedCity(val)} placeholder="Cidade" icon={<MapPin className="w-4 h-4" />} /></div>
                    </div>
                </div>

                {/* GRID DE RESULTADOS */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 relative z-10"><Loader2 className="w-10 h-10 text-[#FF5E00] animate-spin mb-4" /><p className="text-[#8F8F91] uppercase tracking-widest text-xs font-bold">Carregando Inventário...</p></div>
                ) : filteredPanels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-[#111113] rounded-md border border-white/10 relative z-10"><Search className="w-16 h-16 text-white/10 mb-4" /><h3 className="text-lg font-bold text-white mb-2">Nenhum Ponto Encontrado</h3><p className="text-sm text-[#8F8F91] text-center max-w-md">Modifique sua busca ou limpe os filtros selecionados.</p></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 relative z-10 pb-20">
                        {filteredPanels.map(panel => <PanelCard key={panel.id} panel={panel} />)}
                    </div>
                )}
            </div>

            {/* MODAL DETALHES DO PAINEL (VER MAIS SÓLIDO E DIRETO) */}
            <AnimatePresence>
                {selectedPanel && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 p-4">
                        <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedPanel(null)} />
                        
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-[900px] bg-[#0A0A0B] border border-white/10 rounded-md overflow-hidden relative z-10 flex flex-col md:flex-row max-h-[90vh]">
                            
                            <button onClick={() => setSelectedPanel(null)} className="absolute top-4 right-4 z-50 bg-[#111113] border border-white/10 p-2 rounded-sm text-[#8F8F91] hover:text-white hover:border-[#FF5E00] transition-colors"><X className="w-5 h-5" /></button>
                            
                            <div className="w-full md:w-1/2 h-[250px] md:h-auto bg-black relative border-b md:border-b-0 md:border-r border-white/5">
                                <img src={selectedPanel.images?.[0] || '/placeholder.jpg'} alt={selectedPanel.name} className="w-full h-full object-cover opacity-80" />
                                <div className="absolute bottom-4 left-4 bg-[#FF5E00] text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm">
                                    Ponto Auditado
                                </div>
                            </div>
                            
                            <div className="w-full md:w-1/2 p-8 overflow-y-auto flex flex-col bg-[#111113]">
                                <span className="text-[#FF5E00] text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {selectedPanel.city} - {selectedPanel.state}</span>
                                <h2 className="text-2xl font-black text-white mb-6 uppercase leading-tight">{selectedPanel.name}</h2>
                                
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-[#0A0A0B] border border-white/5 p-4 rounded-md">
                                        <Activity className="w-5 h-5 text-[#FF5E00] mb-2" />
                                        <p className="text-[10px] text-[#8F8F91] uppercase tracking-wider font-bold mb-1">Impactos / Dia</p>
                                        <p className="text-lg font-black text-white">{selectedPanel.impacts || 'N/A'}</p>
                                    </div>
                                    <div className="bg-[#0A0A0B] border border-white/5 p-4 rounded-md">
                                        <Maximize className="w-5 h-5 text-[#FF5E00] mb-2" />
                                        <p className="text-[10px] text-[#8F8F91] uppercase tracking-wider font-bold mb-1">Formato</p>
                                        <p className="text-lg font-black text-white">{selectedPanel.size || 'N/A'}</p>
                                    </div>
                                    <div className="bg-[#0A0A0B] border border-white/5 p-4 rounded-md col-span-2 flex items-center gap-4">
                                        <ShieldCheck className="w-5 h-5 text-[#FF5E00] shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-[#8F8F91] uppercase tracking-wider font-bold">Resolução da Tela</p>
                                            <p className="text-sm font-black text-white">{selectedPanel.px || 'Alta Definição'}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-auto border-t border-white/10 pt-6">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] text-[#8F8F91] uppercase font-bold tracking-widest">Valor Mensal (Plano Anual)</span>
                                        <span className="text-[10px] text-[#8F8F91] line-through">{formatCurrency(Number(selectedPanel.price))}</span>
                                    </div>
                                    <div className="flex justify-between items-end mb-6">
                                        <span className="text-3xl font-black text-[#25D366]">{formatCurrency(Number(selectedPanel.price) * 0.70)}</span>
                                    </div>
                                    
                                    <Button onClick={() => { toggleInCart(selectedPanel); setSelectedPanel(null); }} className={`w-full py-4 text-xs tracking-widest font-black uppercase rounded-md border ${isInCart(selectedPanel.id) ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : 'bg-[#FF5E00] text-white border-transparent hover:bg-[#e05300]'}`}>
                                        {isInCart(selectedPanel.id) ? 'Remover do Projeto' : 'Adicionar ao Projeto'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CARRINHO LATERAL Z-INDEX MÁXIMO SOBREPONDO TUDO */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/80 z-[99998]" />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-[#0A0A0B] border-l border-white/10 z-[99999] flex flex-col">
                            
                            <div className="px-6 py-6 border-b border-white/10 bg-[#111113] flex justify-between items-center shrink-0">
                                <h2 className="text-lg font-black text-white uppercase tracking-widest">
                                    {checkoutStep === 'success' ? 'Pedido Registrado!' : checkoutStep === 'cart' ? 'Resumo do Projeto' : 'Identificação'}
                                </h2>
                                <button onClick={() => { setIsSidebarOpen(false); if(checkoutStep === 'success') setCheckoutStep('cart'); }} className="text-[#8F8F91] hover:text-white p-1 bg-white/5 rounded-sm"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
                                {checkoutStep === 'success' ? (
                                    <div className="flex flex-col items-center text-center mt-20">
                                        <CheckCircle className="w-16 h-16 text-[#25D366] mb-6" />
                                        <h3 className="text-2xl font-black text-white mb-2 uppercase">Projeto Solicitado!</h3>
                                        <p className="text-[#8F8F91] text-sm leading-relaxed">Sua configuração de painéis foi enviada com sucesso para nossa equipe comercial. Entraremos em contato em breve.</p>
                                    </div>
                                ) : checkoutStep === 'cart' ? (
                                    cart.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                            <ShoppingCart className="w-12 h-12 text-[#8F8F91] mb-4" />
                                            <p className="text-sm font-medium text-[#8F8F91] uppercase tracking-widest">Seu projeto está vazio.</p>
                                        </div>
                                    ) : (
                                        cart.map((p: any) => {
                                            const itemBasePrice = Number(p.price) || 0;
                                            const itemFinalPrice = itemBasePrice * (1 - cartDiscount);

                                            return (
                                                <div key={p.id} className="flex gap-4 p-4 bg-[#111113] border border-white/5 rounded-md relative">
                                                    <img src={p.images?.[0] || '/placeholder.jpg'} alt={p.name} className="w-24 h-full min-h-[90px] rounded-sm object-cover shrink-0 bg-black opacity-80" />
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                                        <h4 className="text-sm font-bold text-white truncate uppercase">{p.name}</h4>
                                                        <p className="text-[10px] text-[#8F8F91] uppercase flex items-center gap-1"><MapPin className="w-3 h-3 text-[#FF5E00]"/> {p.city} - {p.state}</p>
                                                        
                                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                                            <span className="text-[9px] text-[#8F8F91] uppercase">Impactos: <span className="text-white font-bold">{p.impacts || 'N/A'}</span></span>
                                                            <span className="text-[9px] text-[#8F8F91] uppercase">Formato: <span className="text-white font-bold">{p.size || 'N/A'}</span></span>
                                                        </div>
                                                        
                                                        <div className="flex justify-between items-end mt-2 gap-2 border-t border-white/5 pt-2">
                                                            <div className="flex flex-col">
                                                                {cartDiscount > 0 && <span className="text-[9px] text-[#8F8F91] line-through">{formatCurrency(itemBasePrice)}</span>}
                                                                <span className="text-sm font-black text-[#25D366] truncate">{formatCurrency(itemFinalPrice)} <span className="text-[9px] text-[#8F8F91] font-normal uppercase">/mês</span></span>
                                                            </div>
                                                            <button onClick={() => toggleInCart(p)} className="text-[10px] text-red-500 uppercase font-bold shrink-0 hover:text-red-400">Remover</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )
                                ) : (
                                    <form id="crm-form" onSubmit={handleOrderSubmit} className="flex flex-col gap-5">
                                        <div className="flex flex-col gap-1.5"><label className="text-[10px] text-[#8F8F91] font-bold uppercase tracking-widest">Nome Completo *</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-[#111113] border border-white/10 rounded-md p-3.5 text-white focus:border-[#FF5E00] outline-none text-sm" /></div>
                                        <div className="flex flex-col gap-1.5"><label className="text-[10px] text-[#8F8F91] font-bold uppercase tracking-widest">WhatsApp *</label><input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-[#111113] border border-white/10 rounded-md p-3.5 text-white focus:border-[#FF5E00] outline-none text-sm" /></div>
                                        <div className="flex flex-col gap-1.5"><label className="text-[10px] text-[#8F8F91] font-bold uppercase tracking-widest">Agência/Empresa</label><input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="bg-[#111113] border border-white/10 rounded-md p-3.5 text-white focus:border-[#FF5E00] outline-none text-sm" /></div>
                                        <div className="flex flex-col gap-1.5"><label className="text-[10px] text-[#8F8F91] font-bold uppercase tracking-widest">Mensagem / Observações</label><textarea rows={3} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="bg-[#111113] border border-white/10 rounded-md p-3.5 text-white focus:border-[#FF5E00] outline-none resize-none text-sm" /></div>
                                    </form>
                                )}
                            </div>

                            {checkoutStep === 'cart' ? (
                                <div className="bg-[#111113] p-6 border-t border-white/10 flex flex-col gap-5 shrink-0">
                                    
                                    <div className="flex flex-col gap-4">
                                        {/* SELETOR GLOBAL DE MESES AQUI NO CARRINHO */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-[#8F8F91] uppercase font-bold tracking-widest block">Duração da Campanha</label>
                                            <div className="relative z-50">
                                                <CustomSelect 
                                                    options={monthOptions} 
                                                    value={cartMonths} 
                                                    onChange={(val: string) => setCartMonths(val)} 
                                                    placeholder="Duração do Contrato"
                                                    maxHeight="max-h-[132px]" // Mostra ~3 itens por vez
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-[#8F8F91] uppercase font-bold tracking-widest block">Cupom de Desconto Extra</label>
                                            {appliedCoupon ? (
                                                <div className="flex items-center justify-between gap-3 bg-[#25D366]/5 border border-[#25D366]/20 p-3 rounded-md text-[#25D366]">
                                                    <div className="flex items-center gap-2.5 truncate">
                                                        <Tag className="w-4 h-4 shrink-0" />
                                                        <span className="text-xs font-bold truncate">{appliedCoupon.code} ({appliedCoupon.discount * 100}% OFF extra)</span>
                                                    </div>
                                                    <button onClick={handleRemoveCoupon} className="text-[10px] font-bold uppercase text-[#8F8F91] hover:text-white">Remover</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="text"
                                                        value={couponInput}
                                                        onChange={(e) => setCouponInput(e.target.value)}
                                                        placeholder="DIGITE O CUPOM"
                                                        className="flex-1 bg-[#0A0A0B] border border-white/10 rounded-md px-4 py-3 text-xs text-white placeholder:text-[#555] focus:border-[#FF5E00] outline-none uppercase font-bold tracking-widest"
                                                    />
                                                    <Button onClick={handleApplyCoupon} className="bg-[#111113] border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest px-5 py-3 rounded-md hover:bg-white/5">Aplicar</Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1 bg-[#0A0A0B] p-4 rounded-md border border-white/5">
                                            <span className="text-[10px] font-bold text-[#8F8F91] uppercase tracking-widest mb-1">Investimento Mensal Total</span>
                                            <div className="flex justify-between items-end">
                                                <span className="text-3xl font-black text-[#25D366]">{formatCurrency(finalCartMonthlyValue)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Button disabled={cart.length === 0} onClick={() => setCheckoutStep('crm')} className="w-full bg-[#FF5E00] py-4 rounded-md font-black text-white text-xs uppercase tracking-widest hover:bg-[#e05300] transition-colors">Avançar para Identificação</Button>
                                </div>
                            ) : checkoutStep === 'crm' ? (
                                <div className="bg-[#111113] p-6 border-t border-white/10">
                                    <Button type="submit" form="crm-form" disabled={isSubmitting || !user?.id} className="w-full bg-[#25D366] py-4 rounded-md font-black text-[#0A0A0B] hover:bg-[#1eb858] text-xs uppercase tracking-widest">
                                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : 'Finalizar Pedido'}
                                    </Button>
                                    <button onClick={() => setCheckoutStep('cart')} className="w-full text-center text-[10px] tracking-widest uppercase text-[#8F8F91] mt-4 hover:text-white font-bold">Voltar para o projeto</button>
                                </div>
                            ) : (
                                <div className="bg-[#111113] p-6 border-t border-white/10">
                                    <Button onClick={() => { setIsSidebarOpen(false); setCheckoutStep('cart'); }} className="w-full bg-white/10 text-white py-4 rounded-md font-black hover:bg-white/15 text-xs uppercase tracking-widest">Fechar Janela</Button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}