import { useState, useEffect, useRef, useMemo } from 'react';
import { 
    ArrowRight, MapPin, BarChart3, Shield, MonitorPlay, Activity, 
    Search, Filter, Heart, Star, Compass, Flame 
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { panelsService } from '@/services/panels.service';

export function Home() {
    const navigate = useNavigate();
    
    // --- ESTADOS ---
    const [allPanels, setAllPanels] = useState<any[]>([]); 
    
    // Estados da Pesquisa Inteligente
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPanels, setFilteredPanels] = useState<any[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    
    // Estados de Localização
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [locationStatus, setLocationStatus] = useState('Descubra os melhores pontos na sua região');

    // Ref para fechar o dropdown ao clicar fora
    const dropdownRef = useRef<HTMLDivElement>(null);

    // --- EFEITOS ---
    useEffect(() => {
        const fetchPanels = async () => {
            try {
                const data = await panelsService.getAllPanels();
                if (data && data.length > 0) {
                    setAllPanels(data);
                }
            } catch (error) {
                console.error("Erro ao carregar painéis", error);
            }
        };
        fetchPanels();
    }, []);

    // Solicita a localização do usuário ao montar o componente
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocationStatus('Mostrando painéis perto de você');
                },
                () => {
                    setLocationStatus('Localização não permitida. Exibindo todos.');
                }
            );
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    // =========================================================
    // LÓGICA DE DADOS "VIVOS" (REATIVOS)
    // =========================================================
    
    const activePanelsCount = allPanels.length;

    const { formattedImpacts } = useMemo(() => {
        const total = allPanels.reduce((sum, panel) => {
            const val = panel.impacts || panel.dailyImpacts || panel.impact;
            if (!val) return sum;
            if (typeof val === 'number') return sum + val;
            
            if (typeof val === 'string') {
                const num = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
                const lowerVal = val.toLowerCase();
                
                if (lowerVal.includes('b')) return sum + (num * 1000000000);
                if (lowerVal.includes('mil') || lowerVal.includes('k')) return sum + (num * 1000);
                if (lowerVal.includes('m')) return sum + (num * 1000000); 
                
                return sum + num;
            }
            return sum;
        }, 0);

        let formatted = '0';
        if (total >= 1000000000) {
            formatted = (total / 1000000000).toFixed(1).replace('.0', '') + 'B';
        } else if (total >= 1000000) {
            formatted = (total / 1000000).toFixed(1).replace('.0', '') + 'M';
        } else if (total >= 1000) {
            formatted = (total / 1000).toFixed(1).replace('.0', '') + 'mil';
        } else {
            formatted = total.toString();
        }

        return { formattedImpacts: formatted };
    }, [allPanels]); 

    // =========================================================
    // LÓGICA: DISTÂNCIA REAL (PRÓXIMOS DE VOCÊ)
    // =========================================================
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Raio da Terra em km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const nearbyPanels = useMemo(() => {
        if (!userLocation || allPanels.length === 0) return [];
        
        return allPanels
            .map(panel => {
                const dist = (panel.lat && panel.lng) 
                    ? calculateDistance(userLocation.lat, userLocation.lng, panel.lat, panel.lng) 
                    : Infinity;
                return { ...panel, distance: dist };
            })
            .filter(panel => panel.distance < 50) // Limite de 50km
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3); // Exibe os 3 mais próximos
    }, [allPanels, userLocation]);

    // =========================================================
    // LÓGICA: DESTAQUES (FAVORITOS & CARROSSEL)
    // =========================================================
    const [carouselIndex, setCarouselIndex] = useState(0);
    const hasEnoughFavorites = favorites.size >= 3;

    const displayFeaturedPanels = useMemo(() => {
        if (allPanels.length === 0) return [];

        if (hasEnoughFavorites) {
            // Se tiver 3 ou mais favoritos, trava o carrossel e mostra apenas eles
            return allPanels.filter(p => favorites.has(p.id)).slice(0, 3);
        }

        // Lógica de Carrossel Circular
        const safeIndex = carouselIndex % allPanels.length;
        const end = safeIndex + 3;
        
        if (end <= allPanels.length) {
            return allPanels.slice(safeIndex, end);
        } else {
            return [...allPanels.slice(safeIndex), ...allPanels.slice(0, end - allPanels.length)];
        }
    }, [allPanels, favorites, carouselIndex, hasEnoughFavorites]);

    useEffect(() => {
        if (hasEnoughFavorites || allPanels.length <= 3) return;
        
        const interval = setInterval(() => {
            setCarouselIndex(prev => (prev + 1) % allPanels.length);
        }, 3500); // Roda a cada 3.5 segundos
        
        return () => clearInterval(interval);
    }, [hasEnoughFavorites, allPanels.length]);


    // --- FUNÇÕES AUXILIARES ---
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setIsDropdownOpen(false);
            navigate(`/mapa?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim().length > 0) {
            const lowerQuery = query.toLowerCase();
            const results = allPanels.filter(p => 
                (p.name && p.name.toLowerCase().includes(lowerQuery)) ||
                (p.city && p.city.toLowerCase().includes(lowerQuery)) ||
                (p.state && p.state.toLowerCase().includes(lowerQuery))
            ).slice(0, 5); 
            
            setFilteredPanels(results);
            setIsDropdownOpen(true);
        } else {
            setFilteredPanels([]);
            setIsDropdownOpen(false);
        }
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

    return (
        <div className="relative w-full min-h-screen bg-[#0A0A0B] overflow-x-hidden">

            {/* --- EFEITOS DE FUNDO GLOBAIS --- */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-neon/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
            <div className="absolute top-1/2 right-0 w-[30rem] h-[30rem] bg-brand-neon/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-orange-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '6s' }} />


            {/* ========================================================= */}
            {/* DESKTOP LAYOUT                                            */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col relative z-10 w-full pb-24">
                
                {/* BARRA DE PESQUISA INTELIGENTE */}
                <div className="w-full max-w-7xl mx-auto px-6 pt-6 pb-2 relative z-[60]" ref={dropdownRef}>
                    <div className="relative w-full max-w-2xl mx-auto">
                        <form onSubmit={handleSearchSubmit} className="flex items-center justify-between bg-[#111113]/90 backdrop-blur-xl border border-brand-border/40 rounded-full pl-6 pr-2 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] w-full transition-all hover:border-brand-neon/50 focus-within:border-brand-neon/80">
                            <div className="flex items-center gap-4 flex-1">
                                <Search className="w-5 h-5 text-brand-neon" />
                                <div className="flex flex-col flex-1">
                                    <input 
                                        type="text" 
                                        placeholder="Para onde quer anunciar? (Ex: Goiânia)"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        onFocus={() => {
                                            if (searchQuery.trim() && filteredPanels.length > 0) setIsDropdownOpen(true);
                                        }}
                                        className="bg-transparent border-none outline-none text-sm font-bold text-white leading-tight placeholder:text-brand-muted/70 w-full"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="bg-brand-neon text-[#0A0A0B] px-6 py-2.5 rounded-full font-black text-sm hover:brightness-110 transition-all shadow-[0_0_15px_rgba(255,94,0,0.3)]">
                                Buscar Painéis
                            </button>
                        </form>

                        {/* DROPDOWN DE RESULTADOS FLUTUANTE */}
                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-[110%] left-0 w-full bg-[#111113]/95 backdrop-blur-2xl border border-brand-border/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden z-[70]"
                                >
                                    {filteredPanels.length > 0 ? (
                                        <ul className="flex flex-col">
                                            {filteredPanels.map((panel, idx) => (
                                                <li key={panel.id || idx}>
                                                    <Link 
                                                        to={`/servicos`}
                                                        onClick={() => setIsDropdownOpen(false)}
                                                        className="flex items-center gap-4 px-6 py-4 hover:bg-brand-surface/60 border-b border-white/5 last:border-none transition-colors group"
                                                    >
                                                        <div className="w-10 h-10 rounded-lg bg-black overflow-hidden shrink-0 border border-white/10 group-hover:border-brand-neon/50 transition-colors">
                                                            <img src={panel.images?.[0] || '/placeholder.jpg'} alt={panel.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                                                        </div>
                                                        <div className="flex flex-col flex-1">
                                                            <span className="text-sm font-bold text-white group-hover:text-brand-neon transition-colors line-clamp-1">{panel.name}</span>
                                                            <span className="text-xs text-brand-muted flex items-center gap-1"><MapPin className="w-3 h-3" /> {panel.city} - {panel.state}</span>
                                                        </div>
                                                        <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-neon transition-colors" />
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="px-6 py-6 text-center">
                                            <p className="text-sm text-brand-muted">Nenhum painel encontrado para "{searchQuery}"</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* HERO SECTION */}
                <div className="grid max-w-7xl mx-auto px-6 w-full grid-cols-2 gap-8 items-center py-4 lg:py-6 relative z-10">
                    <div className="flex flex-col items-start text-left">
                        <div className="w-full max-w-xl flex justify-center mb-6 relative perspective-1000">
                            <motion.div 
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-neon rounded-full blur-[120px] opacity-20 pointer-events-none"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <motion.img 
                                src="/t3d 2.png" 
                                alt="Logo T3 3D" 
                                loading="eager"
                                className="w-[380px] h-[380px] object-contain mix-blend-screen relative z-10 drop-shadow-[0_0_40px_rgba(255,94,0,0.25)] cursor-pointer"
                                transition={{ duration: 8, repeat: Infinity, repeatDelay: 5, ease: [0.4, 0, 0.2, 1] }}
                                style={{ transformStyle: 'preserve-3d' }}
                            />
                        </div>

                        <p className="text-lg xl:text-xl text-brand-muted max-w-xl mb-8 font-normal leading-relaxed relative z-20">
                            <strong>T3 LED</strong> sua empresa com inteligência por trás das campanhas em mídia digital outdoor. Gerencie, anuncie e acompanhe sua veiculação em uma rede de painéis que cresce em Goiânia, no<strong className="text-brand-text font-semibold"> Centro-Oeste e em todo o país</strong>.
                        </p>

                        <div className="flex flex-row items-center gap-4 w-auto relative z-20">
                            <Link to="/servicos">
                                <Button size="lg" className="shadow-[0_0_20px_rgba(255,94,0,0.25)] hover:shadow-[0_0_30px_rgba(255,94,0,0.4)] transition-all">
                                    Solicitar Orçamento
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Link 
                                to="/mapa" 
                                onMouseEnter={() => panelsService.getMapMarkers().catch(() => {})}
                            >
                                <Button size="lg" variant="secondary" className="border-brand-border/60 hover:bg-brand-surface/80 transition-all">
                                    <MapPin className="w-5 h-5 mr-2" />
                                    Explorar Mapa
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Dashboards Flutuantes */}
                    <div className="relative block w-full h-[450px]">
                        <div className="absolute inset-0 border-l border-brand-neon/20 ml-[40px] border-dashed pointer-events-none" />

                        <div className="absolute top-4 left-0 w-64 glass-panel p-6 rounded-xl border border-brand-border/60 hover:border-brand-neon/50 bg-brand-surface/40 backdrop-blur-lg transform hover:-translate-y-2 transition-all duration-300 shadow-2xl group cursor-default">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-brand-neon/10 rounded-lg group-hover:bg-brand-neon/20 transition-colors">
                                    <MonitorPlay className="w-6 h-6 text-brand-neon" />
                                </div>
                                <Activity className="w-4 h-4 text-brand-muted/50 group-hover:text-brand-neon/70 transition-colors" />
                            </div>
                            <h3 className="text-4xl font-black text-brand-text mb-1 tracking-tight group-hover:text-brand-neon transition-colors">
                                {activePanelsCount > 0 ? activePanelsCount : '+200'}
                            </h3>
                            <p className="text-xs font-medium text-brand-muted uppercase tracking-wider">Painéis Ativos</p>
                        </div>

                        <div className="absolute top-28 right-4 w-72 glass-panel p-6 rounded-xl border border-brand-border/60 hover:border-brand-neon/50 bg-brand-surface/40 backdrop-blur-lg transform hover:-translate-y-2 transition-all duration-300 shadow-2xl group cursor-default z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-brand-neon/10 rounded-lg group-hover:bg-brand-neon/20 transition-colors">
                                    <BarChart3 className="w-6 h-6 text-brand-neon" />
                                </div>
                                <div className="flex items-center gap-1.5 bg-brand-black/50 px-2 py-1 rounded-md border border-brand-border">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Live</span>
                                </div>
                            </div>
                            <h3 className="text-4xl font-black text-brand-text mb-1 tracking-tight group-hover:text-brand-neon transition-colors">
                                {formattedImpacts !== '0' ? formattedImpacts : '1.5M'}
                            </h3>
                            <p className="text-xs font-medium text-brand-muted uppercase tracking-wider">Impactos Diários</p>
                            
                            <div className="mt-5 flex items-end gap-1.5 h-10 opacity-60">
                                <div className="w-full bg-brand-neon/20 rounded-t-sm h-[40%] group-hover:h-[60%] transition-all duration-500 delay-75" />
                                <div className="w-full bg-brand-neon/40 rounded-t-sm h-[60%] group-hover:h-[80%] transition-all duration-500 delay-100" />
                                <div className="w-full bg-brand-neon/60 rounded-t-sm h-[30%] group-hover:h-[50%] transition-all duration-500 delay-150" />
                                <div className="w-full bg-brand-neon/80 rounded-t-sm h-[80%] group-hover:h-[100%] transition-all duration-500 delay-200" />
                                <div className="w-full bg-brand-neon rounded-t-sm h-[100%] group-hover:h-[90%] transition-all duration-500 delay-300" />
                            </div>
                        </div>

                        <div className="absolute bottom-6 left-12 w-[340px] glass-panel p-5 rounded-xl border border-brand-border/60 hover:border-brand-neon/50 bg-brand-surface/40 backdrop-blur-lg transform hover:-translate-y-2 transition-all duration-300 shadow-2xl group cursor-default">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-brand-neon/10 rounded-lg border border-brand-neon/20 group-hover:border-brand-neon/50 transition-colors shrink-0">
                                    <Shield className="w-6 h-6 text-brand-neon" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-brand-text group-hover:text-brand-neon transition-colors">Auditoria de Veiculação</h3>
                                    <p className="text-xs text-brand-muted mt-1 leading-relaxed">Garantia de entrega e relatórios precisos de exibição via IA.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* DESTAQUES E PRÓXIMOS (VERSÃO DESKTOP)                     */}
                {/* ========================================================= */}
                <div className="max-w-7xl mx-auto px-6 w-full flex flex-col gap-16 mt-8 relative z-20">
                    
                    {/* Destaques (Carrossel / Favoritos) */}
                    <div>
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                    <Flame className="w-6 h-6 text-brand-neon" /> Destaques
                                </h3>
                                <p className="text-sm text-brand-muted mt-1">
                                    {hasEnoughFavorites ? 'Seus painéis favoritos' : 'Os pontos mais cobiçados do momento'}
                                </p>
                            </div>
                            <Link to="/mapa" className="text-sm font-bold text-brand-neon uppercase tracking-wider hover:underline">Ver Mapa Completo</Link>
                        </div>

                        <div className="grid grid-cols-3 gap-6 relative overflow-hidden">
                            <AnimatePresence mode="popLayout">
                                {displayFeaturedPanels.length > 0 ? displayFeaturedPanels.map((panel) => {
                                    const isFavorite = favorites.has(panel.id);
                                    return (
                                    <motion.div 
                                        key={panel.id}
                                        layout
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                    >
                                        <Link to={`/servicos`} className="bg-[#111113] rounded-[24px] overflow-hidden border border-brand-border/20 shadow-lg block hover:-translate-y-1 hover:border-brand-neon/40 hover:shadow-[0_10px_30px_rgba(255,94,0,0.15)] transition-all h-full">
                                            <div className="h-[200px] relative bg-black">
                                                <img src={panel.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover" alt="Painel" />
                                                
                                                <button 
                                                    onClick={(e) => toggleFavorite(e, panel.id)}
                                                    className="absolute top-4 right-4 bg-[#0A0A0B]/60 backdrop-blur-md p-2 rounded-full border border-white/10 z-10 hover:scale-110 transition-transform"
                                                >
                                                    <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-brand-neon text-brand-neon' : 'text-white'}`} />
                                                </button>

                                                <div className="absolute bottom-3 left-3 bg-[#0A0A0B]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                                                    <Activity className="w-4 h-4 text-brand-neon" />
                                                    <span className="text-xs font-black text-white tracking-wider">{panel.impacts || '1.2M'} impactos</span>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-lg text-white line-clamp-1 pr-2">{panel.name || 'Painel Digital Premium'}</h4>
                                                    <div className="flex items-center gap-1 shrink-0 bg-white/5 px-2 py-1 rounded text-sm font-bold text-white">
                                                        <Star className="w-4 h-4 fill-brand-neon text-brand-neon" />
                                                        4.9
                                                    </div>
                                                </div>
                                                <p className="text-sm text-brand-muted flex items-center gap-1.5 mb-5">
                                                    <MapPin className="w-4 h-4" /> {panel.city || 'Goiânia'} - {panel.state || 'GO'}
                                                </p>
                                                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-brand-muted uppercase tracking-wider font-bold mb-1">Investimento</span>
                                                        <span className="text-xl font-black text-brand-neon">{formatCurrency(panel.price || 1500)}</span>
                                                    </div>
                                                    <div className="p-2.5 bg-brand-neon/10 rounded-xl text-brand-neon group-hover:bg-brand-neon group-hover:text-[#0A0A0B] transition-colors">
                                                        <ArrowRight className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                )}) : (
                                    [1,2,3].map(i => (
                                        <div key={i} className="bg-[#111113] rounded-[24px] h-[360px] border border-brand-border/10 animate-pulse flex flex-col">
                                            <div className="h-[200px] bg-brand-surface/50 w-full rounded-t-[24px]" />
                                            <div className="p-5 flex-1 flex flex-col gap-4">
                                                <div className="h-5 bg-brand-surface/50 rounded w-3/4" />
                                                <div className="h-4 bg-brand-surface/50 rounded w-1/2" />
                                                <div className="mt-auto h-8 bg-brand-surface/50 rounded w-1/3" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Próximos de Você Desktop */}
                    <div>
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                    <MapPin className="w-6 h-6 text-brand-neon" /> Próximos de você
                                </h3>
                                <p className="text-sm text-brand-muted mt-1">{locationStatus}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-6">
                            {nearbyPanels.length > 0 ? nearbyPanels.map((panel, idx) => (
                                <Link to={`/servicos`} key={panel.id || idx} className="flex gap-4 bg-[#111113] p-4 rounded-[20px] border border-brand-border/20 shadow-md items-center relative overflow-hidden hover:border-brand-neon/40 hover:-translate-y-1 transition-all">
                                    <div className="w-28 h-28 rounded-xl overflow-hidden bg-black shrink-0 relative">
                                        <img src={panel.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover" alt="Painel" />
                                        <div className="absolute top-2 left-2 bg-[#0A0A0B]/80 px-2 py-1 rounded text-[10px] font-bold text-white">PRO</div>
                                    </div>
                                    <div className="flex-1 min-w-0 py-1">
                                        <h4 className="font-bold text-base text-white line-clamp-1 mb-2">{panel.name || 'Circuito Urbano Principal'}</h4>
                                        <p className="text-xs text-brand-muted flex items-center gap-1.5 mb-3">
                                            <MapPin className="w-3.5 h-3.5 text-brand-neon" /> 
                                            {panel.distance !== Infinity ? `${panel.distance.toFixed(1)} km de distância` : 'Distância desconhecida'}
                                        </p>
                                        <span className="text-base font-black text-brand-neon block">{formatCurrency(panel.price || 1500)}</span>
                                    </div>
                                </Link>
                            )) : (
                                <div className="col-span-3 py-10 border border-white/5 bg-[#111113] rounded-[20px] text-center">
                                    <p className="text-brand-muted text-sm">{userLocation ? 'Nenhum painel encontrado em um raio de 50km.' : 'Permita o acesso à localização para ver telões próximos.'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* ========================================================= */}
            {/* MOBILE LAYOUT                                             */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col relative z-20 pb-36 pt-4 w-full">

                {/* BARRA DE PESQUISA MOBILE */}
                <div className="px-4 sticky top-0 z-50 pt-2 pb-4 bg-[#0A0A0B]/90 backdrop-blur-xl border-b border-white/5" ref={dropdownRef}>
                    <div className="relative">
                        <form onSubmit={handleSearchSubmit} className="flex items-center justify-between bg-[#111113] border border-brand-border/40 rounded-full pl-4 pr-2 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
                            <div className="flex items-center gap-3 flex-1">
                                <button type="submit" aria-label="Pesquisar">
                                    <Search className="w-5 h-5 text-brand-neon" />
                                </button>
                                <div className="flex flex-col flex-1">
                                    <input 
                                        type="text" 
                                        placeholder="Para onde quer anunciar?"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        onFocus={() => {
                                            if (searchQuery.trim() && filteredPanels.length > 0) setIsDropdownOpen(true);
                                        }}
                                        className="bg-transparent border-none outline-none text-sm font-bold text-white leading-tight placeholder:text-white w-full"
                                    />
                                    <span className="text-[10px] text-brand-muted">Goiânia • Impacto Diário</span>
                                </div>
                            </div>
                            <button type="button" className="p-2 bg-[#1A1A1D] rounded-full border border-brand-border/30">
                                <Filter className="w-4 h-4 text-brand-muted" />
                            </button>
                        </form>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-[110%] left-0 w-full bg-[#111113]/95 backdrop-blur-xl border border-brand-border/40 rounded-2xl shadow-2xl overflow-hidden z-[70]"
                                >
                                    {filteredPanels.length > 0 ? (
                                        <ul className="flex flex-col max-h-[300px] overflow-y-auto">
                                            {filteredPanels.map((panel, idx) => (
                                                <li key={panel.id || idx}>
                                                    <Link 
                                                        to={`/servicos`}
                                                        onClick={() => setIsDropdownOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-3 hover:bg-brand-surface/60 border-b border-white/5 last:border-none transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-md bg-black overflow-hidden shrink-0">
                                                            <img src={panel.images?.[0] || '/placeholder.jpg'} alt={panel.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex flex-col flex-1">
                                                            <span className="text-sm font-bold text-white line-clamp-1">{panel.name}</span>
                                                            <span className="text-[10px] text-brand-muted">{panel.city} - {panel.state}</span>
                                                        </div>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="px-4 py-4 text-center">
                                            <p className="text-xs text-brand-muted">Nenhum painel encontrado.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="px-4 mt-6 mb-6">
                    <div className="bg-gradient-to-br from-[#111113] to-brand-neon/10 border border-brand-neon/20 rounded-[24px] p-5 relative overflow-hidden flex flex-col shadow-xl">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-brand-neon/20 blur-[50px] rounded-full"></div>
                        <div className="flex justify-between items-center relative z-10 mb-2">
                            <div className="w-[60%]">
                                <h2 className="text-xl font-black text-white leading-tight mb-2">T3 LED Mídia</h2>
                                <p className="text-[11px] text-brand-muted leading-relaxed font-medium">
                                    Sua marca no topo. Inteligência em mídia digital outdoor no Centro-Oeste.
                                </p>
                            </div>
                            <div className="w-[40%] flex justify-end">
                                <img src="/t3d 2.png" alt="T3 3D" className="w-28 h-28 object-contain drop-shadow-[0_0_20px_rgba(255,94,0,0.5)]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 mb-8">
                    <div className="flex gap-3 overflow-x-auto snap-x custom-scrollbar pb-2 -mx-4 px-4">
                        <div className="snap-start flex-shrink-0 w-28 bg-[#111113] border border-brand-border/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
                            <MonitorPlay className="w-6 h-6 text-brand-neon" />
                            <span className="text-sm font-black text-white">{activePanelsCount > 0 ? activePanelsCount : '+200'}</span>
                            <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wider text-center">Ativos</span>
                        </div>
                        <div className="snap-start flex-shrink-0 w-28 bg-[#111113] border border-brand-border/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg relative overflow-hidden">
                            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <BarChart3 className="w-6 h-6 text-brand-neon" />
                            <span className="text-sm font-black text-white">{formattedImpacts !== '0' ? formattedImpacts : '1.5M'}</span>
                            <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wider text-center">Impactos</span>
                        </div>
                        <div className="snap-start flex-shrink-0 w-28 bg-[#111113] border border-brand-border/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
                            <Shield className="w-6 h-6 text-brand-neon" />
                            <span className="text-[10px] font-black text-white text-center leading-tight">Auditoria</span>
                            <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wider text-center">IA</span>
                        </div>
                    </div>
                </div>

                {/* DESTAQUES MOBILE */}
                <div className="px-4 mb-8">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                <Flame className="w-5 h-5 text-brand-neon" /> Destaques
                            </h3>
                            <p className="text-[11px] text-brand-muted">{hasEnoughFavorites ? 'Seus favoritos' : 'Os pontos mais cobiçados'}</p>
                        </div>
                        <Link to="/mapa" className="text-[11px] font-bold text-brand-neon uppercase tracking-wider">Ver Mapa</Link>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto snap-x custom-scrollbar pb-4 -mx-4 px-4">
                        {displayFeaturedPanels.length > 0 ? displayFeaturedPanels.map((panel, idx) => {
                            const isFavorite = favorites.has(panel.id);
                            return (
                            <Link to={`/servicos`} key={panel.id || idx} className="snap-start flex-shrink-0 w-[260px] bg-[#111113] rounded-[20px] overflow-hidden border border-brand-border/20 shadow-lg block">
                                <div className="h-[160px] relative bg-black">
                                    <img src={panel.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover" alt="Painel" />
                                    
                                    <button 
                                        onClick={(e) => toggleFavorite(e, panel.id)}
                                        className="absolute top-3 right-3 bg-[#0A0A0B]/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 z-10 hover:scale-110 transition-transform"
                                    >
                                        <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-brand-neon text-brand-neon' : 'text-white'}`} />
                                    </button>

                                    <div className="absolute bottom-3 left-3 bg-[#0A0A0B]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                                        <Activity className="w-3 h-3 text-brand-neon" />
                                        <span className="text-[10px] font-black text-white tracking-wider">{panel.impacts || '1.2M'}</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-sm text-white line-clamp-1 pr-2">{panel.name || 'Painel Digital Premium'}</h4>
                                        <div className="flex items-center gap-1 shrink-0 bg-white/5 px-1.5 py-0.5 rounded text-xs font-bold text-white">
                                            <Star className="w-3 h-3 fill-brand-neon text-brand-neon" />
                                            4.9
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-brand-muted flex items-center gap-1.5 mb-4">
                                        <MapPin className="w-3 h-3" /> {panel.city || 'Goiânia'} - {panel.state || 'GO'}
                                    </p>
                                    <div className="flex justify-between items-end border-t border-white/5 pt-3">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-brand-muted uppercase tracking-wider font-bold">Investimento</span>
                                            <span className="text-base font-black text-brand-neon">{formatCurrency(panel.price || 1500)}</span>
                                        </div>
                                        <div className="p-2 bg-brand-neon/10 rounded-lg text-brand-neon">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )}) : (
                            [1,2].map(i => (
                                <div key={i} className="snap-start flex-shrink-0 w-[260px] bg-[#111113] rounded-[20px] h-[300px] border border-brand-border/10 animate-pulse flex flex-col">
                                    <div className="h-[160px] bg-brand-surface/50 w-full" />
                                    <div className="p-4 flex-1 flex flex-col gap-3">
                                        <div className="h-4 bg-brand-surface/50 rounded w-3/4" />
                                        <div className="h-3 bg-brand-surface/50 rounded w-1/2" />
                                        <div className="mt-auto h-6 bg-brand-surface/50 rounded w-1/3" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* PRÓXIMOS DE VOCÊ MOBILE */}
                <div className="px-4 mb-4">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-brand-neon" /> Próximos de você
                            </h3>
                            <p className="text-[11px] text-brand-muted">{locationStatus}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        {nearbyPanels.length > 0 ? nearbyPanels.map((panel, idx) => (
                            <Link to={`/servicos`} key={panel.id || idx} className="flex gap-4 bg-[#111113] p-3 rounded-[16px] border border-brand-border/20 shadow-md items-center relative overflow-hidden">
                                <div className="w-24 h-24 rounded-xl overflow-hidden bg-black shrink-0 relative">
                                    <img src={panel.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover" alt="Painel" />
                                    <div className="absolute top-1 left-1 bg-[#0A0A0B]/80 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">PRO</div>
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                    <h4 className="font-bold text-sm text-white line-clamp-1 mb-1">{panel.name || 'Circuito Urbano Principal'}</h4>
                                    <p className="text-[11px] text-brand-muted flex items-center gap-1.5 mb-2">
                                        <MapPin className="w-3 h-3 text-brand-neon" /> 
                                        {panel.distance !== Infinity ? `${panel.distance.toFixed(1)} km de distância` : 'Desconhecido'}
                                    </p>
                                    <span className="text-sm font-black text-brand-neon block">{formatCurrency(panel.price || 1500)}</span>
                                </div>
                            </Link>
                        )) : (
                            <div className="py-8 border border-white/5 bg-[#111113] rounded-2xl text-center">
                                <p className="text-brand-muted text-xs px-4">{userLocation ? 'Nenhum painel próximo.' : 'Ative a localização para ver telões próximos.'}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="fixed bottom-[76px] left-4 right-4 z-[90]">
                    <Link to="/servicos">
                        <Button className="w-full bg-brand-neon text-[#0A0A0B] font-black py-4 rounded-2xl shadow-[0_10px_25px_rgba(255,94,0,0.35)] text-sm flex justify-center items-center gap-2">
                            Solicitar Orçamento
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-2xl border-t border-brand-border/20 z-[100] px-6 py-3 flex justify-between items-center pb-safe">
                    <Link to="/" className="flex flex-col items-center gap-1 text-brand-neon">
                        <Compass className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Explorar</span>
                    </Link>
                    <Link to="/mapa" className="flex flex-col items-center gap-1 text-brand-muted hover:text-white transition-colors">
                        <MapPin className="w-5 h-5" />
                        <span className="text-[9px] font-medium">Mapa</span>
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

            </div>

        </div>
    );
}