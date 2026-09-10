import { useState, useEffect, useRef, useMemo } from 'react';
import {
    ArrowRight, MapPin, BarChart3, Shield, MonitorPlay, Activity,
    Search, Filter, Heart, Compass, Flame, Star
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { panelsService } from '@/services/panels.service';
import { Helmet } from 'react-helmet-async';

import AccordionGallery from '@/components/AccordionGallery';

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
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [locationStatus, setLocationStatus] = useState('Descubra os melhores pontos na sua região');

    // Refs para fechar o dropdown ao clicar fora
    const desktopDropdownRef = useRef<HTMLDivElement>(null);
    const mobileDropdownRef = useRef<HTMLDivElement>(null);

    // --- EFEITOS ---
    useEffect(() => {
        // [SEGURANÇA] AbortController para prevenir Memory Leaks e fechar conexões
        const controller = new AbortController(); 
        
        const fetchPanels = async () => {
            try {
                const data = await panelsService.getAllPanels();
                // Só atualiza o estado se o componente ainda estiver montado na tela
                if (!controller.signal.aborted && data && data.length > 0) {
                    setAllPanels(data);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("Erro ao carregar painéis", error);
                }
            }
        };
        
        fetchPanels();
        
        // Cleanup function (acionado quando o usuário sai da página)
        return () => {
            controller.abort();
        };
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

    // Fecha o dropdown se clicar fora da barra de pesquisa ativa
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const clickedOutsideDesktop = desktopDropdownRef.current && !desktopDropdownRef.current.contains(target);
            const clickedOutsideMobile = mobileDropdownRef.current && !mobileDropdownRef.current.contains(target);

            if (clickedOutsideDesktop && clickedOutsideMobile) {
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
    // LÓGICA: DISTÂNCIA REAL E DESTAQUES (CORRIGIDO)
    // =========================================================
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
            .filter(panel => panel.distance < 50)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3);
    }, [allPanels, userLocation]);

    const hasEnoughFavorites = favorites.size > 0;

    // Painéis em Destaque Fixos (Prioriza favoritos e completa até 5 painéis)
    const displayFeaturedPanels = useMemo(() => {
        if (allPanels.length === 0) return [];

        const favs = allPanels.filter(p => favorites.has(p.id));
        const others = allPanels.filter(p => !favorites.has(p.id));

        return [...favs, ...others].slice(0, 5);
    }, [allPanels, favorites]);

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

    // =========================================================
    // COMPONENTE REUTILIZÁVEL: BARRA DE PESQUISA UNIFICADA
    // =========================================================
    const renderSearchBar = (refTarget: React.RefObject<HTMLDivElement | null>, isMobile: boolean) => (
        <div className={`relative w-full ${isMobile ? '' : 'max-w-2xl mx-auto'} z-[60]`} ref={refTarget}>
            <form onSubmit={handleSearchSubmit} className="flex items-center justify-between bg-[#111113]/90 backdrop-blur-xl border border-brand-border/40 rounded-full pl-5 pr-1.5 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] focus-within:border-[#FF5E00]/50 transition-all duration-300">
                <div className="flex items-center gap-3 flex-1">
                    <button type="submit" aria-label="Pesquisar" className="p-0.5 flex items-center justify-center">
                        <Search className="w-4 h-4 text-[#FF5E00]" />
                    </button>
                    <div className="flex flex-col flex-1 justify-center">
                        <input
                            type="text"
                            placeholder="Para onde quer anunciar?"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => {
                                if (searchQuery.trim() && filteredPanels.length > 0) setIsDropdownOpen(true);
                            }}
                            className="bg-transparent border-none outline-none text-[13px] font-bold text-white leading-none placeholder:text-[#8F8F91] w-full"
                        />
                        <span className="text-[9px] text-[#8F8F91] font-medium mt-1 leading-none">Goiânia • Impacto Diário</span>
                    </div>
                </div>
                <button type="button" className="w-8 h-8 flex items-center justify-center bg-[#1A1A1D] hover:bg-[#111113]/80 rounded-full border border-white/10 transition-colors duration-300 ml-2 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-[#8F8F91]" />
                </button>
            </form>

            <AnimatePresence>
                {isDropdownOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="absolute top-[110%] left-0 w-full bg-[#111113]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden z-[70]"
                    >
                        {filteredPanels.length > 0 ? (
                            <ul className="flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar">
                                {filteredPanels.map((panel, idx) => (
                                    <li key={panel.id || idx}>
                                        <Link
                                            to={`/servicos?panelId=${panel.id}`}
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-4 px-5 py-3 hover:bg-white/5 border-b border-white/5 last:border-none transition-colors duration-300 group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-black overflow-hidden shrink-0 border border-white/10 group-hover:border-[#FF5E00]/50 transition-colors duration-300">
                                                <img src={panel.images?.[0] || '/placeholder.jpg'} alt={panel.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <span className="text-sm font-bold text-white group-hover:text-[#FF5E00] transition-colors duration-300 line-clamp-1">{panel.name}</span>
                                                <span className="text-xs text-[#8F8F91] flex items-center gap-1"><MapPin className="w-3 h-3" /> {panel.city} - {panel.state}</span>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-[#8F8F91] group-hover:text-[#FF5E00] transition-colors duration-300" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="px-6 py-6 text-center">
                                <p className="text-sm text-[#8F8F91]">Nenhum painel encontrado para "{searchQuery}"</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <>
            <Helmet>
                <title>T3 OOH | Mídia Digital Outdoor e Painéis de LED</title>
                <meta name="description" content="Escale sua marca com painéis de LED de alto impacto. Aluguel de paineis, mídias out of home, inteligência de dados, auditoria e pontos premium." />
                <meta name="keywords" content="painel de led, out of home, mídias out of home, aluguel de paineis, paineis de led, publicidade, marketing outdoor" />
            </Helmet>

            <div className="relative w-full min-h-screen bg-[#0A0A0B] overflow-x-hidden">

                {/* --- EFEITOS DE FUNDO GLOBAIS (Leves e Otimizados) --- */}
                {/* Glow Neon suave no topo */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-[#FF5E00]/5 blur-[150px] rounded-full pointer-events-none z-0" />
                
                {/* Grade (Grid) Sobreposta para Manter a Identidade Visual Tecnológica */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />


                {/* ========================================================= */}
                {/* DESKTOP LAYOUT                                            */}
                {/* ========================================================= */}
                <div className="hidden lg:flex flex-col relative z-10 w-full pb-24 pt-[0px]">

                    {/* BARRA DE PESQUISA INTELIGENTE (DESKTOP) */}
                    <div className="w-full max-w-7xl mx-auto px-6 pt-6 pb-2 relative z-[60]">
                        {renderSearchBar(desktopDropdownRef, false)}
                    </div>

                    {/* HERO SECTION */}
                    <div className="grid max-w-7xl mx-auto px-6 w-full grid-cols-2 gap-8 items-center py-4 lg:py-6 relative z-10">
                        <div className="flex flex-col items-start text-left">
                            <div className="w-full max-w-xl flex justify-center mb-6 relative perspective-1000">
                                <motion.div
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF5E00] rounded-full blur-[120px] opacity-20 pointer-events-none"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <motion.img
                                    src="/t3d 2.png"
                                    alt="Logo T3 3D"
                                    loading="eager"
                                    className="w-[380px] h-[380px] object-contain mix-blend-screen relative z-10 drop-shadow-[0_0_40px_rgba(255,94,0,0.25)] cursor-pointer"
                                    animate={{ y: [-8, 8, -8] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                    style={{ transformStyle: 'preserve-3d' }}
                                />
                            </div>

                            <p className="text-lg xl:text-xl text-[#8F8F91] max-w-xl mb-8 font-normal leading-relaxed relative z-20">
                                <strong title="paineis de led">T3 LED</strong> sua empresa com inteligência por trás das campanhas em mídia digital outdoor. Gerencie, anuncie e acompanhe sua veiculação em uma rede de <strong title="aluguel de paineis" className="text-white font-semibold">painéis</strong> que cresce em Goiânia, no Centro-Oeste e em todo o país.
                            </p>

                            <div className="flex flex-row items-center gap-4 w-auto relative z-20">
                                <Link to="/servicos" title="Aluguel de paineis e mídias out of home">
                                    <Button
                                        size="lg"
                                        rightIcon={<ArrowRight className="w-5 h-5" />}
                                        className="shadow-[0_0_20px_rgba(255,94,0,0.25)] hover:shadow-[0_0_30px_rgba(255,94,0,0.4)] transition-all duration-300"
                                    >
                                        Solicitar Orçamento
                                    </Button>
                                </Link>

                                <Link
                                    to="/mapa"
                                    title="Mapa de Paineis de LED"
                                    onMouseEnter={() => panelsService.getMapMarkers().catch(() => { })}
                                >
                                    <Button
                                        size="lg"
                                        variant="secondary"
                                        leftIcon={
                                            <svg 
                                                className="w-5 h-5 text-[#8F8F91] group-hover:text-[#FF5E00] transition-transform duration-[1500ms] group-hover:rotate-[250deg]" 
                                                viewBox="0 0 512 512" 
                                                fill="currentColor" 
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm50.7-186.9L162.4 380.6c-19.4 7.5-38.5-11.6-31-31l55.5-144.3c3.3-8.5 9.9-15.1 18.4-18.4l144.3-55.5c19.4-7.5 38.5 11.6 31 31L325.1 306.7c-3.2 8.5-9.9 15.1-18.4 18.4zM288 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path>
                                            </svg>
                                        }
                                        className="group border-white/10 hover:bg-[#111113]/80 transition-all duration-500"
                                    >
                                        Explorar Mapa
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Dashboards Flutuantes */}
                        <div className="relative block w-full h-[450px]">
                            <div className="absolute inset-0 border-l border-[#FF5E00]/20 ml-[40px] border-dashed pointer-events-none" />

                            <div className="absolute top-4 left-0 w-64 glass-panel p-6 rounded-xl border border-white/10 hover:border-[#FF5E00]/50 bg-[#111113]/40 backdrop-blur-lg transform hover:-translate-y-2 transition-all duration-300 shadow-2xl group cursor-default">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2.5 bg-[#FF5E00]/10 rounded-lg group-hover:bg-[#FF5E00]/20 transition-colors duration-300">
                                        <MonitorPlay className="w-6 h-6 text-[#FF5E00]" />
                                    </div>
                                    <Activity className="w-4 h-4 text-[#8F8F91]/50 group-hover:text-[#FF5E00]/70 transition-colors duration-300" />
                                </div>
                                <h3 className="text-4xl font-black text-white mb-1 tracking-tight group-hover:text-[#FF5E00] transition-colors duration-300">
                                    {activePanelsCount > 0 ? activePanelsCount : '+200'}
                                </h3>
                                <p className="text-xs font-medium text-[#8F8F91] uppercase tracking-wider">Painéis Ativos</p>
                            </div>

                            <div className="absolute top-28 right-4 w-72 glass-panel p-6 rounded-xl border border-white/10 hover:border-[#FF5E00]/50 bg-[#111113]/40 backdrop-blur-lg transform hover:-translate-y-2 transition-all duration-300 shadow-2xl group cursor-default z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2.5 bg-[#FF5E00]/10 rounded-lg group-hover:bg-[#FF5E00]/20 transition-colors duration-300">
                                        <BarChart3 className="w-6 h-6 text-[#FF5E00]" />
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-md border border-white/10">
                                        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                                        <span className="text-[10px] text-[#25D366] font-bold uppercase tracking-widest">Live</span>
                                    </div>
                                </div>
                                <h3 className="text-4xl font-black text-white mb-1 tracking-tight group-hover:text-[#FF5E00] transition-colors duration-300">
                                    {formattedImpacts !== '0' ? formattedImpacts : '1.5M'}
                                </h3>
                                <p className="text-xs font-medium text-[#8F8F91] uppercase tracking-wider">Impactos Diários</p>

                                <div className="mt-5 flex items-end gap-1.5 h-10 opacity-60">
                                    <div className="w-full bg-[#FF5E00]/20 rounded-t-sm h-[40%] group-hover:h-[60%] transition-all duration-500 delay-75 ease-out" />
                                    <div className="w-full bg-[#FF5E00]/40 rounded-t-sm h-[60%] group-hover:h-[80%] transition-all duration-500 delay-100 ease-out" />
                                    <div className="w-full bg-[#FF5E00]/60 rounded-t-sm h-[30%] group-hover:h-[50%] transition-all duration-500 delay-150 ease-out" />
                                    <div className="w-full bg-[#FF5E00]/80 rounded-t-sm h-[80%] group-hover:h-[100%] transition-all duration-500 delay-200 ease-out" />
                                    <div className="w-full bg-[#FF5E00] rounded-t-sm h-[100%] group-hover:h-[90%] transition-all duration-500 delay-300 ease-out" />
                                </div>
                            </div>

                            <div className="absolute bottom-6 left-12 w-[340px] glass-panel p-5 rounded-xl border border-white/10 hover:border-[#FF5E00]/50 bg-[#111113]/40 backdrop-blur-lg transform hover:-translate-y-2 transition-all duration-300 shadow-2xl group cursor-default">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-[#FF5E00]/10 rounded-lg border border-[#FF5E00]/20 group-hover:border-[#FF5E00]/50 transition-colors duration-300 shrink-0">
                                        <Shield className="w-6 h-6 text-[#FF5E00]" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white group-hover:text-[#FF5E00] transition-colors duration-300">Auditoria de Veiculação</h3>
                                        <p className="text-xs text-[#8F8F91] mt-1 leading-relaxed">Transparência com checking fotográfico e relatórios detalhados de exibição.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ========================================================= */}
                    {/* DESTAQUES E PRÓXIMOS (VERSÃO DESKTOP)                     */}
                    {/* ========================================================= */}
                    <div className="max-w-7xl mx-auto px-6 w-full flex flex-col gap-16 mt-8 relative z-20">

                        {/* Destaques (Accordion Gallery) */}
                        <div>
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                        <Flame className="w-6 h-6 text-[#FF5E00]" /> Destaques
                                    </h3>
                                    <p className="text-sm text-[#8F8F91] mt-1">
                                        {hasEnoughFavorites ? 'Seus painéis favoritos' : 'Os pontos mais cobiçados do momento'}
                                    </p>
                                </div>
                                <Link to="/mapa" className="text-sm font-bold text-[#FF5E00] uppercase tracking-wider hover:underline transition-all">Ver Mapa Completo</Link>
                            </div>

                            {displayFeaturedPanels.length > 0 ? (
                                <AccordionGallery panels={displayFeaturedPanels} />
                            ) : (
                                <div className="grid grid-cols-3 gap-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="bg-[#111113] rounded-[24px] h-[360px] border border-white/10 animate-pulse flex flex-col">
                                            <div className="h-[200px] bg-white/5 w-full rounded-t-[24px]" />
                                            <div className="p-5 flex-1 flex flex-col gap-4">
                                                <div className="h-5 bg-white/5 rounded w-3/4" />
                                                <div className="h-4 bg-white/5 rounded w-1/2" />
                                                <div className="mt-auto h-8 bg-white/5 rounded w-1/3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Próximos de Você Desktop */}
                        <div>
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                        <MapPin className="w-6 h-6 text-[#FF5E00]" /> Próximos de você
                                    </h3>
                                    <p className="text-sm text-[#8F8F91] mt-1">{locationStatus}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                {nearbyPanels.length > 0 ? nearbyPanels.map((panel, idx) => {
                                    const basePrice = panel.price || 1500;
                                    const discountedPrice = basePrice * 0.70;

                                    return (
                                        <Link to={`/servicos?panelId=${panel.id}`} key={panel.id || idx} className="bg-[#111113] rounded-[5px] overflow-hidden border border-white/10 shadow-lg block hover:-translate-y-2 hover:border-[#FF5E00]/40 hover:shadow-[0_15px_40px_rgba(255,94,0,0.15)] transition-all duration-300 group">
                                            <div className="h-[200px] relative bg-black">
                                                <img src={panel.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" alt="Painel" />
                                                <button
                                                    onClick={(e) => toggleFavorite(e, panel.id)}
                                                    className="absolute top-4 right-4 bg-[#0A0A0B]/60 backdrop-blur-md p-2 rounded-full border border-white/10 z-10 hover:scale-110 transition-transform duration-300"
                                                >
                                                    <Heart className={`w-5 h-5 transition-colors duration-300 ${favorites.has(panel.id) ? 'fill-[#FF5E00] text-[#FF5E00]' : 'text-white'}`} />
                                                </button>
                                                <div className="absolute bottom-3 left-3 bg-[#0A0A0B]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                                                    <Activity className="w-4 h-4 text-[#FF5E00]" />
                                                    <span className="text-xs font-black text-white tracking-wider">{panel.distance !== Infinity ? `${panel.distance.toFixed(1)} km` : 'Local'}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="p-5 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-lg text-white line-clamp-1 pr-2 group-hover:text-[#FF5E00] transition-colors duration-300">{panel.name || 'Circuito Urbano'}</h4>
                                                        <div className="flex items-center gap-1 shrink-0 bg-white/5 px-2 py-1 rounded text-sm font-bold text-white">
                                                            <Star className="w-4 h-4 fill-[#FF5E00] text-[#FF5E00]" /> 4.9
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-[#8F8F91] flex items-center gap-1.5 mb-5">
                                                        <MapPin className="w-4 h-4 text-[#FF5E00]" /> {panel.city || 'Goiânia'} - {panel.state || 'GO'}
                                                    </p>
                                                </div>
                                                
                                                <div className="flex justify-between items-end border-t border-white/5 pt-4 mt-auto">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-[#8F8F91] uppercase tracking-wider font-bold mb-1 flex items-center">
                                                            Investimento Mensal
                                                            <span className="line-through opacity-50 ml-1.5 font-normal text-[10px]">{formatCurrency(basePrice)}</span>
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xl font-black text-[#FF5E00]">{formatCurrency(discountedPrice)}</span>
                                                            <span className="bg-[#FF5E00]/20 text-[#FF5E00] text-[9px] font-black px-1.5 py-0.5 rounded border border-[#FF5E00]/30">-30%</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-2.5 bg-[#FF5E00]/10 rounded-xl text-[#FF5E00] group-hover:bg-[#FF5E00] group-hover:text-[#0A0A0B] transition-colors duration-300">
                                                        <ArrowRight className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                }) : (
                                    <div className="col-span-3 py-10 border border-white/5 bg-[#111113] rounded-[24px] text-center">
                                        <p className="text-[#8F8F91] text-sm">{userLocation ? 'Nenhum painel encontrado em um raio de 50km.' : 'Permita o acesso à localização para ver telões próximos.'}</p>
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

                    {/* BARRA DE PESQUISA INTELIGENTE (MOBILE) */}
                    <div className="px-4 sticky top-0 z-50 pt-[80px] pb-4 bg-[#0A0A0B]/90 backdrop-blur-xl border-b border-white/5">
                        {renderSearchBar(mobileDropdownRef, true)}
                    </div>

                    <div className="px-4 mt-6 mb-6">
                        <div className="bg-gradient-to-br from-[#111113] to-[#FF5E00]/10 border border-[#FF5E00]/20 rounded-[24px] p-5 relative overflow-hidden flex flex-col shadow-xl">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#FF5E00]/20 blur-[50px] rounded-full"></div>
                            <div className="flex justify-between items-center relative z-10 mb-2">
                                <div className="w-[60%]">
                                    <h2 className="text-xl font-black text-white leading-tight mb-2">T3 LED Mídia</h2>
                                    <p className="text-[11px] text-[#8F8F91] leading-relaxed font-medium">
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
                            <div className="snap-start flex-shrink-0 w-28 bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg hover:border-[#FF5E00]/30 transition-colors duration-300">
                                <MonitorPlay className="w-6 h-6 text-[#FF5E00]" />
                                <span className="text-sm font-black text-white">{activePanelsCount > 0 ? activePanelsCount : '+200'}</span>
                                <span className="text-[9px] text-[#8F8F91] uppercase font-bold tracking-wider text-center">Ativos</span>
                            </div>
                            <div className="snap-start flex-shrink-0 w-28 bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg relative overflow-hidden hover:border-[#FF5E00]/30 transition-colors duration-300">
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></div>
                                <BarChart3 className="w-6 h-6 text-[#FF5E00]" />
                                <span className="text-sm font-black text-white">{formattedImpacts !== '0' ? formattedImpacts : '1.5M'}</span>
                                <span className="text-[9px] text-[#8F8F91] uppercase font-bold tracking-wider text-center">Impactos</span>
                            </div>
                            <div className="snap-start flex-shrink-0 w-28 bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg hover:border-[#FF5E00]/30 transition-colors duration-300">
                                <Shield className="w-6 h-6 text-[#FF5E00]" />
                                <span className="text-[10px] font-black text-white text-center leading-tight">Auditoria</span>
                                <span className="text-[9px] text-[#8F8F91] uppercase font-bold tracking-wider text-center">Checking</span>
                            </div>
                        </div>
                    </div>

                    {/* DESTAQUES MOBILE (Mantem layout em card para celular) */}
                    <div className="px-4 mb-8">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-[#FF5E00]" /> Destaques
                                </h3>
                                <p className="text-[11px] text-[#8F8F91]">{hasEnoughFavorites ? 'Seus favoritos' : 'Os pontos mais cobiçados'}</p>
                            </div>
                            <Link to="/mapa" className="text-[11px] font-bold text-[#FF5E00] uppercase tracking-wider">Ver Mapa</Link>
                        </div>

                        <div className="flex gap-4 overflow-x-auto snap-x custom-scrollbar pb-4 -mx-4 px-4">
                            {displayFeaturedPanels.length > 0 ? displayFeaturedPanels.map((panel, idx) => {
                                const isFavorite = favorites.has(panel.id);
                                const basePrice = panel.price || 1500;
                                const discountedPrice = basePrice * 0.70;

                                return (
                                    <Link to={`/servicos?panelId=${panel.id}`} key={panel.id || idx} className="snap-start flex-shrink-0 w-[260px] bg-[#111113] rounded-[24px] overflow-hidden border border-white/10 shadow-lg block hover:border-[#FF5E00]/40 transition-colors duration-300 group">
                                        <div className="h-[160px] relative bg-black">
                                            <img src={panel.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" alt="Painel" />

                                            <button
                                                onClick={(e) => toggleFavorite(e, panel.id)}
                                                className="absolute top-3 right-3 bg-[#0A0A0B]/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 z-10 active:scale-110 transition-transform duration-300"
                                            >
                                                <Heart className={`w-4 h-4 transition-colors duration-300 ${isFavorite ? 'fill-[#FF5E00] text-[#FF5E00]' : 'text-white'}`} />
                                            </button>

                                            <div className="absolute bottom-3 left-3 bg-[#0A0A0B]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                                                <Activity className="w-3 h-3 text-[#FF5E00]" />
                                                <span className="text-[10px] font-black text-white tracking-wider">{panel.impacts || '1.2M'}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-sm text-white line-clamp-1 pr-2 group-hover:text-[#FF5E00] transition-colors duration-300">{panel.name || 'Painel Digital Premium'}</h4>
                                                    <div className="flex items-center gap-1 shrink-0 bg-white/5 px-1.5 py-0.5 rounded text-xs font-bold text-white">
                                                        <Star className="w-3 h-3 fill-[#FF5E00] text-[#FF5E00]" />
                                                        4.9
                                                    </div>
                                                </div>
                                                <p className="text-[11px] text-[#8F8F91] flex items-center gap-1.5 mb-4">
                                                    <MapPin className="w-3 h-3 text-[#FF5E00]" /> {panel.city || 'Goiânia'} - {panel.state || 'GO'}
                                                </p>
                                            </div>
                                            <div className="flex justify-between items-end border-t border-white/5 pt-3 mt-auto">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="text-[9px] text-[#8F8F91] uppercase tracking-wider font-bold">Investimento Mensal</span>
                                                        <span className="bg-[#FF5E00]/20 text-[#FF5E00] text-[8px] font-black px-1 py-0.5 rounded border border-[#FF5E00]/30">-30% ANUAL</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-base font-black text-[#FF5E00]">{formatCurrency(discountedPrice)}</span>
                                                        <span className="text-[9px] text-[#8F8F91] line-through">{formatCurrency(basePrice)}</span>
                                                    </div>
                                                </div>
                                                <div className="p-2 bg-[#FF5E00]/10 rounded-lg text-[#FF5E00]">
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            }) : (
                                [1, 2].map(i => (
                                    <div key={i} className="snap-start flex-shrink-0 w-[260px] bg-[#111113] rounded-[24px] h-[300px] border border-white/5 animate-pulse flex flex-col">
                                        <div className="h-[160px] bg-white/5 w-full" />
                                        <div className="p-4 flex-1 flex flex-col gap-3">
                                            <div className="h-4 bg-white/5 rounded w-3/4" />
                                            <div className="h-3 bg-white/5 rounded w-1/2" />
                                            <div className="mt-auto h-6 bg-white/5 rounded w-1/3" />
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
                                    <MapPin className="w-5 h-5 text-[#FF5E00]" /> Próximos de você
                                </h3>
                                <p className="text-[11px] text-[#8F8F91]">{locationStatus}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {nearbyPanels.length > 0 ? nearbyPanels.map((panel, idx) => {
                                const basePrice = panel.price || 1500;
                                const discountedPrice = basePrice * 0.70;

                                return (
                                    <Link to={`/servicos?panelId=${panel.id}`} key={panel.id || idx} className="flex gap-4 bg-[#111113] p-3 rounded-[20px] border border-white/10 shadow-md items-center relative overflow-hidden hover:border-[#FF5E00]/40 transition-colors duration-300 group">
                                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-black shrink-0 relative">
                                            <img src={panel.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" alt="Painel" />
                                            <div className="absolute top-1 left-1 bg-[#0A0A0B]/80 px-1.5 py-0.5 rounded text-[8px] font-bold text-white backdrop-blur-md">PRO</div>
                                        </div>
                                        <div className="flex-1 min-w-0 py-1">
                                            <h4 className="font-bold text-sm text-white line-clamp-1 mb-1 group-hover:text-[#FF5E00] transition-colors duration-300">{panel.name || 'Circuito Urbano Principal'}</h4>
                                            <p className="text-[11px] text-[#8F8F91] flex items-center gap-1.5 mb-1.5">
                                                <MapPin className="w-3 h-3 text-[#FF5E00]" />
                                                {panel.distance !== Infinity ? `${panel.distance.toFixed(1)} km de distância` : 'Desconhecido'}
                                            </p>
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className="text-[9px] text-[#8F8F91] line-through">{formatCurrency(basePrice)}</span>
                                                <span className="bg-[#FF5E00]/20 text-[#FF5E00] text-[8px] font-black px-1 py-0.5 rounded border border-[#FF5E00]/30">-30% ANUAL</span>
                                            </div>
                                            <span className="text-sm font-black text-[#FF5E00] block">{formatCurrency(discountedPrice)}</span>
                                        </div>
                                    </Link>
                                )
                            }) : (
                                <div className="py-8 border border-white/5 bg-[#111113] rounded-[20px] text-center">
                                    <p className="text-[#8F8F91] text-xs px-4">{userLocation ? 'Nenhum painel próximo.' : 'Ative a localização para ver telões próximos.'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="fixed bottom-[76px] left-4 right-4 z-[90]">
                        <Link to="/servicos">
                            <Button className="w-full flex items-center justify-center gap-2 bg-[#FF5E00] hover:brightness-110 text-[#0A0A0B] font-black py-4 rounded-xl shadow-[0_10px_25px_rgba(255,94,0,0.35)] text-sm transition-all duration-300 active:scale-[0.98]">
                                Solicitar Orçamento
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-2xl border-t border-white/10 z-[100] px-6 py-3 flex justify-between items-center pb-safe">
                        <Link to="/" className="flex flex-col items-center gap-1 text-[#FF5E00]"><Compass className="w-5 h-5" /><span className="text-[9px] font-bold">Explorar</span></Link>
                        <Link to="/mapa" className="flex flex-col items-center gap-1 text-[#8F8F91] hover:text-white transition-colors"><MapPin className="w-5 h-5" /><span className="text-[9px] font-medium">Mapa</span></Link>
                        <Link to="/servicos" className="flex flex-col items-center gap-1 text-[#8F8F91] hover:text-white transition-colors"><MonitorPlay className="w-5 h-5" /><span className="text-[9px] font-medium">Painéis</span></Link>
                        <Link to="/contato" className="flex flex-col items-center gap-1 text-[#8F8F91] hover:text-white transition-colors"><Shield className="w-5 h-5" /><span className="text-[9px] font-medium">Contato</span></Link>
                    </div>
                </div>
            </div>
        </>
    );
}