import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { Target, Eye, BarChart3, ShieldCheck, MapPin, ArrowRight, Handshake, User, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { api } from '@/lib/axios';

const MOCK_TEAM = [
    { id: '1', name: 'Victor Hugo Dourado', role: 'Sócio-Fundador', bio: 'Focado Em Relacionamento E Expansão Estratégica...', image: '' },
    { id: '2', name: 'João Borges Guerin', role: 'Sócio-Fundador', bio: 'Liderando A Visão Estratégica...', image: '' },
    { id: '3', name: 'Natan Campos', role: 'Sócio-Fundador', bio: 'A Base Técnica Da T3 OOH...', image: '' }
];

export function Info() {
    const [team, setTeam] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInfoData = async () => {
            try {
                const res = await api.get('/institutional');
                
                let fetchedTeam = res.data?.team || [];
                let fetchedBrands = res.data?.brands || [];

                if (typeof fetchedTeam === 'string') {
                    try { fetchedTeam = JSON.parse(fetchedTeam); } catch (e) {}
                }
                if (typeof fetchedBrands === 'string') {
                    try { fetchedBrands = JSON.parse(fetchedBrands); } catch (e) {}
                }

                setTeam(fetchedTeam);
                setBrands(fetchedBrands);

            } catch (error) {
                setTeam(MOCK_TEAM);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInfoData();
    }, []);

    const fadeUp: Variants = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
    };

    const staggerContainer: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    return (
        <main className="w-full min-h-screen bg-[#0A0A0B] overflow-x-hidden selection:bg-[#FF5E00]/30 selection:text-[#FF5E00]">
            
            {/* HERO SECTION */}
            <section className="relative w-full h-[85vh] flex items-center justify-center border-b border-white/5">
                <div className="absolute inset-0 z-0">
                    <img src="/Cidadet3.png" alt="Cidade T3 Goiânia" className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0B]/70 to-[#0A0A0B]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B]/90 via-[#0A0A0B]/40 to-[#0A0A0B]/90" />
                </div>
                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center pt-10">
                    <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
                        Muito Mais Que Painéis.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5E00] to-[#ff8c42]">
                            Conectando Marcas A Pessoas.
                        </span>
                    </motion.h1>
                    <motion.p initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }} className="text-base md:text-xl text-[#8F8F91] leading-relaxed max-w-2xl font-medium">
                        A T3 OOH É A Empresa De Mídia Exterior Que Une Tecnologia, Dados E Os Melhores Pontos Da Cidade Para Garantir Que A Sua Mensagem Não Passe Despercebida.
                    </motion.p>
                </div>
            </section>

            {/* MANIFESTO */}
            <section className="relative z-20 w-full max-w-7xl mx-auto px-6 py-24 md:py-32">
                <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="w-full lg:w-1/2 flex flex-col">
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#FF5E00] mb-4">A Nossa Essência</h2>
                        <h3 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight tracking-tight">Inteligência De Dados Aplicada À Rua.</h3>
                        <div className="space-y-6 text-[#8F8F91] text-sm md:text-base leading-relaxed">
                            <p>Nascemos Com Um Propósito Claro: Revolucionar A Mídia Digital Out Of Home (DOOH) No Centro-Oeste. Não Vendemos Apenas Espaço Em Telas De LED; Nós Entregamos <strong className="text-white">Inteligência De Audiência</strong>.</p>
                            <p>Localizados Estrategicamente Nos Cruzamentos E Vias De Maior Fluxo De Goiânia, Nossos Painéis Garantem Impacto Visual Ininterrupto.</p>
                        </div>
                    </motion.div>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer} className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        {[
                            { icon: Eye, title: "Alto Impacto", desc: "Milhões De Visualizações Estimadas Mensalmente Em Nossos Circuitos." },
                            { icon: MapPin, title: "Localização Premium", desc: "Painéis Nos Pontos De Maior Fluxo Qualificado E Engarrafamentos Estratégicos." },
                            { icon: BarChart3, title: "Dados E Métricas", desc: "Integração De Dados Para Você Saber O Alcance Exato Do Seu Investimento." },
                            { icon: ShieldCheck, title: "100% Auditável", desc: "Comprovação De Entrega De Mídia (Checking) Rigoroso E Transparente." }
                        ].map((item, index) => (
                            <motion.div key={index} variants={fadeUp} className="bg-[#111113] border border-white/5 p-6 md:p-8 hover:border-[#FF5E00]/40 transition-colors duration-300 rounded-sm">
                                <div className="w-12 h-12 bg-[#FF5E00]/10 flex items-center justify-center mb-6 rounded-sm">
                                    <item.icon className="w-6 h-6 text-[#FF5E00]" />
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                                <p className="text-xs text-[#8F8F91] leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* LIDERANÇA / EQUIPE */}
            {team.length > 0 && (
                <section className="relative z-20 w-full bg-[#050505] border-y border-white/5 py-24 md:py-32">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-sm font-black uppercase tracking-widest text-[#FF5E00] mb-4">A Liderança</h2>
                            <h3 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Quem Faz Acontecer</h3>
                        </div>

                        {!isLoading && (
                            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {team.map((member, i) => (
                                    <motion.div key={member.id || i} variants={fadeUp} className="flex flex-col bg-[#111113] border border-white/5 p-6 hover:border-[#FF5E00]/30 transition-colors duration-300 rounded-sm">
                                        <div className="w-full aspect-square bg-[#0A0A0B] mb-6 overflow-hidden relative flex items-center justify-center rounded-sm border border-white/5">
                                            {member.image ? (
                                                <img 
                                                    src={member.image} 
                                                    alt={`Foto ${member.name}`} 
                                                    // REMOVIDO: filter grayscale
                                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement?.classList.add('show-fallback');
                                                    }} 
                                                />
                                            ) : (
                                                <User className="w-12 h-12 text-[#8F8F91] opacity-30" />
                                            )}
                                            
                                            <div className="hidden absolute inset-0 items-center justify-center fallback-icon">
                                                <User className="w-12 h-12 text-[#8F8F91] opacity-30" />
                                            </div>
                                        </div>
                                        <h4 className="text-xl font-bold text-white mb-1">{member.name}</h4>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#FF5E00] mb-4">{member.role}</p>
                                        <p className="text-sm text-[#8F8F91] leading-relaxed">{member.bio}</p>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </section>
            )}

            {/* NOSSOS PARCEIROS */}
            {brands.length > 0 && (
                <section className="relative z-20 w-full max-w-7xl mx-auto px-6 py-24 md:py-32">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#FF5E00] mb-4 flex items-center justify-center gap-2">
                            <Handshake className="w-4 h-4" /> Ecossistema
                        </h2>
                        <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Nossos Parceiros Estratégicos</h3>
                        <p className="text-[#8F8F91] text-sm mt-4 max-w-2xl mx-auto">Grandes Marcas Que Confiam Em Nossa Entrega.</p>
                    </div>

                    {!isLoading && (
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {brands.map((brand, i) => (
                                // REMOVIDO: filter grayscale, ajustada a opacidade para ficar colorido e vibrante
                                <motion.div key={brand.id || i} variants={fadeUp} className="h-28 bg-[#111113] border border-white/5 flex items-center justify-center opacity-90 hover:opacity-100 hover:border-[#FF5E00]/30 transition-all duration-300 rounded-sm relative overflow-hidden group">
                                    {brand.logo ? (
                                        <img 
                                            src={brand.logo} 
                                            alt={brand.name} 
                                            className="max-h-12 max-w-[120px] object-contain relative z-10 transition-transform duration-300 group-hover:scale-110" 
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.classList.add('show-fallback');
                                            }} 
                                        />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-[#8F8F91] opacity-30" />
                                    )}

                                    <div className="hidden absolute inset-0 items-center justify-center fallback-icon flex-col gap-1">
                                        <ImageIcon className="w-5 h-5 text-[#8F8F91] opacity-30" />
                                        <span className="text-[9px] text-[#8F8F91] font-bold uppercase tracking-widest opacity-40 truncate px-2 text-center w-full">{brand.name}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </section>
            )}

            {/* CTA FINAL */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="relative z-20 w-full max-w-5xl mx-auto px-6 pb-32">
                <div className="bg-[#050505] border border-white/10 p-10 md:p-16 text-center shadow-2xl relative overflow-hidden rounded-sm">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[#FF5E00] to-transparent opacity-50" />
                    <Target className="w-12 h-12 text-[#FF5E00] mx-auto mb-6" />
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Pronto Para Dominar As Ruas?</h2>
                    
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
                        <Link to="/mapa" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto bg-[#FF5E00] hover:bg-[#e05300] text-[#0A0A0B] font-black border-none uppercase tracking-widest text-xs h-14 rounded-sm transition-all">
                                Explorar Telões
                            </Button>
                        </Link>
                        <Link to="/contato" className="w-full sm:w-auto">
                            <Button variant="ghost" size="lg" className="w-full sm:w-auto bg-transparent hover:bg-white/5 border border-white/20 text-white font-bold uppercase tracking-widest text-xs h-14 rounded-sm transition-all" rightIcon={<ArrowRight className="w-4 h-4" />}>
                                Falar Com Comercial
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.section>

            <style>{`
                .show-fallback .fallback-icon {
                    display: flex !important;
                }
            `}</style>
        </main>
    );
}