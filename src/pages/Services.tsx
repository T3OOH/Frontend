import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    MapPin, ShoppingCart, X, Loader2, LayoutGrid, Search, Filter, 
    Zap, Compass, Shield, MonitorPlay, Send, Tag, CheckCircle2, 
    CalendarDays, Heart, ChevronLeft, ChevronRight, Activity, 
    Maximize, Info, ShieldCheck, Navigation, Star
} from 'lucide-react';

import { api } from '@/lib/axios';
import { panelsService } from '@/services/panels.service';
import { bannerService, BannerData } from '@/services/banner.service';
import { useCart, Panel } from '@/contexts/CartContext';
import { CustomSelect } from '@/components/CustomSelect';
import { Button } from '@/components/Button';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

const expandedMarker = L.divIcon({
    className: 't3-expanded-marker',
    html: `
        <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="background-color: #111113; border: 2px solid #FF5E00; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(255, 94, 0, 0.6); z-index: 10;">
                <span style="color: white; font-weight: 900; font-size: 18px; letter-spacing: -1px; font-family: system-ui, sans-serif;">t3</span>
            </div>
            <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 10px solid #FF5E00; margin-top: -2px;"></div>
        </div>
    `,
    iconSize: [44, 54],
    iconAnchor: [22, 54],
});

function MapFixer() {
    const map = useMap();
    useEffect(() => { setTimeout(() => map.invalidateSize(), 300); }, [map]);
    return null;
}

const formatCurrency = (value: number | string) => {
    const numericValue = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue);
};

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

export function Services() {
    const { user } = useAuth();
    const { cart, toggleInCart, isInCart, clearCart } = useCart();
    const { addToast } = useToast();

    const [banners, setBanners] = useState<BannerData[]>([]);
    const [currentBanner, setCurrentBanner] = useState(0);
    
    const [panels, setPanels] = useState<Panel[]>([]);
    const [commercialSellers, setCommercialSellers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'crm'>('cart');
    const [months, setMonths] = useState(1);
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', message: '' });

    // Autopreenchimento de dados do cliente logado
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

    useEffect(() => {
        if (isSidebarOpen || selectedPanel) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isSidebarOpen, selectedPanel]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                
                // 1. Busca os Painéis
                const panelsData = await panelsService.getAllPanels();
                const validPanels = panelsData
                    .filter((p: any) => p.status === 'AVAILABLE' && p.id)
                    .map((p: any) => ({
                        ...p,
                        id: p.id,
                        name: p.name || 'Sem Nome',
                        city: p.city || 'Desconhecida',
                        state: p.state || '',
                        status: p.status || 'AVAILABLE',
                        impacts: String(p.impacts || '0'),
                        size: String(p.size || '7x3'),
                        px: String(p.px || 'Alta Resolução'),
                        lat: Number(p.lat) || 0,
                        lng: Number(p.lng) || 0,
                        price: Number(p.price) || 0
                    })) as Panel[];
                setPanels(validPanels);

                // 2. Busca os Banners
                bannerService.getActiveBanners().then(data => {
                    if (data && Array.isArray(data)) setBanners(data);
                }).catch(() => {});

                // 3. Busca a equipe COMERCIAL
                try {
                    const usersRes = await api.get('/users');
                    if (usersRes.data && Array.isArray(usersRes.data)) {
                        const sellers = usersRes.data.filter((u: any) => u.role === 'COMERCIAL' && u.phone);
                        setCommercialSellers(sellers);
                    }
                } catch (err) {
                    console.error("Aviso: Não foi possível carregar a lista de vendedores. Usando fallback.", err);
                }

            } catch (error) {
                console.error("Erro ao carregar servicos:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!isSidebarOpen) setTimeout(() => setCheckoutStep('cart'), 300);
    }, [isSidebarOpen]);

    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [banners.length]);

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
        const price = livePanel ? livePanel.price : cartItem.price;
        return acc + (Number(price) || 0);
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

    const handleWhatsAppSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const totalOriginalCartValue = cart.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
            const discountRatio = totalOriginalCartValue > 0 ? (finalMonthlyValue / totalOriginalCartValue) : 1;

            const structuredItems = cart.map(p => ({
                panelId: p.id,
                priceSnapshot: (Number(p.price) || 0) * discountRatio
            }));

            let extraNotes = formData.message;
            if (appliedCoupon || termDiscountPercent > 0) {
                extraNotes += `\n[Descontos]: `;
                if (appliedCoupon) extraNotes += `${appliedCoupon.code} (${appliedCoupon.discount * 100}%). `;
                if (termDiscountPercent > 0) extraNotes += `Prazo ${months}x (${termDiscountPercent * 100}%).`;
            }

            // Envia para o CRM
            api.post('/crm/deals/checkout', {
                clientDetails: { ...formData, message: extraNotes.trim() },
                contractMonths: months,
                originalValue: totalWithoutAnyDiscount,
                expectedValue: finalTotalValue,
                items: structuredItems,
                source: 'CATALOG_SERVICES_WA'
            }).catch(() => {}); 

            const defaultSellers = [
                { name: 'Victor Hugo', phone: '556293206010' },
                { name: 'Lucas Dourado', phone: '556492832807' }
            ];
            const availableSellers = commercialSellers.length > 0 ? commercialSellers : defaultSellers;

            const lastIndex = parseInt(localStorage.getItem('@t3:lastSeller') || '0', 10);
            const nextIndex = (lastIndex + 1) % availableSellers.length;
            localStorage.setItem('@t3:lastSeller', nextIndex.toString());
            
            const targetSeller = availableSellers[nextIndex];
            const phoneToUse = targetSeller.phone;

            let cleanPhone = String(phoneToUse).replace(/\D/g, '');
            if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) cleanPhone = '55' + cleanPhone;

            let text = `*Novo Pedido de Orçamento - T3 OOH*\n\n`;
            text += `*Cliente:* ${formData.name}\n`;
            text += `*Empresa:* ${formData.company || 'Não informada'}\n\n`;
            text += `*Painéis Selecionados (${cart.length}):*\n`;
            cart.forEach(p => { text += `- ${p.name} (${p.city})\n`; });
            text += `\n*Duração:* ${months} meses\n`;
            if (termDiscountPercent > 0) text += `*Desconto de Prazo:* ${termDiscountPercent * 100}%\n`;
            text += `*Investimento Mensal:* ${formatCurrency(finalMonthlyValue)}\n`;
            text += `*Valor Total da Campanha:* ${formatCurrency(finalTotalValue)}\n`;
            if (formData.message) text += `\n*Observações:* ${formData.message}\n`;

            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
            
            addToast(`Redirecionando para o WhatsApp de ${targetSeller.name.split(' ')[0]}...`, 'success');
            clearCart();
            setIsSidebarOpen(false);
            setCheckoutStep('cart');
            setFormData({ name: '', email: '', phone: '', company: '', message: '' });

            window.open(waUrl, '_blank');
        } catch (err: any) {
            console.error("Erro no Checkout:", err);
            addToast('Ocorreu um erro inesperado.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderCard = (panel: Panel) => {
        const inCart = isInCart(panel.id);
        const isFavorite = favorites.has(panel.id);
        const basePrice = Number(panel.price) || 0;
        const annualPrice = basePrice * 0.70;

        return (
            <motion.div
                key={panel.id}
                onClick={() => setSelectedPanel(panel)}
                whileHover={{ y: -5 }}
                className={`bg-[#111113] rounded-[24px] overflow-hidden border transition-all shadow-xl flex flex-col cursor-pointer ${inCart ? 'border-[#FF5E00]/50 shadow-[0_0_20px_rgba(255,94,0,0.15)] bg-[#FF5E00]/5' : 'border-white/5 hover:border-white/20'}`}
            >
                <div className="h-[200px] relative bg-black shrink-0 w-full border-b border-white/5 group">
                    <img src={panel.images?.[0] || '/placeholder.jpg'} alt={panel.name} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
                    
                    {/* Botão de expansão no Hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-white/10 text-white font-bold px-6 py-2.5 rounded-full border border-white/20 flex items-center gap-2 text-sm shadow-xl">
                            <Maximize className="w-4 h-4" /> Ver Detalhes
                        </div>
                    </div>

                    <button onClick={(e) => toggleFavorite(e, panel.id)} className="absolute top-4 right-4 bg-[#0A0A0B]/60 backdrop-blur-md p-2 rounded-full border border-white/10 z-10 hover:scale-110 transition-transform">
                        <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-[#FF5E00] text-[#FF5E00]' : 'text-white'}`} />
                    </button>

                    <div className="absolute bottom-3 left-3 bg-[#0A0A0B]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#FF5E00]" />
                        <span className="text-xs font-black text-white tracking-wider">{panel.impacts || '1.2M'} impactos</span>
                    </div>
                </div>
                <div className="p-5 flex flex-col flex-1 relative z-10">
                    <div className="mb-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-white line-clamp-1 pr-2">{panel.name}</h3>
                            <div className="flex items-center gap-1 shrink-0 bg-white/5 px-2 py-1 rounded text-sm font-bold text-white">
                                <Star className="w-4 h-4 fill-[#FF5E00] text-[#FF5E00]" /> 4.9
                            </div>
                        </div>
                        <p className="text-xs text-[#8F8F91] flex items-center gap-1.5 truncate"><MapPin className="w-4 h-4 text-[#8F8F91] shrink-0" /> <span className="truncate">{panel.city} - {panel.state}</span></p>
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-white/5 pt-4 mb-4 mt-auto">
                        <div className="flex flex-col">
                            <span className="text-xs text-[#8F8F91] uppercase tracking-wider font-bold mb-1 flex items-center">
                                Investimento 
                                <span className="line-through opacity-50 ml-1.5 font-normal text-[10px]">{formatCurrency(basePrice)}</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-[#FF5E00]">{formatCurrency(annualPrice)}</span>
                                <span className="bg-[#FF5E00]/20 text-[#FF5E00] text-[9px] font-black px-1.5 py-0.5 rounded border border-[#FF5E00]/30">-30% ANUAL</span>
                            </div>
                        </div>
                    </div>

                    <button onClick={(e) => { e.stopPropagation(); toggleInCart(panel); }} className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${inCart ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-[#0A0A0B] text-white border border-white/10 hover:border-[#FF5E00] hover:text-[#FF5E00]'}`}>
                        {inCart ? <><X className="w-4 h-4" /> REMOVER</> : <><ShoppingCart className="w-4 h-4" /> ADICIONAR</>}
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="relative w-full min-h-[100dvh] bg-[#0A0A0B] flex flex-col pt-[72px] md:pt-[90px]">
            
            {/* BACKGROUND CINEMÁTICO */}
            {banners.length > 0 && (
                <div className="absolute top-0 left-0 right-0 h-[50vh] md:h-[65vh] z-0 overflow-hidden group pointer-events-auto">
                    <div 
                        className="absolute inset-0 flex transition-transform duration-1000 ease-in-out" 
                        style={{ transform: `translateX(-${currentBanner * 100}%)` }}
                    >
                        {banners.map((banner) => (
                            <div key={banner.id} className="min-w-full h-full relative">
                                {banner.linkUrl ? (
                                    <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer">
                                        <img src={banner.imageUrl} alt={banner.title || 'Background da Campanha'} className="w-full h-full object-cover opacity-100" />
                                    </a>
                                ) : (
                                    <img src={banner.imageUrl} alt={banner.title || 'Background da Campanha'} className="w-full h-full object-cover opacity-100" />
                                )}
                            </div>
                        ))}
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B]/80 via-transparent via-40% to-[#0A0A0B] pointer-events-none" />

                    {banners.length > 1 && (
                        <>
                            <button onClick={() => setCurrentBanner(prev => (prev === 0 ? banners.length - 1 : prev - 1))} className="absolute left-4 md:left-8 top-[55%] -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-black/30 hover:bg-[#FF5E00] hover:text-black border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg z-20 cursor-pointer">
                                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                            <button onClick={() => setCurrentBanner(prev => (prev + 1) % banners.length)} className="absolute right-4 md:right-8 top-[55%] -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-black/30 hover:bg-[#FF5E00] hover:text-black border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg z-20 cursor-pointer">
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                            <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                                {banners.map((_, idx) => (
                                    <button key={idx} onClick={() => setCurrentBanner(idx)} className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === currentBanner ? 'w-8 bg-[#FF5E00]' : 'w-2 bg-white/50 hover:bg-white'}`} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {banners.length === 0 && (
                <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
            )}

            {/* DESKTOP LAYOUT */}
            <div className={`hidden lg:block max-w-7xl mx-auto px-6 relative z-10 w-full ${banners.length > 0 ? 'mt-[28vh]' : 'pt-8'} pb-16`}>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                            <img src="t3d 2.png" alt="Logo T3 OOH" className="h-8 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,94,0,0.5)]" /> Catálogo de Telões
                        </h1>
                        <p className="text-[#8F8F91] mt-2 font-medium">Escolha os melhores pontos para sua campanha e solicite um orçamento oficial.</p>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="relative bg-[#111113]/80 backdrop-blur-md border border-[#FF5E00]/40 px-6 py-3.5 rounded-xl text-white font-bold hover:border-[#FF5E00] hover:bg-[#FF5E00] hover:text-black transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,94,0,0.2)]">
                        <ShoppingCart className="w-5 h-5" /> Ver Pedido Comercial
                        {cart.length > 0 && <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#25D366] text-[#0A0A0B] text-xs font-black rounded-full flex items-center justify-center shadow-lg">{cart.length}</span>}
                    </button>
                </div>

                <div className="bg-[#111113]/60 backdrop-blur-2xl p-6 rounded-[32px] mb-10 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-20 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-[#8F8F91] group-focus-within:text-[#FF5E00] transition-colors" /></div>
                        <input type="text" placeholder="Buscar por avenida, região ou nome do painel..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-12 pr-4 py-4 bg-[#0A0A0B] border border-white/10 rounded-xl text-white placeholder:text-[#8F8F91] focus:outline-none focus:border-[#FF5E00]/50 focus:ring-1 focus:ring-[#FF5E00]/50 transition-all font-medium text-sm shadow-inner" autoComplete="off" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 md:w-5/12">
                        <div className="w-full relative z-30"><CustomSelect options={stateOptions} value={selectedState} onChange={(val: string) => { setSelectedState(val); setSelectedCity(''); }} placeholder="Filtrar por Estado" icon={<Filter className="w-4 h-4" />} /></div>
                        <div className={`w-full relative z-20 ${!selectedState && cityOptions.length === 1 ? 'opacity-40 pointer-events-none' : ''}`}><CustomSelect options={cityOptions} value={selectedCity} onChange={(val: string) => setSelectedCity(val)} placeholder="Filtrar por Cidade" icon={<MapPin className="w-4 h-4" />} /></div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 relative z-10"><Loader2 className="w-10 h-10 text-[#FF5E00] animate-spin mb-4" /><p className="text-[#8F8F91] uppercase tracking-widest text-xs font-bold">Carregando catálogo...</p></div>
                ) : filteredPanels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-[#111113]/50 backdrop-blur-xl rounded-[32px] border border-white/10 relative z-10"><LayoutGrid className="w-16 h-16 text-white/10 mb-4" /><h3 className="text-lg font-bold text-white mb-2">Nenhum painel encontrado</h3><p className="text-sm text-[#8F8F91] text-center max-w-md">Não encontramos resultados para a sua busca atual. Tente limpar os filtros.</p></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
                        {filteredPanels.map(renderCard)}
                    </div>
                )}
            </div>

            {/* MOBILE LAYOUT */}
            <div className="lg:hidden flex flex-col w-full relative z-10 flex-1">
                
                {/* Spacer para o Banner (empurra o conteúdo para baixo do banner) */}
                {banners.length > 0 ? (
                    <div className="w-full h-[50vh] shrink-0 pointer-events-none" />
                ) : (
                    <div className="w-full h-[72px] shrink-0 pointer-events-none" />
                )}

                {/* Search Header STICKY (Rola com a página e gruda no topo) */}
                <div className="sticky top-[72px] z-40 bg-[#0A0A0B]/95 backdrop-blur-xl border-t border-b border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col pt-4 pb-5 px-4 gap-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-md">
                            <MonitorPlay className="w-5 h-5 text-[#FF5E00]" /> Painéis
                        </h1>
                        <button onClick={() => setIsSidebarOpen(true)} className="relative p-2.5 bg-[#111113] border border-white/10 rounded-full text-white shadow-md active:scale-95 transition-transform">
                            <ShoppingCart className="w-5 h-5" />
                            {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#25D366] text-[#0A0A0B] text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0A0A0B]">{cart.length}</span>}
                        </button>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8F8F91] group-focus-within:text-[#FF5E00] transition-colors z-10" />
                        <input type="text" placeholder="Buscar por avenida ou região..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-11 h-12 w-full text-sm bg-[#111113] border border-white/10 rounded-xl focus:border-[#FF5E00]/50 focus:outline-none focus:ring-1 focus:ring-[#FF5E00]/50 transition-colors shadow-inner text-white" autoComplete="off" />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[#8F8F91] hover:text-white"><X className="w-4 h-4" /></button>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="w-full"><CustomSelect options={stateOptions} value={selectedState} onChange={(val: string) => { setSelectedState(val); setSelectedCity(''); }} placeholder="Estado" icon={<Filter className="w-3.5 h-3.5" />} /></div>
                        <div className={`w-full ${!selectedState && cityOptions.length === 1 ? 'opacity-40 pointer-events-none' : ''}`}><CustomSelect options={cityOptions} value={selectedCity} onChange={(val: string) => setSelectedCity(val)} placeholder="Cidade" icon={<MapPin className="w-3.5 h-3.5" />} /></div>
                    </div>
                </div>

                {/* Lista de Painéis Mobile */}
                <div className="px-4 flex flex-col gap-6 pb-[120px] pt-6 bg-[#0A0A0B]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#FF5E00] animate-spin mb-4" /><p className="text-[#8F8F91] uppercase tracking-widest text-xs font-bold">Carregando...</p></div>
                    ) : filteredPanels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-[#111113]/50 backdrop-blur-md rounded-[32px] border border-white/10 mt-4"><Search className="w-12 h-12 text-white/10 mb-4" /><h3 className="text-base font-bold text-white mb-2">Sem resultados</h3><p className="text-xs text-[#8F8F91] text-center px-4">Modifique sua busca ou filtros para encontrar painéis disponíveis.</p></div>
                    ) : (
                        filteredPanels.map(renderCard)
                    )}
                </div>

                {/* Bottom Navigation Mobile */}
                <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-2xl border-t border-white/5 z-[100] px-6 py-3 flex justify-between items-center pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
                    <Link to="/" className="flex flex-col items-center gap-1 text-[#8F8F91] hover:text-white transition-colors"><Compass className="w-5 h-5" /><span className="text-[9px] font-medium">Explorar</span></Link>
                    <Link to="/mapa" className="flex flex-col items-center gap-1 text-[#8F8F91] hover:text-white transition-colors"><MapPin className="w-5 h-5" /><span className="text-[9px] font-medium">Mapa</span></Link>
                    <Link to="/servicos" className="flex flex-col items-center gap-1 text-[#FF5E00]"><MonitorPlay className="w-5 h-5" /><span className="text-[9px] font-bold">Painéis</span></Link>
                    <Link to="/contato" className="flex flex-col items-center gap-1 text-[#8F8F91] hover:text-white transition-colors"><Shield className="w-5 h-5" /><span className="text-[9px] font-medium">Contato</span></Link>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MODAL CINEMATOGRÁFICO DE DETALHES DO PAINEL               */}
            {/* ========================================================= */}
            <AnimatePresence>
                {selectedPanel && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 lg:p-8"
                    >
                        <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedPanel(null)} />

                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.95, y: 20 }} 
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-[1200px] bg-[#0A0A0B] border border-white/10 rounded-[24px] md:rounded-[32px] overflow-hidden flex flex-col relative shadow-[0_30px_80px_rgba(0,0,0,0.8)] z-10 max-h-[95vh] md:max-h-[90vh]"
                        >
                            <button onClick={() => setSelectedPanel(null)} className="absolute top-4 md:top-6 right-4 md:right-6 z-50 w-11 h-11 bg-black/50 hover:bg-[#111113] border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all backdrop-blur-md">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="overflow-y-auto custom-scrollbar flex flex-col h-full w-full">
                                
                                {/* Hero Banner Gigante */}
                                <div className="relative w-full h-[35vh] min-h-[250px] md:min-h-[350px] shrink-0">
                                    <img src={selectedPanel.images?.[0] || '/placeholder.jpg'} alt={selectedPanel.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/60 to-transparent" />
                                    
                                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex flex-col gap-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                                                <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" /> Disponível
                                            </span>
                                            <span className="text-white/80 drop-shadow-md text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-[#FF5E00]" /> {selectedPanel.city} - {selectedPanel.state}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-xl max-w-4xl">
                                            {selectedPanel.name}
                                        </h2>
                                    </div>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 p-6 md:p-10 shrink-0">
                                    
                                    {/* Lado Esquerdo: Ficha Técnica */}
                                    <div className="flex-1 flex flex-col gap-10">
                                        <div>
                                            <h3 className="text-xs font-bold text-[#8F8F91] uppercase tracking-widest flex items-center gap-2 mb-4">
                                                <Activity className="w-4 h-4 text-[#FF5E00]" /> Ficha Técnica do Painel
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-[#111113] p-4 rounded-[20px] border border-white/5 shadow-md flex flex-col justify-center items-center text-center gap-1">
                                                    <span className="text-[10px] text-[#8F8F91] uppercase tracking-widest font-bold">Impactos/Dia</span>
                                                    <span className="text-base font-black text-white flex items-center gap-1"><Zap className="w-4 h-4 text-[#FF5E00] fill-[#FF5E00]"/> {formatImpacts(selectedPanel.impacts || 0)}</span>
                                                </div>
                                                <div className="bg-[#111113] p-4 rounded-[20px] border border-white/5 shadow-md flex flex-col justify-center items-center text-center gap-1">
                                                    <span className="text-[10px] text-[#8F8F91] uppercase tracking-widest font-bold">Tamanho</span>
                                                    <span className="text-base font-black text-white">{selectedPanel.size || 'N/A'}</span>
                                                </div>
                                                <div className="bg-[#111113] p-4 rounded-[20px] border border-white/5 shadow-md flex flex-col justify-center items-center text-center gap-1">
                                                    <span className="text-[10px] text-[#8F8F91] uppercase tracking-widest font-bold">Resolução</span>
                                                    <span className="text-base font-black text-white">{selectedPanel.px || 'Alta'}</span>
                                                </div>
                                                <div className="bg-[#111113] p-4 rounded-[20px] border border-white/5 shadow-md flex flex-col justify-center items-center text-center gap-1">
                                                    <span className="text-[10px] text-[#8F8F91] uppercase tracking-widest font-bold">Operação</span>
                                                    <span className="text-sm font-black text-white">06h às 00h</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="flex flex-col gap-3">
                                                <h3 className="text-xs font-bold text-[#8F8F91] uppercase tracking-widest flex items-center gap-2">
                                                    <Info className="w-4 h-4 text-[#FF5E00]" /> Visão Geral
                                                </h3>
                                                <p className="text-sm text-white/80 leading-relaxed text-justify">
                                                    {(selectedPanel as any).description || 'Painel digital de alta resolução posicionado em via estratégica com elevado fluxo diário de veículos. Excelente índice de retenção, garantindo forte impacto visual na região.'}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <h3 className="text-xs font-bold text-[#8F8F91] uppercase tracking-widest flex items-center gap-2">
                                                    <Navigation className="w-4 h-4 text-[#FF5E00]" /> Localização Exata
                                                </h3>
                                                <div className="bg-[#111113] p-4 rounded-[20px] border border-white/5 flex items-start gap-3 h-full">
                                                    <MapPin className="w-5 h-5 text-[#8F8F91] shrink-0 mt-0.5" />
                                                    <p className="text-sm font-medium text-white">
                                                        {(selectedPanel as any).address || `${selectedPanel.name}, ${selectedPanel.city} - ${selectedPanel.state}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-white/5 pt-8 pb-4">
                                            <div className="flex flex-wrap items-center gap-6 opacity-60">
                                                <div className="flex items-center gap-2 text-xs text-white font-medium uppercase tracking-widest"><ShieldCheck className="w-4 h-4 text-[#FF5E00]" /> Qualidade T3 OOH</div>
                                                <div className="flex items-center gap-2 text-xs text-white font-medium uppercase tracking-widest"><MonitorPlay className="w-4 h-4 text-[#FF5E00]" /> 15s de Inserção</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lado Direito: Mapa e Preço */}
                                    <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6">
                                        <div className="lg:sticky lg:top-0 flex flex-col gap-6 pb-6">
                                            
                                            <div className="w-full h-56 md:h-64 rounded-[24px] bg-[#111113] border border-white/10 overflow-hidden shadow-lg relative group">
                                                <MapContainer key={`modal-map-${selectedPanel.id}`} center={[Number(selectedPanel.lat) || -16.6869, Number(selectedPanel.lng) || -49.2648]} zoom={16} className="w-full h-full outline-none" zoomControl={false} dragging={false} scrollWheelZoom={false}>
                                                    <MapFixer />
                                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                                    {(selectedPanel.lat && selectedPanel.lng) ? (<Marker position={[Number(selectedPanel.lat), Number(selectedPanel.lng)]} icon={expandedMarker} />) : null}
                                                </MapContainer>
                                                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[24px] pointer-events-none z-10" />
                                            </div>

                                            <div className="bg-[#111113] border border-white/5 p-6 rounded-[24px] shadow-2xl flex flex-col gap-6 relative overflow-hidden">
                                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#25D366]/10 blur-3xl rounded-full pointer-events-none" />

                                                <div className="flex items-center justify-between border border-[#25D366]/40 bg-[#0A0A0B] rounded-xl p-4 shadow-sm relative z-10 gap-2">
                                                    <div className="flex flex-col gap-2 min-w-0 pr-1">
                                                        <span className="text-[11px] font-bold text-[#25D366] uppercase tracking-wider leading-none truncate">Investimento Anual</span>
                                                        <span className="bg-[#25D366]/10 text-[#25D366] text-[10px] font-black px-2 py-1 rounded-md border border-[#25D366]/30 w-fit leading-none whitespace-nowrap">-30% OFF</span>
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <span className="text-xs text-[#8F8F91] line-through mb-1 leading-none whitespace-nowrap">{formatCurrency(Number(selectedPanel.price) || 0)}</span>
                                                        <span className="text-2xl font-black text-[#25D366] tracking-tight leading-none whitespace-nowrap">{formatCurrency((Number(selectedPanel.price) || 0) * 0.70)}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => toggleInCart(selectedPanel)}
                                                    className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 relative z-10 ${
                                                        isInCart(selectedPanel.id) 
                                                        ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20' 
                                                        : 'bg-[#FF5E00] text-[#0A0A0B] hover:brightness-110 shadow-[0_0_20px_rgba(255,94,0,0.3)]'
                                                    }`}
                                                >
                                                    {isInCart(selectedPanel.id) ? <><X className="w-5 h-5" /> Remover do Orçamento</> : <><ShoppingCart className="w-5 h-5" /> Adicionar ao Orçamento</>}
                                                </button>
                                            </div>
                                            
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL DO CARRINHO LATERAL (CRM WHATSAPP) */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99990]" />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 h-[100dvh] w-full md:w-[480px] bg-[#0A0A0B] border-l border-white/10 z-[99999] flex flex-col shadow-2xl">
                            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#111113] shrink-0 pt-[env(safe-area-inset-top,20px)] z-20 relative"><h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-3">{checkoutStep === 'cart' ? (<><ShoppingCart className="w-5 h-5 text-[#FF5E00]" /> Resumo do Pedido</>) : (<><Send className="w-5 h-5 text-[#25D366]" /> Orçamento Whatsapp</>)}</h2><button onClick={() => setIsSidebarOpen(false)} className="text-[#8F8F91] hover:text-white bg-[#0A0A0B] p-2 rounded-full border border-white/5"><X className="w-5 h-5" /></button></div>
                            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar relative z-10">
                                {checkoutStep === 'cart' ? (
                                    cart.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-60"><ShoppingCart className="w-12 h-12 text-[#8F8F91] mb-4" /><p className="text-sm text-[#8F8F91]">Seu carrinho de orçamentos está vazio.</p></div>) : (
                                        <div className="flex flex-col gap-4 pb-4">
                                            {cart.map((p, i) => (
                                                <div key={p.id} className="flex gap-4 p-4 bg-[#111113] border border-white/5 rounded-xl relative shadow-md"><div className="w-5 h-5 absolute -top-2 -left-2 bg-[#FF5E00] text-black font-bold text-[10px] rounded-full flex items-center justify-center shadow-md z-10">{i + 1}</div><img src={p.images?.[0] || '/placeholder.jpg'} alt={p.name} className="w-16 h-16 rounded-lg object-cover bg-black" /><div className="flex-1 min-w-0 flex flex-col justify-center"><h4 className="text-sm font-bold text-white leading-tight mb-1 truncate pr-2" title={p.name}>{p.name}</h4><p className="text-xs text-[#8F8F91] mb-3 truncate"><MapPin className="w-3 h-3 inline-block -mt-0.5" /> <span className="truncate">{p.city}</span></p><div className="flex justify-between items-center"><span className="text-sm font-bold text-[#25D366]">{formatCurrency(Number(p.price))}</span><button onClick={() => toggleInCart(p)} className="text-[9px] text-[#8F8F91] border border-white/10 hover:border-red-400 font-bold uppercase tracking-wider hover:text-red-400 bg-[#0A0A0B] px-3 py-1.5 rounded-md transition-colors whitespace-nowrap">Remover</button></div></div></div>
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    <form onSubmit={handleWhatsAppSubmit} className="flex flex-col gap-6 animate-fade-in pb-4">
                                        <div className="bg-[#111113] rounded-[16px] p-5 border border-white/5"><div className="flex justify-between items-center mb-4"><span className="text-[10px] text-[#8F8F91] font-bold uppercase tracking-widest flex items-center gap-2"><LayoutGrid className="w-3.5 h-3.5" /> Painéis no Carrinho</span><span className="bg-white/10 text-white text-xs font-bold px-2 py-0.5 rounded">{cart.length} unid</span></div><div className="border-t border-white/5 my-4" /><div className="flex justify-between items-start"><div className="flex flex-col"><span className="text-[9px] text-[#FF5E00] font-bold uppercase tracking-widest mb-1">Alcance Total (Diário)</span><span className="text-xl font-black text-[#FF5E00]">{formatImpacts(totalCartImpacts)}</span></div><div className="flex flex-col items-end text-right">{totalEconomy > 0 && <span className="text-[10px] text-[#8F8F91] font-medium line-through mb-0.5">{formatCurrency(totalWithoutAnyDiscount)}</span>}<span className="text-[9px] text-[#25D366] font-bold uppercase tracking-widest mb-1">Investimento Total</span><span className="text-xl font-black text-[#25D366] leading-none mb-1.5">{formatCurrency(finalTotalValue)}</span>{totalEconomy > 0 && <span className="text-[9px] font-black text-[#25D366] bg-[#25D366]/10 px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">Economia: {formatCurrency(totalEconomy)}</span>}</div></div></div>
                                        <div className="flex flex-col gap-4"><h3 className="text-[10px] font-bold text-[#8F8F91] uppercase tracking-widest">Seus Dados</h3><div className="flex flex-col gap-1"><label className="text-xs text-[#8F8F91]">Nome Completo *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-[#111113] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-[#FF5E00] outline-none" /></div><div className="grid grid-cols-2 gap-4"><div className="flex flex-col gap-1"><label className="text-xs text-[#8F8F91]">E-mail *</label><input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-[#111113] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-[#FF5E00] outline-none" /></div><div className="flex flex-col gap-1"><label className="text-xs text-[#8F8F91]">WhatsApp *</label><input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-[#111113] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-[#FF5E00] outline-none" /></div></div><div className="flex flex-col gap-1"><label className="text-xs text-[#8F8F91]">Empresa / Agência</label><input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="bg-[#111113] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-[#FF5E00] outline-none" /></div><div className="flex flex-col gap-1"><label className="text-xs text-[#8F8F91]">Observações</label><textarea rows={3} placeholder="Mencione condições de pagamento, datas da campanha, etc." value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="bg-[#111113] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-[#FF5E00] outline-none resize-none" /></div></div>
                                    </form>
                                )}
                            </div>
                            {checkoutStep === 'cart' ? (
                                <div className="bg-[#0A0A0B] p-5 lg:p-6 border-t border-white/5 shrink-0 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20 relative"><div className="flex flex-col w-full mb-4"><div className="flex flex-col gap-3 border-b border-white/5 pb-4 mb-4"><div className="grid grid-cols-2 gap-3 items-end"><div className="flex flex-col gap-1.5 relative z-50"><label className="text-[9px] text-[#8F8F91] uppercase tracking-widest font-bold">Duração (Descontos)</label><CustomSelect options={monthOptions} value={String(months)} onChange={(val: string) => setMonths(Number(val))} placeholder="Duração" icon={<CalendarDays className="w-4 h-4" />} /></div><div className="flex flex-col gap-1.5 h-full"><label className="text-[9px] text-[#8F8F91] uppercase tracking-widest font-bold">Cupom Promocional</label><div className="flex gap-2"><input type="text" placeholder="CUPOM" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} className="w-full bg-[#111113] border border-white/10 rounded-xl px-3 text-white text-xs font-bold focus:border-[#FF5E00] outline-none uppercase placeholder:normal-case placeholder:font-normal h-[42px]" disabled={appliedCoupon !== null} />{appliedCoupon ? (<Button onClick={() => { setAppliedCoupon(null); setCouponInput(''); }} variant="secondary" className="px-3 h-[42px] text-red-500 border-white/5 bg-[#111113] hover:bg-red-500/10 flex items-center justify-center"><X className="w-4 h-4" /></Button>) : (<Button onClick={handleApplyCoupon} className="px-3 h-[42px] bg-[#111113] border-white/5 text-white hover:bg-[#FF5E00] hover:text-[#0A0A0B] text-xs transition-colors flex items-center justify-center"><Tag className="w-4 h-4" /></Button>)}</div></div></div>{termDiscountPercent > 0 && <p className="text-[10px] text-[#25D366] mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Desconto de <b>{termDiscountPercent * 100}%</b> pelo prazo aplicado!</p>}{appliedCoupon && <p className="text-[10px] text-[#25D366] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Cupom <b>{appliedCoupon.code}</b> aplicado!</p>}</div><div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4"><p className="text-[10px] font-bold text-[#8F8F91] uppercase tracking-widest">Impacto Total</p><p className="text-xl font-black text-[#FF5E00]">{formatImpacts(totalCartImpacts || 0)}</p></div><div className="flex items-center justify-between"><div className="flex flex-col"><span className="text-[10px] font-bold text-[#8F8F91] uppercase tracking-widest mb-1">Investimento Mensal</span>{totalEconomy > 0 && <span className="text-[10px] text-[#8F8F91] font-medium line-through mb-0.5">{formatCurrency(baseMonthly)}/mês</span>}<span className="text-2xl font-black text-[#25D366] leading-none">{formatCurrency(finalMonthlyValue)}</span><span className="text-[10px] text-[#8F8F91] mt-1.5 font-medium whitespace-nowrap">Total Campanha ({months}x): {formatCurrency(finalTotalValue)}</span></div></div></div><Button disabled={cart.length === 0 || isSubmitting} onClick={() => setCheckoutStep('crm')} isLoading={isSubmitting} className="w-full bg-[#FF5E00] text-[#0A0A0B] hover:brightness-110 font-black py-4 rounded-xl shadow-[0_0_20px_rgba(255,94,0,0.3)] border-none uppercase tracking-widest text-sm flex items-center justify-center">Avançar</Button></div>
                            ) : (
                                <div className="bg-[#0A0A0B] p-5 lg:p-6 border-t border-white/5 shrink-0 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex flex-col gap-3 z-20 relative"><button onClick={() => setCheckoutStep('cart')} className="w-full py-2 text-xs font-bold text-[#8F8F91] hover:text-white uppercase tracking-widest transition-colors">Voltar para Resumo</button><Button onClick={handleWhatsAppSubmit} disabled={isSubmitting || !formData.name || !formData.email || !formData.phone} className="w-full bg-[#25D366] hover:brightness-110 text-[#0A0A0B] font-black py-4 rounded-xl shadow-[0_0_20px_rgba(37,211,102,0.3)] border-none uppercase tracking-widest text-[13px] flex items-center justify-center gap-2">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Enviar via WhatsApp</Button></div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}