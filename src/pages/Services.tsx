import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
    MapPin, ShoppingCart, X, Eye, Loader2, MessageCircle, Activity, 
    LayoutGrid, Search, Filter, Zap, Compass, Shield, MonitorPlay, ChevronRight
} from 'lucide-react';

import { panelsService } from '@/services/panels.service';
import { useCart, Panel } from '@/contexts/CartContext';
import { CustomSelect } from '@/components/CustomSelect';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

const customMarker = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: #1C1C1E; border: 2px solid #FF5E00; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(255, 94, 0, 0.5);"><div style="background-color: #FF5E00; width: 8px; height: 8px; border-radius: 50%;"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
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
    const { cart, toggleInCart, isInCart } = useCart();

    const [panels, setPanels] = useState<Panel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);

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

    const handleCheckoutRedirect = () => {
        window.location.href = '/mapa?checkout=true';
    };

    // Lógica de Desconto por Combo
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

    let totalOriginalValue = 0;
    let totalVolumeDiscount = 0;

    cart.forEach((cartItem, index) => {
        const livePanel = panels.find(p => p.id === cartItem.id);
        const price = Number(livePanel ? livePanel.price : cartItem.price) || 0;
        totalOriginalValue += price;
        if (index > 0) {
            totalVolumeDiscount += price * 0.10;
        }
    });

    const finalCartValue = totalOriginalValue - totalVolumeDiscount;

    return (
        <div className="relative w-full min-h-screen bg-[#0A0A0B] flex flex-col pt-[64px] md:pt-[80px]">
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

            {/* ========================================================= */}
            {/* DESKTOP LAYOUT (100% PRESERVADO E PROTEGIDO)                */}
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
                        {filteredPanels.map((panel) => {
                            const inCart = isInCart(panel.id);
                            return (
                                <motion.div
                                    key={panel.id}
                                    whileHover={{ y: -5 }}
                                    className={`bg-[#111113] rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col group ${inCart ? 'border-brand-neon shadow-[0_0_20px_rgba(255,94,0,0.15)] bg-brand-neon/5' : 'border-white/5 hover:border-[#FF5E00]/40'
                                        }`}
                                >
                                    <div className="relative h-48 bg-black overflow-hidden border-b border-white/5">
                                        <img src={panel.images?.[0] || '/placeholder.jpg'} alt={panel.name} className={`w-full h-full object-cover transition-transform duration-500 ${inCart ? '' : 'group-hover:scale-110'}`} />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <Button onClick={() => setSelectedPanel(panel)} className="bg-[#FF5E00] text-white hover:scale-105 border-none">
                                                <Eye className="w-4 h-4 mr-2" /> Ver Detalhes
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="text-base font-bold text-white leading-tight line-clamp-2 mb-1">{panel.name}</h3>
                                        <p className="text-xs text-brand-muted flex items-center gap-1.5 mb-4">
                                            <MapPin className="w-3.5 h-3.5 text-[#FF5E00]" /> {panel.city} - {panel.state}
                                        </p>

                                        <div className="mt-auto grid grid-cols-2 gap-2 mb-3">
                                            <div className="bg-[#0A0A0B] rounded-lg p-2 text-center border border-white/5 shadow-inner flex flex-col justify-center">
                                                <span className="block text-[9px] text-brand-muted uppercase tracking-wider mb-0.5">Formato</span>
                                                <span className="text-xs font-semibold text-white truncate px-1">{panel.size}</span>
                                            </div>
                                            <div className="bg-[#FF5E00]/10 rounded-lg p-2 text-center border border-[#FF5E00]/20 shadow-inner flex flex-col justify-center">
                                                <span className="block text-[9px] text-[#FF5E00]/80 uppercase font-black tracking-wider mb-0.5">Impacto/Dia</span>
                                                <span className="text-xs font-black text-[#FF5E00] flex items-center justify-center gap-1">
                                                    <Zap className="w-3 h-3 fill-[#FF5E00]" /> {formatImpacts(panel.impacts || 0)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mb-4 flex items-center justify-between bg-[#25D366]/5 border border-[#25D366]/20 rounded-lg p-2.5">
                                            <span className="text-[10px] font-bold text-[#25D366] uppercase tracking-wider">Investimento</span>
                                            <span className="text-sm font-black text-[#25D366]">{formatCurrency(Number(panel.price) || 0)}</span>
                                        </div>

                                        <button
                                            onClick={() => toggleInCart(panel)}
                                            className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${inCart ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20' : 'bg-[#0A0A0B] border border-white/10 text-white hover:border-[#FF5E00] hover:text-[#FF5E00] hover:bg-[#FF5E00]/5'
                                                }`}
                                        >
                                            {inCart ? (
                                                <><span className="flex items-center gap-2"><X className="w-4 h-4" /> Remover</span></>
                                            ) : (
                                                <><ShoppingCart className="w-4 h-4" /> Adicionar</>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* MOBILE LAYOUT (LIMPO, SEM GAPS, UX PREMIUM)                 */}
            {/* ========================================================= */}
            <div className="lg:hidden flex flex-col w-full relative z-10 flex-1">
                
                {/* Cabeçalho, Busca e Filtros FIXOS NO TOPO */}
                {/* Garantimos top-[64px] para colar exatamente abaixo do header global e z-40 para sobrepor os cards */}
                <div className="fixed top-[64px] left-0 right-0 z-40 bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-brand-border/20 shadow-md flex flex-col pt-3 pb-4 px-4 gap-3">
                    
                    {/* Linha 1: Título e Carrinho */}
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

                    {/* Linha 2: Busca */}
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

                    {/* Linha 3: Filtros */}
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

                {/* Lista de Painéis - O pt-[210px] compensa exatamente a altura do bloco fixo acima, não deixando o card esconder */}
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
                        filteredPanels.map((panel) => {
                            const inCart = isInCart(panel.id);
                            return (
                                <div 
                                    key={panel.id} 
                                    onClick={() => setSelectedPanel(panel)}
                                    className={`bg-[#111113] rounded-[24px] overflow-hidden border transition-all shadow-xl flex flex-col ${
                                        inCart ? 'border-brand-neon bg-brand-neon/5' : 'border-white/5'
                                    }`}
                                >
                                    {/* Imagem do Card */}
                                    <div className="h-56 relative bg-black shrink-0">
                                        <img src={panel.images?.[0] || '/placeholder.jpg'} alt={panel.name} className="w-full h-full object-cover opacity-90" />
                                        
                                        {/* Badge Impactos */}
                                        <div className="absolute bottom-3 left-3 bg-[#0A0A0B]/80 px-2.5 py-1.5 rounded-xl flex gap-1.5 items-center backdrop-blur-md border border-white/10 shadow-lg">
                                            <Zap className="w-3.5 h-3.5 text-brand-neon" />
                                            <span className="text-xs font-black text-white">{formatImpacts(panel.impacts || 0)}</span>
                                        </div>

                                        {/* Botão Ação (Carrinho) */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleInCart(panel); }} 
                                            className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center border shadow-lg backdrop-blur-md transition-colors active:scale-95 z-20 ${
                                                inCart ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-[#0A0A0B]/80 border-white/20 text-brand-neon'
                                            }`}
                                        >
                                            {inCart ? <X className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {/* Infos do Card */}
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex justify-between items-start gap-3 mb-1">
                                            <h3 className="text-[15px] font-bold text-white line-clamp-2 leading-tight">{panel.name}</h3>
                                        </div>
                                        <p className="text-xs text-brand-muted flex items-center gap-1.5 mb-4">
                                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {panel.city} - {panel.state}
                                        </p>

                                        <div className="flex justify-between items-end border-t border-brand-border/20 pt-4 mt-auto">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase text-brand-muted font-bold tracking-widest mb-0.5">Investimento</span>
                                                <span className="text-lg font-black text-[#25D366] leading-none">{formatCurrency(Number(panel.price) || 0)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-brand-neon text-xs font-bold uppercase tracking-wider">
                                                Detalhes <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Bottom Navigation Nativa */}
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
            {/* MODALS COMPARTILHADOS (DETALHES E CARRINHO)                 */}
            {/* ========================================================= */}
            
            {/* MODAL EXPANDIDO DE DETALHES DO PAINEL */}
            <AnimatePresence>
                {selectedPanel && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-md flex items-center justify-center p-0 md:p-6">
                        
                        {/* Container do Modal: Full screen no Mobile, Boxed no Desktop */}
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full h-full md:h-auto md:max-h-[85vh] md:max-w-5xl bg-[#111113] md:rounded-3xl flex flex-col md:flex-row relative overflow-hidden shadow-2xl">
                            
                            {/* Botão de Fechar com Altíssimo z-index garantido */}
                            <button 
                                onClick={() => setSelectedPanel(null)} 
                                className="absolute top-4 right-4 z-[9999] w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-[#FF5E00] border border-white/20 shadow-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Lado Esquerdo: Mapa (Apenas Desktop) */}
                            <div className="hidden md:block w-1/2 h-full bg-black relative">
                                <MapContainer center={[selectedPanel.lat || 0, selectedPanel.lng || 0]} zoom={15} className="w-full h-full outline-none" zoomControl={false}>
                                    <MapFixer />
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                    <Marker position={[selectedPanel.lat || 0, selectedPanel.lng || 0]} icon={customMarker} />
                                </MapContainer>
                            </div>

                            {/* Lado Direito / Mobile: Conteúdo e Ações */}
                            <div className="w-full md:w-1/2 flex flex-col h-full relative">
                                
                                {/* Header da Imagem */}
                                <div className="w-full h-[35vh] md:h-[45%] shrink-0 relative">
                                    <img src={selectedPanel.images?.[0] || '/placeholder.jpg'} alt={selectedPanel.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-[#111113]/50 to-transparent" />
                                </div>

                                {/* Conteúdo de Rolagem (com espaço no fim (pb-24) para o botão não sobrepor info) */}
                                <div className="flex-1 overflow-y-auto p-5 md:p-8 flex flex-col gap-6 relative z-10 -mt-6 pb-28 custom-scrollbar">
                                    <div>
                                        {/* Título com pr-12 para não encavalar no "X" caso a tela seja muito pequena */}
                                        <h2 className="text-2xl font-black text-white leading-tight mb-2 pr-12">{selectedPanel.name}</h2>
                                        <p className="text-sm text-brand-muted flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-[#FF5E00]" /> {selectedPanel.city} - {selectedPanel.state}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-[#FF5E00]/10 border border-[#FF5E00]/20 rounded-xl p-4 flex flex-col justify-center shadow-inner relative overflow-hidden">
                                            <div className="absolute -right-3 -bottom-3 opacity-10">
                                                <Zap className="w-16 h-16 text-[#FF5E00]" />
                                            </div>
                                            <span className="text-[10px] text-[#FF5E00]/80 uppercase font-black tracking-widest mb-1 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Alcance Diário</span>
                                            <span className="text-2xl font-black text-[#FF5E00] tracking-tighter">{formatImpacts(selectedPanel.impacts || 0)}</span>
                                        </div>
                                        <div className="bg-[#25D366]/5 border border-[#25D366]/20 rounded-xl p-4 flex flex-col justify-center shadow-inner relative overflow-hidden">
                                            <div className="absolute -right-3 -bottom-3 opacity-10">
                                                <Activity className="w-16 h-16 text-[#25D366]" />
                                            </div>
                                            <span className="text-[10px] text-[#25D366]/80 uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Investimento</span>
                                            <span className="text-xl font-black text-[#25D366]">{formatCurrency(Number(selectedPanel.price) || 0)}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="px-3 py-3 bg-[#0A0A0B] rounded-xl border border-white/5 flex items-center gap-3">
                                            <LayoutGrid className="w-5 h-5 text-brand-muted shrink-0" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[9px] text-brand-muted uppercase font-bold tracking-widest">Formato</span>
                                                <span className="text-xs font-semibold text-white truncate">{selectedPanel.size}</span>
                                            </div>
                                        </div>
                                        <div className="px-3 py-3 bg-[#0A0A0B] rounded-xl border border-white/5 flex items-center gap-3">
                                            <Eye className="w-5 h-5 text-brand-muted shrink-0" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[9px] text-brand-muted uppercase font-bold tracking-widest">Resolução</span>
                                                <span className="text-xs font-semibold text-white truncate">{selectedPanel.px}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Botão Fixo no Rodapé do Modal (Sempre visível) */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-brand-border/20 bg-[#0A0A0B] pb-safe z-50">
                                    <button
                                        onClick={() => toggleInCart(selectedPanel)}
                                        className={`w-full font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-sm shadow-lg ${
                                            isInCart(selectedPanel.id) ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-[#FF5E00] text-white hover:bg-[#e05300]'
                                        }`}
                                    >
                                        {isInCart(selectedPanel.id) ? <><X className="w-5 h-5" /> Remover do Orçamento</> : <><ShoppingCart className="w-5 h-5" /> Adicionar ao Orçamento</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BARRA LATERAL DO CARRINHO */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 top-16 lg:top-20 bg-black/60 backdrop-blur-sm z-[9990]" />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-16 lg:top-20 right-0 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] w-full md:w-[450px] bg-[#0A0A0B] border-l border-white/10 z-[9990] flex flex-col shadow-2xl">
                            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#111113] shrink-0 pt-[env(safe-area-inset-top,20px)]">
                                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-3"><ShoppingCart className="w-5 h-5 text-[#FF5E00]" /> Resumo do Pedido</h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="text-brand-muted hover:text-white bg-[#0A0A0B] p-2 rounded-full"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-60">
                                        <ShoppingCart className="w-12 h-12 text-brand-muted mb-4" />
                                        <p className="text-sm text-brand-muted">Seu carrinho de orçamentos está vazio.</p>
                                    </div>
                                ) : (
                                    cart.map((p, i) => (
                                        <div key={p.id} className="flex gap-4 p-4 bg-[#111113] border border-white/5 rounded-xl mb-4 relative shadow-md">
                                            <div className="w-6 h-6 absolute -top-3 -left-3 bg-[#FF5E00] text-white font-bold text-xs rounded-full flex items-center justify-center border-4 border-[#0A0A0B]">{i + 1}</div>
                                            <img src={p.images?.[0] || '/placeholder.jpg'} alt={p.name} className="w-16 h-16 rounded-lg object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-white leading-tight mb-1 truncate pr-6">{p.name}</h4>
                                                <p className="text-xs text-brand-muted mb-2"><MapPin className="w-3 h-3 inline-block -mt-0.5" /> {p.city}</p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-[#25D366]">{formatCurrency(Number(p.price))}</span>
                                                    <button onClick={() => toggleInCart(p)} className="text-[10px] text-red-500 font-bold uppercase tracking-wider hover:text-red-400 bg-red-500/10 px-2 py-1 rounded">Remover</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="bg-[#111113] p-5 lg:p-6 border-t border-white/5 shrink-0 pb-safe">
                                <div className="flex justify-between items-start mb-5">
                                    <div className="flex flex-col gap-3 w-full">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Impacto Total</p>
                                            <p className="text-2xl font-black text-[#FF5E00]">{formatImpacts(totalCartImpacts || 0)}</p>
                                        </div>
                                        
                                        {/* Breakout do Desconto */}
                                        {totalVolumeDiscount > 0 && (
                                            <>
                                                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Subtotal Base</p>
                                                    <p className="text-sm font-semibold text-brand-muted line-through">{formatCurrency(totalOriginalValue)}</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-bold text-[#25D366] uppercase tracking-widest">Desconto Combo (10%)</p>
                                                    <p className="text-sm font-bold text-[#25D366]">- {formatCurrency(totalVolumeDiscount)}</p>
                                                </div>
                                            </>
                                        )}

                                        <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Investimento Final</p>
                                            <p className="text-xl font-black text-[#25D366]">{formatCurrency(finalCartValue || 0)}</p>
                                        </div>
                                    </div>
                                </div>
                                <Button disabled={cart.length === 0} onClick={handleCheckoutRedirect} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,211,102,0.3)] border-none">
                                    <MessageCircle className="w-5 h-5 mr-2" /> Finalizar Cotação
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}