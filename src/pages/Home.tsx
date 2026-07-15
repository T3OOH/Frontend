import { ArrowRight, MapPin, BarChart3, Shield, MonitorPlay, Activity } from 'lucide-react';
import { Button } from '@/components/Button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Home() {
    return (
        <div className="relative w-full min-h-[calc(100vh-5rem)] bg-[#0A0A0B] overflow-hidden flex items-center pt-10 pb-16">

            {/* --- EFEITOS DE FUNDO (PROFUNDIDADE E TEXTURA) --- */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-neon/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
            <div className="absolute top-1/2 right-0 w-[30rem] h-[30rem] bg-brand-neon/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-orange-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '6s' }} />

            {/* --- CONTEÚDO PRINCIPAL --- */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">

                {/* COLUNA ESQUERDA - Logo 3D, Copy e CTAs */}
                <div className="flex flex-col items-start text-left">
                    
                    {/* Imagem 3D Centralizada e Aumentada */}
                    <div className="w-full max-w-xl flex justify-center mb-8 relative perspective-1000">
                        {/* Glow de fundo redimensionado para acompanhar a nova logo */}
                        <motion.div 
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-brand-neon rounded-full blur-[120px] opacity-20 pointer-events-none"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        
                        <motion.img 
                            src="/t3d 2.png" 
                            alt="Logo T3 3D" 
                            className="w-80 h-80 md:w-[420px] md:h-[420px] object-contain mix-blend-screen relative z-10 drop-shadow-[0_0_40px_rgba(255,94,0,0.25)] cursor-pointer"
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                repeatDelay: 5,
                                ease: [0.4, 0, 0.2, 1]
                            }}
                            style={{ transformStyle: 'preserve-3d' }}
                        />
                    </div>

                    <p className="text-lg md:text-xl text-brand-muted max-w-xl mb-10 font-normal leading-relaxed relative z-20 ">
                        <strong>T3 LED</strong>  sua empresa com inteligência por trás das campanhas em mídia digital outdoor. Gerencie, anuncie e acompanhe sua veiculação em uma rede de painéis que cresce em Goiânia, no<strong className="text-brand-text font-semibold"> Centro-Oeste e em todo o país</strong>.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto relative z-20">
                        <Link to="/servicos" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto shadow-[0_0_20px_rgba(255,94,0,0.25)] hover:shadow-[0_0_30px_rgba(255,94,0,0.4)] transition-all">
                                Solicitar Orçamento
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <Link to="/mapa" className="w-full sm:w-auto">
                            <Button size="lg" variant="secondary" className="w-full sm:w-auto border-brand-border/60 hover:bg-brand-surface/80 transition-all">
                                <MapPin className="w-5 h-5 mr-2" />
                                Explorar Mapa
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* COLUNA DIREITA - Layout de Dashboards Flutuantes */}
                <div className="relative hidden lg:block h-[500px]">
                    
                    <div className="absolute inset-0 border-l border-brand-neon/20 ml-[40px] border-dashed pointer-events-none" />

                    {/* Widget 1: Painéis Ativos */}
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

                    {/* Widget 2: Impactos Diários */}
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

                    {/* Widget 3: Auditoria */}
                    <div className="absolute bottom-10 left-12 w-[340px] glass-panel p-5 rounded-xl border border-brand-border/60 hover:border-brand-neon/50 bg-brand-surface/40 backdrop-blur-lg transform hover:-translate-y-2 transition-all duration-300 shadow-2xl group cursor-default">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-neon/10 rounded-lg border border-brand-neon/20 group-hover:border-brand-neon/50 transition-colors">
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
        </div>
    );
}