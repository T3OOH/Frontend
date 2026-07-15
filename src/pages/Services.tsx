import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ShoppingCart, Check, X, Eye, Loader2, MessageCircle, Activity, LayoutGrid, Search, Filter } from 'lucide-react';
import { panelsService } from '@/services/panels.service';

// Ícone personalizado para o mapa do Modal
const customMarker = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: #1C1C1E; border: 2px solid #FF5E00; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(255, 94, 0, 0.5);"><div style="background-color: #FF5E00; width: 8px; height: 8px; border-radius: 50%;"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

export function Services() {
    const [panels, setPanels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Estados dos Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    const [cart, setCart] = useState<any[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedPanel, setSelectedPanel] = useState<any | null>(null);

    // 1. Busca os painéis no banco
    useEffect(() => {
        const fetchPanels = async () => {
            try {
                setIsLoading(true);
                const data = await panelsService.getAllPanels();
                setPanels(data.filter((p: any) => p.status === 'AVAILABLE'));
            } catch (error) {
                console.error("Erro ao carregar serviços:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPanels();
    }, []);

    // 2. Extração Dinâmica de Estados e Cidades para os Filtros
    const availableStates = useMemo(() => {
        const states = panels.map(p => p.state).filter(Boolean);
        return Array.from(new Set(states)).sort();
    }, [panels]);

    const availableCities = useMemo(() => {
        const filtered = selectedState ? panels.filter(p => p.state === selectedState) : panels;
        const cities = filtered.map(p => p.city).filter(Boolean);
        return Array.from(new Set(cities)).sort();
    }, [panels, selectedState]);

    // 3. Aplicação dos Filtros
    const filteredPanels = useMemo(() => {
        return panels.filter(panel => {
            const matchesSearch = panel.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  panel.city?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesState = selectedState ? panel.state === selectedState : true;
            const matchesCity = selectedCity ? panel.city === selectedCity : true;
            return matchesSearch && matchesState && matchesCity;
        });
    }, [panels, searchTerm, selectedState, selectedCity]);

    // 4. Lógica do Carrinho
    const toggleInCart = (panel: any) => {
        const exists = cart.find(item => item.id === panel.id);
        if (exists) {
            setCart(cart.filter(item => item.id !== panel.id));
        } else {
            setCart([...cart, panel]);
            setIsSidebarOpen(true);
            setSelectedPanel(null);
        }
    };

    // ==========================================
    // LÓGICA DE CONVERSÃO DE IMPACTOS (A Mágica Corrigida 2.0)
    // ==========================================
    const parseImpacts = (impactStr: string) => {
        if (!impactStr) return 0;
        const normalized = String(impactStr).toLowerCase().trim();
        
        // 1. Extrai apenas a parte com os números (pode conter ponto ou vírgula)
        const numMatch = normalized.match(/[\d.,]+/);
        if (!numMatch) return 0;
        let numStr = numMatch[0];

        // 2. Se for Milhões (M, Mi, Milhão) - Mas GARANTINDO que não confunda com a palavra "mil"
        if (
            (normalized.includes('mi') && !normalized.includes('mil')) || 
            normalized.includes('milh') || 
            normalized.endsWith('m') || 
            normalized.includes('m ') || 
            normalized.includes('m/')
        ) {
            numStr = numStr.replace(',', '.'); 
            return parseFloat(numStr) * 1000000;
        }
        
        // 3. Se for Milhares (K, Mil)
        if (normalized.includes('k') || normalized.includes('mil')) {
            numStr = numStr.replace(',', '.'); 
            return parseFloat(numStr) * 1000;
        }
        
        // 4. Se for número puro (Ex: 400.000 ou 400000)
        numStr = numStr.replace(/\./g, '').replace(',', '.');
        return parseInt(numStr, 10);
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace('.0', '').replace('.', ',') + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace('.0', '').replace('.', ',') + ' mil';
        }
        return num.toLocaleString('pt-BR');
    };

    const totalImpacts = cart.reduce((acc, panel) => acc + parseImpacts(panel.impacts), 0);

    // 5. Envio para o WhatsApp
    const sendToWhatsApp = () => {
        const phone = "5562999999999"; // Coloque o número oficial da T3 aqui
        
        let text = `Olá, equipe T3 OOH! 🚀\n\nTenho interesse em anunciar nos seguintes painéis:\n\n`;
        cart.forEach((p, index) => {
            text += `${index + 1}. *${p.name}* (${p.city}/${p.state})\n`;
        });
        
        text += `\n📊 *Impacto Total Estimado:* ${formatNumber(totalImpacts)} visualizações/dia.\n\nGostaria de negociar os valores e formatos. Podemos conversar?`;
        
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="relative w-full min-h-screen bg-[#0A0A0B] pt-28 pb-16 px-6">
            
            {/* BACKGROUND TEXTURE */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                
                {/* HEADER DA GÔNDOLA E BOTÃO VER PEDIDO */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                            <img src="t3d 2.png" alt="Logo T3 OOH" className="h-8 w-auto object-contain" /> Catálogo de Telões
                        </h1>
                        <p className="text-brand-muted mt-2">Escolha os melhores pontos para sua campanha e solicite um orçamento direto pelo WhatsApp.</p>
                    </div>
                    
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="relative bg-brand-surface border border-brand-border/50 px-5 py-3 rounded-xl text-brand-text font-bold hover:border-brand-neon/50 hover:text-brand-neon transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(255,94,0,0.2)]"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        Ver Pedido
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-brand-neon text-brand-black text-xs font-black rounded-full flex items-center justify-center animate-bounce shadow-[0_0_10px_rgba(255,94,0,0.6)]">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* =========================================
                    BARRA DE FILTROS E PESQUISA
                    ========================================= */}
                <div className="glass-panel p-4 rounded-2xl mb-10 flex flex-col md:flex-row gap-4 border border-brand-border/40 shadow-lg">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                        <input 
                            type="text" 
                            placeholder="Buscar por avenida, localização..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-brand-surface/30 border border-brand-border/50 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-brand-muted/70 focus:outline-none focus:border-brand-neon transition-all"
                        />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 md:w-2/5">
                        <div className="w-full relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                            <select 
                                value={selectedState}
                                onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(''); }}
                                className="w-full bg-brand-surface/30 border border-brand-border/50 rounded-xl pl-11 pr-4 py-3 text-sm text-brand-muted focus:text-white focus:outline-none focus:border-brand-neon transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Todos os Estados</option>
                                {availableStates.map(st => <option key={st as string} value={st as string}>{st as string}</option>)}
                            </select>
                        </div>

                        <div className="w-full relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                            <select 
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                disabled={!selectedState && availableCities.length === 0}
                                className="w-full bg-brand-surface/30 border border-brand-border/50 rounded-xl pl-11 pr-4 py-3 text-sm text-brand-muted focus:text-white focus:outline-none focus:border-brand-neon transition-all appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <option value="">Todas as Cidades</option>
                                {availableCities.map(city => <option key={city as string} value={city as string}>{city as string}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* GRID DE PRODUTOS (A GÔNDOLA) */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-brand-neon animate-spin mb-4" />
                        <p className="text-brand-muted uppercase tracking-widest text-xs font-bold">Carregando catálogo...</p>
                    </div>
                ) : filteredPanels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-brand-surface/20 rounded-3xl border border-brand-border/30">
                        <LayoutGrid className="w-16 h-16 text-brand-border mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Nenhum painel encontrado</h3>
                        <p className="text-sm text-brand-muted text-center max-w-md">Não encontramos resultados para a sua busca atual. Tente limpar os filtros ou buscar por outra avenida.</p>
                        <button 
                            onClick={() => { setSearchTerm(''); setSelectedState(''); setSelectedCity(''); }}
                            className="mt-6 bg-brand-surface border border-brand-border/50 px-6 py-2 rounded-xl text-sm font-bold hover:border-brand-neon hover:text-brand-neon transition-all"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredPanels.map((panel) => {
                            const inCart = cart.some(item => item.id === panel.id);

                            return (
                                <motion.div 
                                    key={panel.id}
                                    whileHover={{ y: -5 }}
                                    className={`glass-panel rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col group ${
                                        inCart ? 'border-brand-neon shadow-[0_0_20px_rgba(255,94,0,0.15)] bg-brand-neon/5' : 'border-brand-border/40 hover:border-brand-neon/40'
                                    }`}
                                >
                                    {/* Imagem do Card */}
                                    <div className="relative h-48 bg-brand-black overflow-hidden">
                                        <img 
                                            src={panel.images?.[0] || '/placeholder.jpg'} 
                                            alt={panel.name} 
                                            className={`w-full h-full object-cover transition-transform duration-500 ${inCart ? '' : 'group-hover:scale-110'}`}
                                        />
                                        {/* Overlay Escuro com Botão de Ver Mapa */}
                                        <div className="absolute inset-0 bg-brand-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <button 
                                                onClick={() => setSelectedPanel(panel)}
                                                className="bg-brand-neon text-brand-black px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"
                                            >
                                                <Eye className="w-4 h-4" /> Ver Detalhes
                                            </button>
                                        </div>
                                    </div>

                                    {/* Info do Card */}
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-base font-bold text-white leading-tight line-clamp-2">{panel.name}</h3>
                                        </div>
                                        <p className="text-xs text-brand-muted flex items-center gap-1.5 mb-4">
                                            <MapPin className="w-3.5 h-3.5" /> {panel.city || 'Cidade'} - {panel.state || 'UF'}
                                        </p>
                                        
                                        <div className="mt-auto grid grid-cols-2 gap-2 mb-4">
                                            <div className="bg-brand-surface/50 rounded-lg p-2 text-center border border-brand-border/30">
                                                <span className="block text-[9px] text-brand-muted uppercase tracking-wider mb-0.5">Formato</span>
                                                <span className="text-xs font-semibold text-white">{panel.size}</span>
                                            </div>
                                            <div className="bg-brand-surface/50 rounded-lg p-2 text-center border border-brand-border/30">
                                                <span className="block text-[9px] text-brand-muted uppercase tracking-wider mb-0.5">Impacto/Dia</span>
                                                <span className="text-xs font-semibold text-white flex items-center justify-center gap-1">
                                                    <Activity className="w-3 h-3 text-brand-neon" /> {panel.impacts}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => toggleInCart(panel)}
                                            className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                                                inCart
                                                    ? 'bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 group/btn'
                                                    : 'bg-brand-surface border border-brand-border/60 text-white hover:border-brand-neon hover:text-brand-neon'
                                            }`}
                                        >
                                            {inCart ? (
                                                <span className="group-hover/btn:hidden flex items-center gap-2"><Check className="w-4 h-4" /> Selecionado</span>
                                            ) : (
                                                <><ShoppingCart className="w-4 h-4" /> Adicionar</>
                                            )}
                                            {inCart && <span className="hidden group-hover/btn:flex items-center gap-2"><X className="w-4 h-4" /> Remover</span>}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* =========================================
                MODAL DE DETALHES (QUICK VIEW)
                ========================================= */}
            <AnimatePresence>
                {selectedPanel && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-brand-black/90 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#0f0f11] border border-brand-border/50 rounded-3xl w-full max-w-5xl h-[85vh] md:h-[70vh] flex flex-col md:flex-row overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] relative"
                        >
                            <button 
                                onClick={() => setSelectedPanel(null)} 
                                className="absolute top-4 right-4 z-10 w-10 h-10 bg-brand-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-brand-neon hover:text-black transition-colors border border-brand-border/50"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Mapa */}
                            <div className="w-full md:w-1/2 h-64 md:h-full relative bg-black">
                                <MapContainer 
                                    key={selectedPanel.id}
                                    center={[selectedPanel.lat, selectedPanel.lng]} 
                                    zoom={15} 
                                    className="w-full h-full outline-none"
                                    zoomControl={false}
                                >
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                    <Marker position={[selectedPanel.lat, selectedPanel.lng]} icon={customMarker} />
                                </MapContainer>
                                <div className="absolute top-4 left-4 z-[400] bg-brand-black/70 backdrop-blur-md border border-brand-border px-4 py-2 rounded-xl">
                                    <p className="text-xs font-bold text-brand-neon uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Localização Exata
                                    </p>
                                </div>
                            </div>

                            {/* Foto + Info Expandida */}
                            <div className="w-full md:w-1/2 h-full flex flex-col bg-brand-surface/30">
                                <div className="h-[45%] w-full relative">
                                    <img 
                                        src={selectedPanel.images?.[0] || '/placeholder.jpg'} 
                                        alt={selectedPanel.name} 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f11] to-transparent" />
                                </div>
                                
                                <div className="flex-1 p-6 flex flex-col justify-between relative -mt-10 z-10">
                                    <div>
                                        <h2 className="text-2xl font-extrabold text-white mb-2 leading-tight">{selectedPanel.name}</h2>
                                        <p className="text-sm text-brand-muted mb-6 flex items-center gap-2">
                                            {selectedPanel.city} - {selectedPanel.state}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="p-4 bg-brand-black/50 border border-brand-border/40 rounded-2xl">
                                                <p className="text-[10px] text-brand-muted uppercase tracking-widest mb-1">Formato</p>
                                                <p className="text-lg font-bold text-white">{selectedPanel.size}</p>
                                                <p className="text-xs text-brand-muted mt-1">Resolução: {selectedPanel.px}</p>
                                            </div>
                                            <div className="p-4 bg-brand-neon/5 border border-brand-neon/20 rounded-2xl">
                                                <p className="text-[10px] text-brand-neon uppercase tracking-widest mb-1">Impactos</p>
                                                <p className="text-lg font-bold text-white">{selectedPanel.impacts}</p>
                                                <p className="text-xs text-brand-muted mt-1">Estimativa diária</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => toggleInCart(selectedPanel)}
                                        className="w-full bg-brand-neon text-black font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,94,0,0.3)] hover:shadow-[0_0_30px_rgba(255,94,0,0.5)] transition-all flex justify-center items-center gap-2 tracking-wide uppercase text-sm"
                                    >
                                        <ShoppingCart className="w-5 h-5" /> Adicionar à Seleção
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* =========================================
                SIDEBAR DE CHECKOUT (CARRINHO E WHATSAPP)
                ========================================= */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
                        />
                        
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                            className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#0A0A0B] border-l border-brand-border/50 z-[200] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col"
                        >
                            <div className="p-6 border-b border-brand-border/30 flex justify-between items-center bg-brand-surface/20">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3 tracking-tight">
                                    <ShoppingCart className="w-5 h-5 text-brand-neon" /> 
                                    Resumo do Pedido
                                </h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="text-brand-muted hover:text-white transition-colors bg-brand-surface/50 p-2 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                        <ShoppingCart className="w-16 h-16 text-brand-muted mb-4" />
                                        <p className="text-white font-medium mb-2">Seu pedido está vazio</p>
                                        <p className="text-sm text-brand-muted">Adicione painéis da gôndola para montar seu circuito.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {cart.map((p, index) => (
                                            <div key={p.id} className="flex gap-4 p-4 bg-brand-surface/20 border border-brand-border/40 rounded-xl relative">
                                                <div className="w-6 h-6 absolute -top-3 -left-3 bg-brand-neon text-black font-bold text-xs rounded-full flex items-center justify-center border-4 border-[#0A0A0B]">
                                                    {index + 1}
                                                </div>
                                                <img src={p.images?.[0] || '/placeholder.jpg'} alt={p.name} className="w-20 h-20 rounded-lg object-cover border border-brand-border/30 bg-black" />
                                                <div className="flex-1 flex flex-col">
                                                    <h4 className="text-sm font-bold text-white leading-tight mb-1 pr-6">{p.name}</h4>
                                                    <p className="text-xs text-brand-muted mb-auto">{p.city}</p>
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-xs font-bold text-brand-neon bg-brand-neon/10 px-2 py-1 rounded">
                                                            {p.impacts} impactos
                                                        </span>
                                                        <button onClick={() => toggleInCart(p)} className="text-[10px] text-red-500 font-bold uppercase tracking-wider hover:text-red-400 bg-red-500/10 px-2 py-1 rounded transition-colors">
                                                            Remover
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-brand-surface/40 p-6 border-t border-brand-border/30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Impacto Somado</p>
                                        <p className="text-3xl font-black text-brand-neon drop-shadow-[0_0_10px_rgba(255,94,0,0.3)]">{formatNumber(totalImpacts)}</p>
                                        <p className="text-[10px] text-brand-muted mt-1">Pessoas/dia alcançadas</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Telas</p>
                                        <p className="text-3xl font-black text-white">{cart.length}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="w-full py-3.5 rounded-xl border border-brand-border/60 text-white font-bold text-xs hover:border-brand-neon hover:bg-brand-surface transition-all uppercase tracking-wide"
                                    >
                                        Continuar Escolhendo
                                    </button>
                                    <button
                                        disabled={cart.length === 0}
                                        onClick={sendToWhatsApp}
                                        className="w-full bg-[#25D366] text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:shadow-[0_0_30px_rgba(37,211,102,0.5)] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide text-sm"
                                    >
                                        <MessageCircle className="w-5 h-5" /> Negociar no WhatsApp
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}