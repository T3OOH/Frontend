import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { Target, Eye, BarChart3, ShieldCheck, MapPin, ArrowRight, Handshake, User, Image as ImageIcon, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { api } from '@/lib/axios';

/**
 * Data fallback constants to ensure UI consistency during API hydration delays or failures.
 */
const MOCK_TEAM = [
    { id: '1', name: 'Victor Hugo Dourado', role: 'Sócio-Fundador', bio: 'Focado em relacionamento e expansão estratégica, conectando marcas ao nosso circuito.', image: '' },
    { id: '2', name: 'João Borges Guerin', role: 'Sócio-Fundador', bio: 'Liderando a visão estratégica e inteligência operacional das campanhas.', image: '' },
    { id: '3', name: 'Natan Campos', role: 'Sócio-Fundador', bio: 'Direcionando a tecnologia, inovação e o desenvolvimento de sistemas para nossa rede.', image: '' }
];

/**
 * Info Component
 * Renders the institutional "About Us" page.
 * 
 * Architecture & UI/UX Strategy:
 * - Implements a premium B2B layout with distinct hierarchical depth (using solid backgrounds and precise borders).
 * - Utilizes framer-motion for orchestrated mounting animations to prevent layout shifts.
 * - Handles asynchronous data hydration from the CMS/API with graceful fallbacks.
 */
export function Info() {
    const [team, setTeam] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Component Mount Lifecycle: Data Hydration
     * Fetches dynamic content (team members, partner brands) from the backend.
     * Incorporates JSON parsing safeguards to handle varying database serialization formats.
     */
    useEffect(() => {
        const fetchInfoData = async () => {
            try {
                const res = await api.get('/institutional');
                
                let fetchedTeam = res.data?.team || [];
                let fetchedBrands = res.data?.brands || [];

                // Serialization safeguard: Parse stringified JSON arrays if necessary
                if (typeof fetchedTeam === 'string') {
                    try { fetchedTeam = JSON.parse(fetchedTeam); } catch (e) { console.error("Team parsing error", e); }
                }
                if (typeof fetchedBrands === 'string') {
                    try { fetchedBrands = JSON.parse(fetchedBrands); } catch (e) { console.error("Brands parsing error", e); }
                }

                setTeam(fetchedTeam);
                setBrands(fetchedBrands);

            } catch (error) {
                console.warn("API hydration failed, utilizing fallback dataset.", error);
                setTeam(MOCK_TEAM);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInfoData();
    }, []);

    /**
     * Animation Variants for Framer Motion.
     * Engineered to provide a smooth, staggered entrance that respects layout flow.
     */
    const fadeUp: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
    };

    const staggerContainer: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    return (
        <main className="w-full min-h-screen bg-[#0A0A0B] overflow-x-hidden selection:bg-[#FF5E00]/30 selection:text-[#FF5E00]">
            
            {/* ========================================================= */}
            {/* HERO SECTION                                              */}
            {/* Redesigned for a high-end corporate aesthetic.            */}
            {/* Removed muddy overlays; implemented sharp typography.     */}
            {/* ========================================================= */}
            <section className="relative w-full h-[80vh] min-h-[600px] flex items-center border-b border-white/5 overflow-hidden">
                {/* Background Treatment: Subtle image with strong gradient masking for text legibility */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/Cidadet3.png" 
                        alt="Cidade T3 Goiânia" 
                        className="w-full h-full object-cover opacity-20 mix-blend-luminosity" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-[#0A0A0B]/90 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-[#0A0A0B]/50" />
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-start mt-12">
                    <motion.div 
                        initial="hidden" animate="visible" variants={fadeUp}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-white/5 border border-white/10 mb-8"
                    >
                        <Building2 className="w-4 h-4 text-[#FF5E00]" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Sobre a T3 OOH</span>
                    </motion.div>

                    <motion.h1 
                        initial="hidden" animate="visible" variants={fadeUp} 
                        className="text-5xl md:text-6xl lg:text-8xl font-black text-white tracking-tighter leading-[1.05] mb-6 max-w-4xl"
                    >
                        Muito mais que painéis.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5E00] to-[#ff8c42]">
                            Conectando marcas a pessoas.
                        </span>
                    </motion.h1>
                    
                    <motion.p 
                        initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }} 
                        className="text-lg md:text-xl text-[#8F8F91] leading-relaxed max-w-2xl font-medium border-l-2 border-[#FF5E00] pl-6 ml-1"
                    >
                        Somos a empresa de mídia exterior que une tecnologia, auditoria de dados e os melhores pontos de Goiânia para garantir que o seu investimento gere conversão e lembrança de marca.
                    </motion.p>
                </div>
            </section>

            {/* ========================================================= */}
            {/* MANIFESTO & CORE VALUES                                   */}
            {/* ========================================================= */}
            <section className="relative z-20 w-full max-w-7xl mx-auto px-6 py-24 md:py-32">
                <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
                    
                    {/* Text Column */}
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="w-full lg:w-1/2 flex flex-col">
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-[#FF5E00] mb-4">A Nossa Essência</h2>
                        <h3 className="text-3xl md:text-5xl font-black text-white mb-8 leading-tight tracking-tight">Inteligência de dados aplicada à rua.</h3>
                        <div className="space-y-6 text-[#8F8F91] text-sm md:text-base leading-relaxed">
                            <p>
                                Nascemos com um propósito claro: revolucionar a mídia Digital Out Of Home (DOOH) no Centro-Oeste. Não vendemos apenas espaço em telas de LED; nós entregamos <strong className="text-white font-bold">inteligência de audiência</strong>.
                            </p>
                            <p>
                                Localizados estrategicamente nos cruzamentos e vias de maior fluxo, nossos painéis garantem impacto visual ininterrupto. Utilizamos tecnologia para fornecer relatórios de veiculação e estimativas reais de alcance, trazendo a precisão do marketing digital para o mundo físico.
                            </p>
                        </div>
                    </motion.div>

                    {/* Value Cards Grid */}
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer} className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { icon: Eye, title: "Alto Impacto", desc: "Visualizações massivas nos principais circuitos da cidade." },
                            { icon: MapPin, title: "Locais Premium", desc: "Pontos de maior fluxo qualificado e engarrafamentos." },
                            { icon: BarChart3, title: "Métricas Reais", desc: "Integração de dados para calcular o alcance do investimento." },
                            { icon: ShieldCheck, title: "Auditoria Full", desc: "Checking rigoroso com comprovação fotográfica de entrega." }
                        ].map((item, index) => (
                            <motion.div 
                                key={index} 
                                variants={fadeUp} 
                                className="bg-[#111113] border border-white/5 p-6 md:p-8 hover:border-[#FF5E00]/30 transition-colors duration-300 rounded-xl shadow-lg"
                            >
                                <div className="w-10 h-10 bg-[#FF5E00]/10 flex items-center justify-center mb-6 rounded-lg">
                                    <item.icon className="w-5 h-5 text-[#FF5E00]" />
                                </div>
                                <h4 className="text-base font-bold text-white mb-2 tracking-wide">{item.title}</h4>
                                <p className="text-[13px] text-[#8F8F91] leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ========================================================= */}
            {/* TEAM SECTION                                              */}
            {/* ========================================================= */}
            {team.length > 0 && (
                <section className="relative z-20 w-full bg-[#111113] border-y border-white/5 py-24 md:py-32">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                            <div>
                                <h2 className="text-[11px] font-black uppercase tracking-widest text-[#FF5E00] mb-4">Liderança Executiva</h2>
                                <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight">Quem faz acontecer</h3>
                            </div>
                            <p className="text-sm text-[#8F8F91] max-w-sm md:text-right">
                                Profissionais dedicados a transformar a publicidade exterior em resultados reais.
                            </p>
                        </div>

                        {!isLoading && (
                            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                                {team.map((member, i) => (
                                    <motion.div 
                                        key={member.id || i} 
                                        variants={fadeUp} 
                                        className="flex flex-col bg-[#0A0A0B] border border-white/5 rounded-2xl overflow-hidden hover:border-[#FF5E00]/30 transition-all duration-300 shadow-xl group"
                                    >
                                        <div className="w-full aspect-square bg-[#111113] overflow-hidden relative flex items-center justify-center border-b border-white/5">
                                            {member.image ? (
                                                <img 
                                                    src={member.image} 
                                                    alt={`Foto ${member.name}`} 
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement?.classList.add('show-fallback');
                                                    }} 
                                                />
                                            ) : (
                                                <User className="w-12 h-12 text-[#8F8F91] opacity-20" />
                                            )}
                                            
                                            <div className="hidden absolute inset-0 items-center justify-center fallback-icon">
                                                <User className="w-12 h-12 text-[#8F8F91] opacity-20" />
                                            </div>
                                        </div>
                                        
                                        <div className="p-6 md:p-8 flex flex-col flex-1">
                                            <h4 className="text-xl font-bold text-white mb-1 group-hover:text-[#FF5E00] transition-colors">{member.name}</h4>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F91] mb-4">{member.role}</p>
                                            <p className="text-[13px] text-[#8F8F91] leading-relaxed mt-auto border-t border-white/5 pt-4">{member.bio}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </section>
            )}

            {/* ========================================================= */}
            {/* PARTNER BRANDS SECTION                                    */}
            {/* ========================================================= */}
            {brands.length > 0 && (
                <section className="relative z-20 w-full max-w-7xl mx-auto px-6 py-24 md:py-32">
                    <div className="text-center mb-16">
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-[#FF5E00] mb-4 flex items-center justify-center gap-2">
                            <Handshake className="w-4 h-4" /> Ecossistema
                        </h2>
                        <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">Parceiros Estratégicos</h3>
                        <p className="text-[#8F8F91] text-sm max-w-2xl mx-auto font-medium">
                            Marcas que confiam em nossa infraestrutura tecnológica para escalar seus negócios.
                        </p>
                    </div>

                    {!isLoading && (
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {brands.map((brand, i) => (
                                <motion.div 
                                    key={brand.id || i} 
                                    variants={fadeUp} 
                                    className="h-32 bg-[#111113] border border-white/5 flex items-center justify-center hover:bg-white/5 transition-all duration-300 rounded-xl relative overflow-hidden group shadow-lg"
                                >
                                    {brand.logo ? (
                                        <img 
                                            src={brand.logo} 
                                            alt={brand.name} 
                                            // Implementação: w-full h-full object-cover para preenchimento total do box
                                            className="w-full h-full object-cover relative z-10 transition-transform duration-300 group-hover:scale-105 opacity-80 group-hover:opacity-100 filter grayscale group-hover:grayscale-0" 
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.classList.add('show-fallback');
                                            }} 
                                        />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-[#8F8F91] opacity-20" />
                                    )}

                                    {/* Fallback rendering for broken image links */}
                                    <div className="hidden absolute inset-0 items-center justify-center fallback-icon flex-col gap-1">
                                        <ImageIcon className="w-5 h-5 text-[#8F8F91] opacity-20" />
                                        <span className="text-[9px] text-[#8F8F91] font-bold uppercase tracking-widest opacity-40 truncate px-2 text-center w-full">{brand.name}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </section>
            )}

            {/* ========================================================= */}
            {/* CALL TO ACTION                                            */}
            {/* ========================================================= */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="relative z-20 w-full max-w-5xl mx-auto px-6 pb-32">
                <div className="bg-[#111113] border border-white/10 p-10 md:p-16 text-center shadow-2xl relative overflow-hidden rounded-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF5E00] to-transparent opacity-50" />
                    
                    <Target className="w-12 h-12 text-[#FF5E00] mx-auto mb-6" />
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Pronto para dominar as ruas?</h2>
                    
                    <p className="text-[#8F8F91] text-sm md:text-base max-w-2xl mx-auto mb-10 font-medium">
                        Explore nosso inventário interativo ou fale diretamente com nossa equipe comercial para estruturar a campanha ideal para o seu negócio.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link to="/mapa" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto bg-[#FF5E00] hover:bg-[#e05300] text-[#0A0A0B] font-black border-none uppercase tracking-widest text-[11px] h-14 rounded-xl transition-all shadow-[0_10px_30px_rgba(255,94,0,0.2)]">
                                Explorar Telões
                            </Button>
                        </Link>
                        <Link to="/contato" className="w-full sm:w-auto">
                            <Button variant="ghost" size="lg" className="w-full sm:w-auto bg-[#0A0A0B] hover:bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-[11px] h-14 rounded-xl transition-all" rightIcon={<ArrowRight className="w-4 h-4 text-[#FF5E00]" />}>
                                Falar com Comercial
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.section>

            {/* CSS injection for fallback image handling */}
            <style>{`
                .show-fallback .fallback-icon {
                    display: flex !important;
                }
            `}</style>
        </main>
    );
}