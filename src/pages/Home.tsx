import { useState, useEffect } from 'react';
import { 
    ArrowRight, MapPin, BarChart3, Shield, MonitorPlay, Activity, 
    Search, Filter, Heart, Star, Compass, Flame 
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { panelsService } from '@/services/panels.service';

export function Home() {
    // Estado para alimentar as seções de marketplace no mobile
    const [featuredPanels, setFeaturedPanels] = useState<any[]>([]);

    useEffect(() => {
        const fetchPanels = async () => {
            try {
                const data = await panelsService.getAllPanels();
                // Pegamos uma amostra para as seções "Destaques" e "Próximos"
                if (data && data.length > 0) {
                    setFeaturedPanels(data.slice(0, 5));
                }
            } catch (error) {
                console.error("Erro ao carregar painéis para destaque", error);
            }
        };
        fetchPanels();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    return (
        <div className="relative w-full min-h-[calc(100vh-5rem)] bg-[#0A0A0B] overflow-hidden lg:flex lg:items-center pt-0 lg:pt-10 pb-0 lg:pb-16">

            {/* --- EFEITOS DE FUNDO GLOBAIS --- */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-neon/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
            <div className="absolute top-1/2 right-0 w-[30rem] h-[30rem] bg-brand-neon/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-orange-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '6s' }} />

            {/* ========================================================= */}
            {/* DESKTOP LAYOUT (100% PRESERVADO)                            */}
            {/* ========================================================= */}
            <div className="hidden lg:grid relative z-10 max-w-7xl mx-auto px-6 w-full grid-cols-2 gap-8 items-center">
                
                {/* COLUNA ESQUERDA - Logo 3D, Copy e CTAs */}
                <div className="flex flex-col items-start text-left">
                    <div className="w-full max-w-xl flex justify-center mb-8 relative perspective-1000">
                        <motion.div 
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-neon rounded-full blur-[120px] opacity-20 pointer-events-none"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.img 
                            src="/t3d 2.png" 
                            alt="Logo T3 3D" 
                            loading="eager"
                            className="w-[420px] h-[420px] object-contain mix-blend-screen relative z-10 drop-shadow-[0_0_40px_rgba(255,94,0,0.25)] cursor-pointer"
                            transition={{ duration: 8, repeat: Infinity, repeatDelay: 5, ease: [0.4, 0, 0.2, 1] }}
                            style={{ transformStyle: 'preserve-3d' }}
                        />
                    </div>

                    <p className="text-xl text-brand-muted max-w-xl mb-10 font-normal leading-relaxed relative z-20">
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

                {/* COLUNA DIREITA - Dashboards Flutuantes */}
                <div className="relative block w-full h-[500px]">
                    <div className="absolute inset-0 border-l border-brand-neon/20 ml-[40px] border-dashed pointer-events-none" />

                    <div className="absolute top-4 left-0 w-64 glass-panel p-6 rounded-xl border border-brand-border/60 hover:border-brand-neon/50 bg-brand-surface/40 backdrop-blur-lg transform hover:-translate-y-2 transition-all duration-300 shadow-2xl group cursor-default">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-brand-neon/10 rounded-lg group-hover:bg-brand-neon/20 transition-colors">
                                <MonitorPlay className="w-6 h-6 text-brand-neon" />
                            </div>
                            <Activity className="w-4 h-4 text-brand-muted/50 group-hover:text-brand-neon/70 transition-colors" />
                        </div>
                        <h3 className="text-4xl font-black text-brand-text mb-1 tracking-tight group-hover:text-brand-neon transition-colors">+200</h3>
                        <p className="text-xs font-medium text-brand-muted uppercase tracking-wider">Painéis Ativos</p>
                    </div>

                    <div className="absolute top-32 right-4 w-72 glass-panel p-6 rounded-xl border border-brand-border/60 hover:border-brand-neon/50 bg-brand-surface/40 backdrop-blur-lg transform hover:-translate-y-2 transition-all duration-300 shadow-2xl group cursor-default z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-brand-neon/10 rounded-lg group-hover:bg-brand-neon/20 transition-colors">
                                <BarChart3 className="w-6 h-6 text-brand-neon" />
                            </div>
                            <div className="flex items-center gap-1.5 bg-brand-black/50 px-2 py-1 rounded-md border border-brand-border">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Live</span>
                            </div>
                        </div>
                        <h3 className="text-4xl font-black text-brand-text mb-1 tracking-tight group-hover:text-brand-neon transition-colors">1.5M</h3>
                        <p className="text-xs font-medium text-brand-muted uppercase tracking-wider">Impactos Diários</p>
                        
                        <div className="mt-5 flex items-end gap-1.5 h-10 opacity-60">
                            <div className="w-full bg-brand-neon/20 rounded-t-sm h-[40%] group-hover:h-[60%] transition-all duration-500 delay-75" />
                            <div className="w-full bg-brand-neon/40 rounded-t-sm h-[60%] group-hover:h-[80%] transition-all duration-500 delay-100" />
                            <div className="w-full bg-brand-neon/60 rounded-t-sm h-[30%] group-hover:h-[50%] transition-all duration-500 delay-150" />
                            <div className="w-full bg-brand-neon/80 rounded-t-sm h-[80%] group-hover:h-[100%] transition-all duration-500 delay-200" />
                            <div className="w-full bg-brand-neon rounded-t-sm h-[100%] group-hover:h-[90%] transition-all duration-500 delay-300" />
                        </div>
                    </div>

                    <div className="absolute bottom-10 left-12 w-[340px] glass-panel p-5 rounded-xl border border-brand-border/60 hover:border-brand-neon/50 bg-brand-surface/40 backdrop-blur-lg transform hover:-translate-y-2 transition-all duration-300 shadow-2xl group cursor-default">
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
            {/* MOBILE LAYOUT (UX MARKETPLACE / APPS MODERNOS)              */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col relative z-20 pb-36 pt-4 w-full">

                {/* 1. APP HEADER / BARRA DE PESQUISA */}
                <div className="px-4 sticky top-0 z-50 pt-2 pb-4 bg-[#0A0A0B]/90 backdrop-blur-xl border-b border-white/5">
                    <Link to="/mapa" className="flex items-center justify-between bg-[#111113] border border-brand-border/40 rounded-full pl-4 pr-2 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
                        <div className="flex items-center gap-3">
                            <Search className="w-5 h-5 text-brand-neon" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white leading-tight">Para onde quer anunciar?</span>
                                <span className="text-[10px] text-brand-muted">Goiânia • Impacto Diário</span>
                            </div>
                        </div>
                        <div className="p-2 bg-[#1A1A1D] rounded-full border border-brand-border/30">
                            <Filter className="w-4 h-4 text-brand-muted" />
                        </div>
                    </Link>
                </div>

                {/* 2. BANNER PRINCIPAL (Hero Section) */}
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

                {/* 3. CATEGORIAS (Scroll Horizontal) */}
                <div className="px-4 mb-8">
                    <div className="flex gap-3 overflow-x-auto snap-x custom-scrollbar pb-2 -mx-4 px-4">
                        <div className="snap-start flex-shrink-0 w-28 bg-[#111113] border border-brand-border/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
                            <MonitorPlay className="w-6 h-6 text-brand-neon" />
                            <span className="text-sm font-black text-white">+200</span>
                            <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wider text-center">Ativos</span>
                        </div>
                        <div className="snap-start flex-shrink-0 w-28 bg-[#111113] border border-brand-border/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg relative overflow-hidden">
                            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <BarChart3 className="w-6 h-6 text-brand-neon" />
                            <span className="text-sm font-black text-white">1.5M</span>
                            <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wider text-center">Impactos</span>
                        </div>
                        <div className="snap-start flex-shrink-0 w-28 bg-[#111113] border border-brand-border/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg">
                            <Shield className="w-6 h-6 text-brand-neon" />
                            <span className="text-[10px] font-black text-white text-center leading-tight">Auditoria</span>
                            <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wider text-center">IA</span>
                        </div>
                    </div>
                </div>

                {/* 4. PRODUTOS / ANÚNCIOS (Destaques Premium) */}
                <div className="px-4 mb-8">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                <Flame className="w-5 h-5 text-brand-neon" /> Destaques
                            </h3>
                            <p className="text-[11px] text-brand-muted">Os pontos mais cobiçados</p>
                        </div>
                        <Link to="/mapa" className="text-[11px] font-bold text-brand-neon uppercase tracking-wider">Ver Mapa</Link>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto snap-x custom-scrollbar pb-4 -mx-4 px-4">
                        {featuredPanels.length > 0 ? featuredPanels.slice(0, 3).map((panel, idx) => (
                            <Link to={`/servicos`} key={idx} className="snap-start flex-shrink-0 w-[260px] bg-[#111113] rounded-[20px] overflow-hidden border border-brand-border/20 shadow-lg block">
                                <div className="h-[160px] relative bg-black">
                                    <img src={panel.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover" alt="Painel" />
                                    <div className="absolute top-3 right-3 bg-[#0A0A0B]/60 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                                        <Heart className="w-4 h-4 text-white" />
                                    </div>
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
                        )) : (
                            /* Skeletons de Carregamento (UX) */
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

                {/* 5. PRÓXIMOS DE VOCÊ (Lista Vertical) */}
                <div className="px-4 mb-4">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-brand-neon" /> Próximos de você
                            </h3>
                            <p className="text-[11px] text-brand-muted">Descubra os melhores pontos na sua região</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        {featuredPanels.slice(2, 5).map((panel, idx) => (
                            <Link to={`/servicos`} key={idx} className="flex gap-4 bg-[#111113] p-3 rounded-[16px] border border-brand-border/20 shadow-md items-center relative overflow-hidden">
                                <div className="w-24 h-24 rounded-xl overflow-hidden bg-black shrink-0 relative">
                                    <img src={panel.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover" alt="Painel" />
                                    <div className="absolute top-1 left-1 bg-[#0A0A0B]/80 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">PRO</div>
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                    <h4 className="font-bold text-sm text-white line-clamp-1 mb-1">{panel.name || 'Circuito Urbano Principal'}</h4>
                                    <p className="text-[11px] text-brand-muted flex items-center gap-1.5 mb-2">
                                        <MapPin className="w-3 h-3 text-brand-neon" /> 2.5 km de distância
                                    </p>
                                    <span className="text-sm font-black text-brand-neon block">{formatCurrency(panel.price || 1500)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* 6. CTA FLUTUANTE ACIMA DO BOTTOM NAV */}
                <div className="fixed bottom-[76px] left-4 right-4 z-[90]">
                    <Link to="/servicos">
                        <Button className="w-full bg-brand-neon text-[#0A0A0B] font-black py-4 rounded-2xl shadow-[0_10px_25px_rgba(255,94,0,0.35)] text-sm flex justify-center items-center gap-2">
                            Solicitar Orçamento
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>

                {/* 7. BOTTOM NAVIGATION NATIVA (Marketplace Pattern) */}
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