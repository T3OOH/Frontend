import { motion, Variants } from 'framer-motion';
import { Target, Eye, BarChart3, ShieldCheck, MapPin, ArrowRight, Handshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';

export function Info() {
    // Variantes otimizadas e blindadas contra erros de montagem do framer-motion
    const fadeUp: Variants = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
    };

    const staggerContainer: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    return (
        <main className="w-full min-h-screen bg-[#0A0A0B] overflow-x-hidden selection:bg-[#FF5E00]/30 selection:text-[#FF5E00]">
            
            {/* ========================================================= */}
            {/* HERO SECTION (CINEMÁTICA E CLÁSSICA)                      */}
            {/* ========================================================= */}
            <section className="relative w-full h-[85vh] flex items-center justify-center border-b border-white/5">
                {/* Background da Cidade com Gradiente Escurecendo */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/Cidadet3.png" 
                        alt="Cidade T3 Goiânia" 
                        className="w-full h-full object-cover opacity-50" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0B]/70 to-[#0A0A0B]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B]/90 via-[#0A0A0B]/40 to-[#0A0A0B]/90" />
                </div>

                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center pt-10">
                    
                    
                    <motion.h1 
                        initial="hidden" animate="visible" variants={fadeUp}
                        className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6"
                    >
                        Muito Mais Que Painéis.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5E00] to-[#ff8c42]">
                            Conectando Marcas A Pessoas.
                        </span>
                    </motion.h1>
                    
                    <motion.p 
                        initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }}
                        className="text-base md:text-xl text-[#8F8F91] leading-relaxed max-w-2xl font-medium"
                    >
                        A T3 OOH É A Empresa De Mídia Exterior Que Une Tecnologia, Dados E Os Melhores Pontos Da Cidade Para Garantir Que A Sua Mensagem Não Passe Despercebida.
                    </motion.p>
                </div>
            </section>

            {/* ========================================================= */}
            {/* MANIFESTO E DADOS CORPORATIVOS                            */}
            {/* ========================================================= */}
            <section className="relative z-20 w-full max-w-7xl mx-auto px-6 py-24 md:py-32">
                <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
                    
                    <motion.div 
                        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp}
                        className="w-full lg:w-1/2 flex flex-col"
                    >
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#FF5E00] mb-4">A Nossa Essência</h2>
                        <h3 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight tracking-tight">
                            Inteligência De Dados Aplicada À Rua.
                        </h3>
                        <div className="space-y-6 text-[#8F8F91] text-sm md:text-base leading-relaxed">
                            <p>
                                Nascemos Com Um Propósito Claro: Revolucionar A Mídia Digital Out Of Home (DOOH) No Centro-Oeste. Não Vendemos Apenas Espaço Em Telas De LED; Nós Entregamos <strong className="text-white">Inteligência De Audiência</strong>.
                            </p>
                            <p>
                                Localizados Estrategicamente Nos Cruzamentos E Vias De Maior Fluxo De Goiânia, Nossos Painéis Garantem Impacto Visual Ininterrupto. Utilizamos Tecnologia De Ponta Para Fornecer Relatórios De Veiculação E Estimativas Reais De Alcance, Trazendo A Performance Do Marketing Digital Para O Mundo Físico.
                            </p>
                            <p>
                                Seja Para Branding, Lançamento De Produtos Ou Conversão Direta, A T3 Mídia E Tecnologia É A Parceira Definitiva Para Escalar O Alcance Da Sua Marca.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer}
                        className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6"
                    >
                        {[
                            { icon: Eye, title: "Alto Impacto", desc: "Milhões De Visualizações Estimadas Mensalmente Em Nossos Circuitos." },
                            { icon: MapPin, title: "Localização Premium", desc: "Painéis Nos Pontos De Maior Fluxo Qualificado E Engarrafamentos Estratégicos." },
                            { icon: BarChart3, title: "Dados E Métricas", desc: "Integração De Dados Para Você Saber O Alcance Exato Do Seu Investimento." },
                            { icon: ShieldCheck, title: "100% Auditável", desc: "Comprovação De Entrega De Mídia (Checking) Rigoroso E Transparente." }
                        ].map((item, index) => (
                            <motion.div 
                                key={index} variants={fadeUp}
                                className="bg-[#111113] border border-white/5 p-6 md:p-8 hover:border-[#FF5E00]/40 transition-colors duration-300"
                            >
                                <div className="w-12 h-12 bg-[#FF5E00]/10 flex items-center justify-center mb-6">
                                    <item.icon className="w-6 h-6 text-[#FF5E00]" />
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                                <p className="text-xs text-[#8F8F91] leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                </div>
            </section>

            {/* ========================================================= */}
            {/* LIDERANÇA / EQUIPE                                        */}
            {/* ========================================================= */}
            <section className="relative z-20 w-full bg-[#050505] border-y border-white/5 py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#FF5E00] mb-4">A Liderança</h2>
                        <h3 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Quem Faz Acontecer</h3>
                    </div>

                    <motion.div 
                        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {/* Sócio 1 */}
                        <motion.div variants={fadeUp} className="flex flex-col bg-[#111113] border border-white/5 p-6 hover:border-[#FF5E00]/30 transition-colors duration-300">
                            <div className="w-full aspect-square bg-black mb-6 overflow-hidden relative">
                                {/* CAMPO PARA INSERIR IMAGEM */}
                                <img src="/equipe/victor.jpg" alt="Foto Victor" className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity duration-500 fallback-bg" onError={(e) => e.currentTarget.style.display = 'none'} />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-[#8F8F91] text-xs font-medium uppercase tracking-widest opacity-30">[ Inserir Foto ]</span>
                                </div>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-1">Victor Hugo Dourado</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#FF5E00] mb-4">Sócio-Fundador</p>
                            <p className="text-sm text-[#8F8F91] leading-relaxed">
                                Focado Em Relacionamento E Expansão Estratégica, Conectando As Maiores Marcas Do Mercado Aos Nossos Circuitos Premium.
                            </p>
                        </motion.div>

                        {/* Sócio 2 */}
                        <motion.div variants={fadeUp} className="flex flex-col bg-[#111113] border border-white/5 p-6 hover:border-[#FF5E00]/30 transition-colors duration-300">
                            <div className="w-full aspect-square bg-black mb-6 overflow-hidden relative">
                                {/* CAMPO PARA INSERIR IMAGEM */}
                                <img src="/equipe/joao.jpg" alt="Foto João" className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity duration-500 fallback-bg" onError={(e) => e.currentTarget.style.display = 'none'} />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-[#8F8F91] text-xs font-medium uppercase tracking-widest opacity-30">[ Inserir Foto ]</span>
                                </div>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-1">João Borges Guerin</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#FF5E00] mb-4">Sócio-Fundador</p>
                            <p className="text-sm text-[#8F8F91] leading-relaxed">
                                Liderando A Visão Estratégica E A Inteligência Operacional Para Garantir Que Cada Campanha Atinja O Seu Potencial Máximo.
                            </p>
                        </motion.div>

                        {/* Sócio 3 */}
                        <motion.div variants={fadeUp} className="flex flex-col bg-[#111113] border border-white/5 p-6 hover:border-[#FF5E00]/30 transition-colors duration-300">
                            <div className="w-full aspect-square bg-black mb-6 overflow-hidden relative">
                                {/* CAMPO PARA INSERIR IMAGEM */}
                                <img src="/equipe/natan.jpg" alt="Foto Natan" className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity duration-500 fallback-bg" onError={(e) => e.currentTarget.style.display = 'none'} />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-[#8F8F91] text-xs font-medium uppercase tracking-widest opacity-30">[ Inserir Foto ]</span>
                                </div>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-1">Natan Campos</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#FF5E00] mb-4">Sócio-Fundador</p>
                            <p className="text-sm text-[#8F8F91] leading-relaxed">
                                A Base Técnica Da T3 OOH. Direcionando A Tecnologia, Inovação E O Desenvolvimento De Sistemas Para Nossa Rede Digital.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ========================================================= */}
            {/* NOSSOS PARCEIROS                                          */}
            {/* ========================================================= */}
            <section className="relative z-20 w-full max-w-7xl mx-auto px-6 py-24 md:py-32">
                <div className="text-center mb-16">
                    <h2 className="text-sm font-black uppercase tracking-widest text-[#FF5E00] mb-4 flex items-center justify-center gap-2">
                        <Handshake className="w-4 h-4" /> Ecossistema
                    </h2>
                    <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Nossos Parceiros Estratégicos</h3>
                    <p className="text-[#8F8F91] text-sm mt-4 max-w-2xl mx-auto">
                        Grandes Marcas Que Confiam Em Nossa Entrega E Em Nossa Transparência Tecnológica Para Escalar Seus Negócios.
                    </p>
                </div>

                <motion.div 
                    initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                        <motion.div 
                            key={index} variants={fadeUp}
                            className="h-28 bg-[#111113] border border-white/5 flex items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 cursor-pointer relative"
                        >
                            {/* CAMPO PARA INSERIR LOGO DO PARCEIRO */}
                            <img src={`/parceiros/logo-${index}.png`} alt={`Parceiro ${index}`} className="max-h-12 max-w-[120px] object-contain fallback-bg" onError={(e) => e.currentTarget.style.display = 'none'} />
                            <span className="absolute text-[#8F8F91] text-[10px] uppercase tracking-widest opacity-20 pointer-events-none">[ Logo ]</span>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ========================================================= */}
            {/* CALL TO ACTION (CTA) FINAL                                */}
            {/* ========================================================= */}
            <motion.section 
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp}
                className="relative z-20 w-full max-w-5xl mx-auto px-6 pb-32"
            >
                <div className="bg-[#050505] border border-white/10 p-10 md:p-16 text-center shadow-2xl relative overflow-hidden rounded-md">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[#FF5E00] to-transparent opacity-50" />
                    
                    <Target className="w-12 h-12 text-[#FF5E00] mx-auto mb-6" />
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        Pronto Para Dominar As Ruas?
                    </h2>
                    <p className="text-[#8F8F91] text-sm md:text-base max-w-2xl mx-auto mb-10">
                        Explore Nosso Mapa Interativo Para Conhecer Nossos Pontos Ou Fale Agora Mesmo Com Nossa Equipe Comercial Para Desenhar A Campanha Ideal Para Sua Marca.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link to="/mapa" className="w-full sm:w-auto">
                            <Button 
                                size="lg"
                                className="w-full sm:w-auto bg-[#FF5E00] hover:bg-[#e05300] text-[#0A0A0B] font-black border-none uppercase tracking-widest text-xs h-14 rounded-md transition-all"
                            >
                                Explorar Telões
                            </Button>
                        </Link>
                        <Link to="/contato" className="w-full sm:w-auto">
                            <Button 
                                variant="ghost"
                                size="lg"
                                className="w-full sm:w-auto bg-transparent hover:bg-white/5 border border-white/20 text-white font-bold uppercase tracking-widest text-xs h-14 rounded-md transition-all"
                                rightIcon={<ArrowRight className="w-4 h-4" />}
                            >
                                Falar Com Comercial
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.section>

        </main>
    );
}