import { motion, Variants } from 'framer-motion';
import { Target, Eye, BarChart3, ShieldCheck, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';

export function Info() {
    // Tipagem explícita com "Variants" resolve os erros do TypeScript
    const fadeUp: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const staggerContainer: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    return (
        // Fundo escuro absoluto para blindagem do modo claro
        <div className="w-full min-h-[100dvh] bg-[#0A0A0B] overflow-x-hidden selection:bg-[#FF5E00]/30 selection:text-[#FF5E00]">
            
            {/* ========================================================= */}
            {/* HERO SECTION (CINEMÁTICA)                                 */}
            {/* ========================================================= */}
            <div className="relative w-full h-[70vh] md:h-[80vh] flex items-center justify-center pt-20">
                {/* Background Imersivo */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <img 
                        src="/Cidadet3.png" 
                        alt="Goiânia T3" 
                        className="w-full h-full object-cover opacity-40 md:opacity-50" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B]/80 via-transparent to-[#0A0A0B]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-transparent to-[#0A0A0B]" />
                    <div className="absolute inset-0 bg-[#FF5E00]/5 mix-blend-overlay" />
                </div>

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#111113]/80 border border-white/10 backdrop-blur-xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,94,0,0.15)]"
                    >
                        <img src="/t3d 2.png" alt="T3 Icon" className="w-8 md:w-10 h-auto object-contain" />
                    </motion.div>
                    
                    <motion.h1 
                        initial="hidden" animate="visible" variants={fadeUp}
                        className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6"
                    >
                        Muito mais que painéis.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5E00] to-[#ff8c42]">
                            Conectando marcas a pessoas.
                        </span>
                    </motion.h1>
                    
                    <motion.p 
                        initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }}
                        className="text-base md:text-xl text-[#8F8F91] leading-relaxed max-w-2xl font-medium"
                    >
                        A T3 OOH é a empresa de mídia exterior que une tecnologia, dados e os melhores pontos da cidade para garantir que a sua mensagem não passe despercebida.
                    </motion.p>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MANIFESTO E NÚMEROS                                       */}
            {/* ========================================================= */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 py-20 md:py-32">
                <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
                    
                    <motion.div 
                        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
                        className="w-full lg:w-1/2 flex flex-col"
                    >
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#FF5E00] mb-4">A Nossa Essência</h2>
                        <h3 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight tracking-tight">
                            Inteligência de dados aplicada à rua.
                        </h3>
                        <div className="space-y-6 text-[#8F8F91] text-sm md:text-base leading-relaxed">
                            <p>
                                Nascemos com um propósito claro: revolucionar a mídia Digital Out of Home (DOOH) no Centro-Oeste. Não vendemos apenas espaço em telas de LED; nós entregamos <strong className="text-white">inteligência de audiência</strong>.
                            </p>
                            <p>
                                Localizados estrategicamente nos cruzamentos e vias de maior fluxo de Goiânia, nossos painéis garantem impacto visual ininterrupto. Utilizamos tecnologia de ponta para fornecer relatórios de veiculação e estimativas reais de alcance, trazendo a performance do marketing digital para o mundo físico.
                            </p>
                            <p>
                                Seja para branding, lançamento de produtos ou conversão direta, a T3 Mídia e Tecnologia é a parceira definitiva para escalar o alcance da sua marca.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                        className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6"
                    >
                        {/* Cards Glassmorphism Premium */}
                        {[
                            { icon: Eye, title: "Alto Impacto", desc: "Milhões de visualizações estimadas mensalmente em nossos circuitos." },
                            { icon: MapPin, title: "Localização Premium", desc: "Painéis nos pontos de maior fluxo qualificado e engarrafamentos estratégicos." },
                            { icon: BarChart3, title: "Dados e Métricas", desc: "Integração de dados para você saber o alcance exato do seu investimento." },
                            { icon: ShieldCheck, title: "100% Auditável", desc: "Comprovação de entrega de mídia (Checking) rigoroso e transparente." }
                        ].map((item, index) => (
                            <motion.div 
                                key={index} variants={fadeUp}
                                className="bg-[#111113]/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-[24px] hover:border-[#FF5E00]/50 hover:bg-[#111113]/80 transition-all duration-300 group"
                            >
                                <div className="w-12 h-12 bg-[#FF5E00]/10 border border-[#FF5E00]/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <item.icon className="w-6 h-6 text-[#FF5E00]" />
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                                <p className="text-xs text-[#8F8F91] leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                </div>
            </div>

            {/* ========================================================= */}
            {/* CALL TO ACTION (CTA) FINAL                                */}
            {/* ========================================================= */}
            <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="relative z-20 w-full max-w-5xl mx-auto px-6 pb-32"
            >
                <div className="bg-gradient-to-br from-[#111113] to-[#0A0A0B] border border-white/10 rounded-[32px] p-10 md:p-16 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    {/* Efeito de luz de fundo */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#FF5E00]/10 blur-[100px] pointer-events-none" />
                    
                    <Target className="w-12 h-12 text-[#FF5E00] mx-auto mb-6" />
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        Pronto para dominar as ruas?
                    </h2>
                    <p className="text-[#8F8F91] text-sm md:text-base max-w-2xl mx-auto mb-10">
                        Explore nosso mapa interativo para conhecer nossos pontos ou fale agora mesmo com nossa equipe comercial para desenhar a campanha ideal para sua marca.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link to="/mapa" className="w-full sm:w-auto">
                            <Button 
                                size="lg"
                                className="w-full sm:w-auto bg-[#FF5E00] hover:bg-[#e05300] text-[#0A0A0B] font-black border-none uppercase tracking-widest text-xs h-14 rounded-xl shadow-[0_0_20px_rgba(255,94,0,0.3)] transition-all"
                            >
                                Explorar Telões
                            </Button>
                        </Link>
                        <Link to="/contato" className="w-full sm:w-auto">
                            <Button 
                                variant="ghost"
                                size="lg"
                                className="w-full sm:w-auto bg-transparent hover:bg-white/5 border border-white/20 text-white font-bold uppercase tracking-widest text-xs h-14 rounded-xl transition-all"
                                rightIcon={<ArrowRight className="w-4 h-4" />}
                            >
                                Falar com Comercial
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.div>

        </div>
    );
}