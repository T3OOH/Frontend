import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
    MapPin, ShoppingCart, X,  Loader2, MessageCircle, Activity, 
    LayoutGrid, Search, Filter, Zap, Compass, Shield, MonitorPlay,
    Send, Tag, CheckCircle2, Ticket, CalendarDays, Heart // <-- Heart importado aqui
} from 'lucide-react';

import { panelsService } from '@/services/panels.service';
import { useCart, Panel } from '@/contexts/CartContext';
import { CustomSelect } from '@/components/CustomSelect';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useToast } from '@/contexts/ToastContext';

// Marcador expandido com o design da marca T3
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

export function Services() {
    const { cart, toggleInCart, isInCart, clearCart } = useCart();
    const { addToast } = useToast();

    const [panels, setPanels] = useState<Panel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    
    // Estado de Favoritos
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    
    // Estados do Modal e Sidebar
    const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Estados do Checkout
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'crm'>('cart');
    const [months, setMonths] = useState(1);
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Formulário CRM
    const [formData, setFormData] = useState({ name: '', email: '', whatsapp: '', company: '', notes: '' });

    // ==========================================
    // EFEITO DE BLOQUEIO DE SCROLL (Fundo Congelado)
    // ==========================================
    useEffect(() => {
        if (isSidebarOpen || selectedPanel) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isSidebarOpen, selectedPanel]);

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
                        status: p.status || 'AVAILABLE',
                        impacts: String(p.impacts || '0'),   
                        size: String(p.size || 'Padrão'),    
                        px: String(p.px || 'Alta Resolução'),
                        lat: Number(p.lat) || 0, 
                        lng: Number(p.lng) || 0,
                        price: Number(p.price) || 0
                    })) as Panel[];
                
                setPanels(validPanels);
            } catch (error) {
                console.error("Erro ao carregar serviços:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPanels();
    }, []);

    // Reinicia o carrinho se for fechado
    useEffect(() => {
        if (!isSidebarOpen) {
            setTimeout(() => setCheckoutStep('cart'), 300);
        }
    }, [isSidebarOpen]);

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
            const matchesSearch = panel.name?.toLowerCase().includes(searchTerm.toLowerCase()) || panel.city?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesState = selectedState ? panel.state === selectedState : true;
            const matchesCity = selectedCity ? panel.city === selectedCity : true;
            return matchesSearch && matchesState && matchesCity;
        });
    }, [panels, searchTerm, selectedState, selectedCity]);

    // Opções de Meses para o CustomSelect
    const monthOptions = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            value: String(i + 1),
            label: `${i + 1} ${i === 0 ? 'Mês' : 'Meses'}`
        }));
    }, []);

    // ==========================================
    // CÁLCULOS FINANCEIROS VIVOS
    // ==========================================
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

    // Lógica: Desconto de Volume + Cupom
    const volumeDiscount = cart.length > 1 ? baseMonthly * 0.10 : 0;
    const subtotalMonthly = baseMonthly - volumeDiscount;

    const totalContractValue = subtotalMonthly * months;
    const couponDiscount = appliedCoupon ? totalContractValue * appliedCoupon.discount : 0;
    const finalTotalValue = totalContractValue - couponDiscount;
    const finalMonthlyValue = finalTotalValue / months;

    const totalWithoutAnyDiscount = baseMonthly * months;
    const totalEconomy = totalWithoutAnyDiscount - finalTotalValue;

    // Função de Favoritar
    const toggleFavorite = (e: React.MouseEvent, panelId: string) => {
        e.preventDefault(); 
        e.stopPropagation(); // Evita que o modal de detalhes abra ao curtir
        setFavorites(prev => {
            const next = new Set(prev);
            if (next.has(panelId)) next.delete(panelId);
            else next.add(panelId);
            return next;
        });
    };

    // Ações do Cupom e CRM
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
        // Simulando envio para o CRM
        await new Promise(r => setTimeout(r, 1500));
        addToast('Pedido enviado com sucesso! Nosso comercial entrará em contato em breve.', 'success');
        clearCart();
        setIsSidebarOpen(false);
        setIsSubmitting(false);
        setCheckoutStep('cart');
    };

    // Componente de Card Padronizado
    const renderCard = (panel: Panel) => {
        const inCart = isInCart(panel.id);
        const isFavorite = favorites.has(panel.id); // Verifica se é favorito

        return (
            <motion.div 
                key={panel.id} 
                onClick={() => setSelectedPanel(panel)}
                whileHover={{ y: -5 }}
                className={`bg-[#111113] rounded-[20px] overflow-hidden border transition-all shadow-xl flex flex-col cursor-pointer ${
                    inCart ? 'border-[#FF5E00] shadow-[0_0_20px_rgba(255,94,0,0.15)] bg-[#FF5E00]/5' : 'border-white/5 hover:border-[#FF5E00]/40'
                }`}
            >
                <div className="h-48 relative bg-black shrink-0 w-full">
                    <img src={panel.images?.[0] || '/placeholder.jpg'} alt={panel.name} className="w-full h-full object-cover opacity-90" />
                    
                    {/* BOTÃO DE CORAÇÃO ADICIONADO AQUI */}
                    <button 
                        onClick={(e) => toggleFavorite(e, panel.id)}
                        className="absolute top-3 right-3 bg-[#0A0A0B]/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 z-10 hover:scale-110 transition-transform"
                    >
                        <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-brand-neon text-brand-neon' : 'text-white'}`} />
                    </button>
                </div>

                <div className="p-4 flex flex-col flex-1 bg-[#111113]">
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-white line-clamp-2 leading-tight mb-1">{panel.name}</h3>
                        <p className="text-[11px] text-brand-muted flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#FF5E00]" /> {panel.city} - {panel.state}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 mt-auto">
                        <div className="border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center bg-[#0A0A0B]">
                            <span className="text-[9px] text-brand-muted uppercase font-bold tracking-widest mb-1">FORMATO</span>
                            <span className="text-sm font-bold text-white">{panel.size}</span>
                        </div>
                        <div className="border border-[#FF5E00]/20 rounded-xl p-3 flex flex-col items-center justify-center bg-[#FF5E00]/5">
                            <span className="text-[9px] text-[#FF5E00] uppercase font-bold tracking-widest mb-1">IMPACTO/DIA</span>
                            <span className="text-sm font-bold text-[#FF5E00] flex items-center gap-1">
                                <Zap className="w-4 h-4 fill-[#FF5E00]" /> {formatImpacts(panel.impacts)}
                            </span>
                        </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between border border-[#25D366]/30 bg-[#25D366]/5 rounded-xl p-3.5">
                        <span className="text-[10px] font-bold text-[#25D366] uppercase tracking-wider">INVESTIMENTO</span>
                        <span className="text-base font-black text-[#25D366]">{formatCurrency(Number(panel.price) || 0)}</span>
                    </div>

                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleInCart(panel); }} 
                        className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                            inCart 
                            ? 'bg-[#0A0A0B] text-red-500 border border-red-500/30 hover:bg-red-500/10' 
                            : 'bg-[#0A0A0B] text-white border border-white/10 hover:border-[#FF5E00] hover:text-[#FF5E00]'
                        }`}
                    >
                        {inCart ? (
                            <><X className="w-4 h-4" /> REMOVER</>
                        ) : (
                            <><ShoppingCart className="w-4 h-4" /> ADICIONAR</>
                        )}
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="relative w-full min-h-screen bg-[#0A0A0B] flex flex-col pt-[64px] md:pt-[80px]">
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

            {/* ========================================================= */}
            {/* DESKTOP LAYOUT                                            */}
            {/* ========================================================= */}
            <div className="hidden lg:block max-w-7xl mx-auto px-6 relative z-10 w-full pt-10 pb-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                            <img src="t3d 2.png" alt="Logo T3 OOH" className="h-8 w-auto object-contain" /> Catálogo de Telões
                        </h1>
                        <p className="text-brand-muted mt-2">Escolha os melhores pontos para sua campanha e solicite um orçamento oficial.</p>
                    </div>

                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="relative bg-[#111113] border border-brand-border/50 px-5 py-3 rounded-xl text-white font-bold hover:border-brand-neon hover:text-brand-neon transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                    >
                        <ShoppingCart className="w-5 h-5" /> Ver Pedido
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-brand-neon text-black text-xs font-black rounded-full flex items-center justify-center animate-bounce shadow-[0_0_10px_rgba(255,94,0,0.6)]">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>

                <div className="glass-panel p-4 rounded-2xl mb-10 flex flex-col md:flex-row gap-4 border border-brand-border/40 shadow-lg relative z-20 bg-[#111113]/80 backdrop-blur-xl">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted z-10" />
                        <Input
                            type="text"
                            placeholder="Buscar por avenida, localização..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 md:w-2/5">
                        <div className="w-full relative z-30">
                            <CustomSelect
                                options={stateOptions}
                                value={selectedState}
                                onChange={(val) => { setSelectedState(val); setSelectedCity(''); }}
                                placeholder="Todos os Estados"
                                icon={<Filter className="w-4 h-4" />}
                            />
                        </div>
                        <div className={`w-full relative z-20 ${!selectedState && cityOptions.length === 1 ? 'opacity-40 pointer-events-none' : ''}`}>
                            <CustomSelect
                                options={cityOptions}
                                value={selectedCity}
                                onChange={(val) => setSelectedCity(val)}
                                placeholder="Todas as Cidades"
                                icon={<MapPin className="w-4 h-4" />}
                            />
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 relative z-10">
                        <Loader2 className="w-10 h-10 text-brand-neon animate-spin mb-4" />
                        <p className="text-brand-muted uppercase tracking-widest text-xs font-bold">Carregando catálogo...</p>
                    </div>
                ) : filteredPanels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-brand-surface/20 rounded-3xl border border-brand-border/30 relative z-10">
                        <LayoutGrid className="w-16 h-16 text-brand-border mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Nenhum painel encontrado</h3>
                        <p className="text-sm text-brand-muted text-center max-w-md">Não encontramos resultados para a sua busca atual. Tente limpar os filtros.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
                        {filteredPanels.map(renderCard)}
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* MOBILE LAYOUT                                             */}
            {/* ========================================================= */}
            <div className="lg:hidden flex flex-col w-full relative z-10 flex-1">
                <div className="fixed top-[64px] left-0 right-0 z-40 bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-brand-border/20 shadow-md flex flex-col pt-3 pb-4 px-4 gap-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <MonitorPlay className="w-5 h-5 text-brand-neon" /> Painéis
                        </h1>
                        <button 
                            onClick={() => setIsSidebarOpen(true)} 
                            className="relative p-2.5 bg-[#111113] border border-brand-border/40 rounded-full text-white shadow-md active:scale-95 transition-transform"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {cart.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-neon text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0A0A0B]">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted z-10" />
                        <Input
                            type="text"
                            placeholder="Buscar por avenida ou região..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 h-12 text-sm bg-[#111113] border-brand-border/30 rounded-2xl focus:border-brand-neon transition-colors shadow-inner w-full"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-brand-muted hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="w-full">
                            <CustomSelect
                                options={stateOptions}
                                value={selectedState}
                                onChange={(val) => { setSelectedState(val); setSelectedCity(''); }}
                                placeholder="Estado"
                                icon={<Filter className="w-3.5 h-3.5" />}
                            />
                        </div>
                        <div className={`w-full ${!selectedState && cityOptions.length === 1 ? 'opacity-40 pointer-events-none' : ''}`}>
                            <CustomSelect
                                options={cityOptions}
                                value={selectedCity}
                                onChange={(val) => setSelectedCity(val)}
                                placeholder="Cidade"
                                icon={<MapPin className="w-3.5 h-3.5" />}
                            />
                        </div>
                    </div>
                </div>

                <div className="px-4 pt-[210px] pb-[100px] flex flex-col gap-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-4" />
                            <p className="text-brand-muted uppercase tracking-widest text-xs font-bold">Carregando...</p>
                        </div>
                    ) : filteredPanels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-[#111113]/50 rounded-3xl border border-brand-border/20 mt-4">
                            <Search className="w-12 h-12 text-brand-border mb-4" />
                            <h3 className="text-base font-bold text-white mb-2">Sem resultados</h3>
                            <p className="text-xs text-brand-muted text-center px-4">Modifique sua busca ou filtros para encontrar painéis disponíveis.</p>
                        </div>
                    ) : (
                        filteredPanels.map(renderCard)
                    )}
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-2xl border-t border-brand-border/20 z-[100] px-6 py-3 flex justify-between items-center pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
                    <Link to="/" className="flex flex-col items-center gap-1 text-brand-muted hover:text-white transition-colors">
                        <Compass className="w-5 h-5" />
                        <span className="text-[9px] font-medium">Explorar</span>
                    </Link>
                    <Link to="/mapa" className="flex flex-col items-center gap-1 text-brand-muted hover:text-white transition-colors">
                        <MapPin className="w-5 h-5" />
                        <span className="text-[9px] font-medium">Mapa</span>
                    </Link>
                    <Link to="/servicos" className="flex flex-col items-center gap-1 text-brand-neon">
                        <MonitorPlay className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Painéis</span>
                    </Link>
                    <Link to="/contato" className="flex flex-col items-center gap-1 text-brand-muted hover:text-white transition-colors">
                        <Shield className="w-5 h-5" />
                        <span className="text-[9px] font-medium">Contato</span>
                    </Link>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MODAL EXPANDIDO DE DETALHES DO PAINEL                       */}
            {/* ========================================================= */}
            <AnimatePresence>
                {selectedPanel && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[99990] bg-black/95 backdrop-blur-md flex items-center justify-center p-0 md:p-6 lg:p-10">
                        
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full h-full md:h-[85vh] md:max-h-[850px] md:max-w-6xl bg-[#111113] md:rounded-3xl flex flex-col md:flex-row relative overflow-hidden shadow-2xl border border-white/5">
                            
                            <button 
                                onClick={() => setSelectedPanel(null)} 
                                className="absolute top-4 right-4 z-[99999] w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 border border-white/20 shadow-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="hidden md:block flex-1 h-full bg-black relative">
                                <MapContainer key={`desktop-map-${selectedPanel.id}`} center={[selectedPanel.lat || -16.6869, selectedPanel.lng || -49.2648]} zoom={16} className="w-full h-full outline-none" zoomControl={false}>
                                    <MapFixer />
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                    {(selectedPanel.lat && selectedPanel.lng) ? (
                                        <Marker position={[selectedPanel.lat, selectedPanel.lng]} icon={expandedMarker} />
                                    ) : null}
                                </MapContainer>
                                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#111113] to-transparent z-[400] pointer-events-none" />
                            </div>

                            <div className="w-full md:w-[450px] lg:w-[500px] flex flex-col h-full bg-[#111113] relative z-10 shrink-0 border-l border-white/5">
                                
                                <div className="w-full h-[35vh] md:h-72 relative shrink-0">
                                    <img src={selectedPanel.images?.[0] || '/placeholder.jpg'} alt={selectedPanel.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-[#111113]/40 to-transparent" />
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col relative z-10 -mt-10 custom-scrollbar">
                                    <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 pr-12">{selectedPanel.name}</h2>
                                    <p className="text-sm text-brand-muted flex items-center gap-1.5 mb-8">
                                        <MapPin className="w-4 h-4 text-[#FF5E00]" /> {selectedPanel.city} - {selectedPanel.state}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-[#1A110D] border border-[#FF5E00]/20 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden shadow-inner">
                                            <span className="text-[10px] text-[#FF5E00] uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> ALCANCE DIÁRIO</span>
                                            <span className="text-2xl font-black text-[#FF5E00]">{formatImpacts(selectedPanel.impacts || 0)}</span>
                                            <Zap className="w-16 h-16 text-[#FF5E00] absolute -right-4 -bottom-4 opacity-10" />
                                        </div>
                                        <div className="bg-[#0D1A11] border border-[#25D366]/20 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden shadow-inner">
                                            <span className="text-[10px] text-[#25D366] uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> INVESTIMENTO</span>
                                            <span className="text-xl lg:text-2xl font-black text-[#25D366]">{formatCurrency(Number(selectedPanel.price) || 0)}</span>
                                            <Activity className="w-16 h-16 text-[#25D366] absolute -right-4 -bottom-4 opacity-10" />
                                        </div>
                                    </div>
                                    
                                    <div className="md:hidden w-full h-48 rounded-2xl overflow-hidden bg-black relative mb-6 border border-white/5">
                                        <MapContainer key={`mobile-map-${selectedPanel.id}`} center={[selectedPanel.lat || -16.6869, selectedPanel.lng || -49.2648]} zoom={15} className="w-full h-full outline-none" zoomControl={false} dragging={false}>
                                            <MapFixer />
                                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                            {(selectedPanel.lat && selectedPanel.lng) ? (
                                                <Marker position={[selectedPanel.lat, selectedPanel.lng]} icon={expandedMarker} />
                                            ) : null}
                                        </MapContainer>
                                    </div>

                                    <div className="h-28 md:h-20 shrink-0"></div>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-5 bg-[#111113] border-t border-white/5 pb-safe z-50">
                                    <button
                                        onClick={() => toggleInCart(selectedPanel)}
                                        className={`w-full font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-sm shadow-lg ${
                                            isInCart(selectedPanel.id) ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-[#FF5E00] text-[#0A0A0B] hover:brightness-110'
                                        }`}
                                    >
                                        {isInCart(selectedPanel.id) ? <><X className="w-5 h-5" /> REMOVER DO ORÇAMENTO</> : <><ShoppingCart className="w-5 h-5" /> ADICIONAR AO ORÇAMENTO</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ========================================================= */}
            {/* SIDEBAR INTELIGENTE (CARRINHO E CRM UNIFICADOS)             */}
            {/* ========================================================= */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                            onClick={() => setIsSidebarOpen(false)} 
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99990]" 
                        />
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
                                <button onClick={() => setIsSidebarOpen(false)} className="text-brand-muted hover:text-white bg-[#0A0A0B] p-2 rounded-full border border-white/5">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* BODY DINÂMICO (Área de Rolagem Restrita) */}
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
                                                    <div className="w-5 h-5 absolute -top-2 -left-2 bg-[#FF5E00] text-[#0A0A0B] font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-[#0A0A0B] z-10">{i + 1}</div>
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
                                    <div className="flex flex-col gap-6 animate-fade-in pb-4">
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
                                                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-[#111113] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-brand-neon outline-none" />
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-brand-muted">E-mail *</label>
                                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-[#111113] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-brand-neon outline-none" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-brand-muted">WhatsApp *</label>
                                                    <input type="text" required value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} className="bg-[#111113] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-brand-neon outline-none" />
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-brand-muted">Empresa / Agência</label>
                                                <input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="bg-[#111113] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-brand-neon outline-none" />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-brand-muted">Observações (Opcional)</label>
                                                <textarea rows={3} placeholder="Mencione condições de pagamento, datas da campanha, etc." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="bg-[#111113] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-brand-neon outline-none resize-none" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* FOOTER DINÂMICO (Área Fixa com Configurações e Totais) */}
                            {checkoutStep === 'cart' ? (
                                <div className="bg-[#0A0A0B] p-5 lg:p-6 border-t border-white/5 shrink-0 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20 relative">
                                    <div className="flex flex-col w-full mb-4">
                                        
                                        {/* Configuração de Campanha */}
                                        <div className="flex flex-col gap-3 border-b border-white/5 pb-4 mb-4">
                                            <div className="grid grid-cols-2 gap-3 items-end">
                                                <div className="flex flex-col gap-1.5 relative z-50">
                                                    <label className="text-[9px] text-brand-muted uppercase tracking-widest font-bold">Duração da Campanha</label>
                                                    <CustomSelect
                                                        options={monthOptions}
                                                        value={String(months)}
                                                        onChange={(val) => setMonths(Number(val))}
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
                                                            <Button onClick={() => { setAppliedCoupon(null); setCouponInput(''); }} variant="secondary" className="px-3 h-[42px] text-red-500 border-red-500/30 hover:bg-red-500/10"><X className="w-4 h-4"/></Button>
                                                        ) : (
                                                            <Button onClick={handleApplyCoupon} className="px-3 h-[42px] bg-white/10 text-white hover:bg-brand-neon hover:text-[#0A0A0B] border-none text-xs transition-colors"><Tag className="w-4 h-4"/></Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {appliedCoupon && <p className="text-[10px] text-[#25D366] mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Cupom <b>{appliedCoupon.code}</b> aplicado!</p>}
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
                                        disabled={cart.length === 0} 
                                        onClick={() => setCheckoutStep('crm')} 
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
                                        disabled={isSubmitting || !formData.name || !formData.email || !formData.whatsapp}
                                        className="w-full bg-[#FF5E00] hover:brightness-110 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(255,94,0,0.3)] border-none uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Ticket className="w-5 h-5" />} 
                                        Gerar Ticket Comercial CRM
                                    </Button>
                                </div>
                            )}

                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}