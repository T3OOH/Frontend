import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
    Home, Building2, Briefcase, Store, HardHat, MonitorCog, 
    Maximize, SunMedium, Settings2, LayoutTemplate, Target
} from 'lucide-react';
import Aurora from '../components/Aurora';
import DepthCarousel from '../components/DepthCarousel';
import { Button } from '@/components/Button';
import { api } from '@/lib/axios';

// ==========================================
// MOCK DATA (Fallback caso o banco esteja vazio)
// ==========================================
const MOCK_CAROUSEL_IMAGES = [
    { image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?q=80&w=800&auto=format&fit=crop', alt: 'Painel LED Corporativo' },
    { image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop', alt: 'Painel Arquitetural' },
    { image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800&auto=format&fit=crop', alt: 'Painel Publicitário' },
    { image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop', alt: 'Painel Vitrine' },
    { image: 'https://images.unsplash.com/photo-1533750516457-d7f3acb28c05?q=80&w=800&auto=format&fit=crop', alt: 'Painel Eventos' }
];

export function Solution() {
    const [portfolioImages, setPortfolioImages] = useState(MOCK_CAROUSEL_IMAGES);

    // ==========================================
    // ANIMAÇÕES E CONTROLES DE SCROLL (CINEMÁTICO EXTREMO)
    // ==========================================
    const { scrollY } = useScroll();
    
    // A Logo agora tem um zoom agressivo (de 1 até 3x o tamanho),
    // Sobe rapidamente para o topo e desaparece.
    const logoScale = useTransform(scrollY, [0, 500], [1, 3]);
    const logoOpacity = useTransform(scrollY, [0, 400], [1, 0]);
    const logoY = useTransform(scrollY, [0, 500], [0, -300]);

    // Variantes para consistência com o padrão Premium
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

    // ==========================================
    // BUSCA DAS IMAGENS NO BANCO DE DADOS
    // ==========================================
    useEffect(() => {
        const controller = new AbortController();

        const fetchPortfolio = async () => {
            try {
                const response = await api.get('/solution/portfolio', { signal: controller.signal });
                
                if (!controller.signal.aborted && response.data && response.data.length > 0) {
                    const loadedImages = response.data.map((item: any) => ({
                        image: item.url,
                        alt: item.alt
                    }));
                    setPortfolioImages(loadedImages);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("Erro ao carregar imagens do portfólio", error);
                }
            }
        };
        fetchPortfolio();

        return () => {
            controller.abort();
        };
    }, []);

    return (
        <main className="relative min-h-screen bg-[#0A0A0B] text-white selection:bg-[#FF5E00]/30 selection:text-[#FF5E00] font-sans overflow-x-hidden">
            
            {/* BACKGROUND ANIMADO */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-screen">
                <Aurora
                    colorStops={['#FF5E00', '#111113', '#0A0A0B']}
                    blend={0.5}
                    amplitude={0.7}
                    speed={0.2}
                />
            </div>

            {/* GRADE (GRID) TECNOLÓGICA PADRÃO DA HOME */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

            {/* ========================================== */}
            {/* HERO SECTION: Logo Central Gigante         */}
            {/* ========================================== */}
            <section className="relative z-10 pt-20 pb-20 md:pb-24 px-6 max-w-[1400px] mx-auto border-b border-white/5">
                
                {/* CONTAINER DA LOGO (Ocupa a primeira tela visível) */}
                <div className="w-full flex flex-col justify-center items-center min-h-[85vh] mb-16 pointer-events-none relative z-50">
                    
                    <motion.div 
                        style={{ scale: logoScale, opacity: logoOpacity, y: logoY }}
                        className="w-[95%] max-w-[1000px] xl:max-w-[1200px] origin-center flex flex-col items-center"
                    >
                        <img 
                            src="/T3 Solution3D.png" 
                            alt="T3 Solution Logo" 
                            className="w-full h-auto object-contain drop-shadow-[0_0_50px_rgba(255,94,0,0.25)]"
                        />
                        <p className="text-[#8F8F91] text-xs md:text-sm lg:text-lg font-bold tracking-[0.3em] md:tracking-[0.5em] uppercase mt-8 md:mt-12 drop-shadow-md text-center">
                            Projetos de LED & Tecnologia Visual
                        </p>
                    </motion.div>

                    {/* INDICADOR DE SCROLL (Sem o mouse, mantendo apenas o texto clean) */}
                    <motion.div 
                        style={{ opacity: logoOpacity }}
                        className="absolute bottom-10 flex flex-col items-center pointer-events-none"
                    >
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">
                            Role para descobrir
                        </span>
                    </motion.div>
                </div>

                {/* CONTEÚDO PRINCIPAL E CARROSSEL */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-20">
                    
                    {/* Coluna da Esquerda: Textos e CTAs */}
                    <div className="flex flex-col items-start lg:pr-8">
                        <motion.h1 
                            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: "easeOut" }}
                            className="text-4xl md:text-5xl xl:text-6xl font-black tracking-tighter leading-[1.05] text-white mb-6"
                        >
                            Seu Espaço Merece Uma Tela À Altura Do Seu Projeto.
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                            className="text-lg md:text-xl text-[#8F8F91] max-w-lg font-medium mb-10 leading-relaxed"
                        >
                            Painéis De LED Para Residências, Empresas, Empreendimentos E Projetos Personalizados. Tecnologia Visual Pensada Para O Seu Ambiente.
                        </motion.p>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                        >
                            <Link to="/contato" className="w-full sm:w-auto">
                                <Button 
                                    size="lg"
                                    className="w-full sm:w-auto bg-[#FF5E00] hover:bg-[#e05300] text-[#0A0A0B] font-black uppercase tracking-widest text-xs h-14 rounded-md shadow-[0_0_20px_rgba(255,94,0,0.3)] transition-all"
                                >
                                    Solicitar Orçamento
                                </Button>
                            </Link>
                            <a href="#aplicacoes" className="w-full sm:w-auto">
                                <Button 
                                    variant="ghost"
                                    size="lg"
                                    className="w-full sm:w-auto bg-transparent hover:bg-white/5 border border-white/20 text-white font-bold uppercase tracking-widest text-xs h-14 rounded-md transition-all"
                                >
                                    Conhecer Soluções
                                </Button>
                            </a>
                        </motion.div>
                    </div>

                    {/* Coluna da Direita: Depth Carousel INTACTO */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                        className="w-full h-[450px] md:h-[550px] relative z-10 flex items-center justify-center"
                    >
                        <DepthCarousel 
                            items={portfolioImages}
                            cardWidth={260}
                            cardHeight={360}
                            tiltDirection="right"
                            autoplay={true}
                            autoplayDelay={4000}
                        />
                    </motion.div>

                </div>
            </section>

            {/* ========================================== */}
            {/* APLICAÇÕES: Estilo Glassmorphism Premium   */}
            {/* ========================================== */}
            <section id="aplicacoes" className="relative z-10 py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-16 md:mb-24 flex flex-col gap-4">
                        <span className="text-[#FF5E00] font-black uppercase tracking-widest text-xs">Aplicações</span>
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Uma Solução Para Cada Espaço.</h2>
                    </div>

                    <motion.div 
                        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {[
                            { icon: Home, title: "Residências", desc: "Painéis Para Áreas De Lazer, Salas, Fachadas, Espaços Gourmet E Projetos Residenciais De Alto Padrão." },
                            { icon: Building2, title: "Condomínios", desc: "Comunicação Clara Para Moradores, Mural De Avisos Digitais E Painéis Em Áreas Comuns." },
                            { icon: Briefcase, title: "Empresas", desc: "Recepções Corporativas, Salas De Reuniões, Dashboards De Indicadores E Endomarketing." },
                            { icon: Store, title: "Comércio", desc: "Vitrines De Alta Atratividade, Promoções Dinâmicas E Modernização Da Comunicação No PDV." },
                            { icon: HardHat, title: "Empreendimentos", desc: "Estruturas Para Lançamentos Imobiliários, Stands Imersivos, Empenas E Grandes Fachadas." },
                            { icon: MonitorCog, title: "Projetos Personalizados", desc: "Soluções Desenvolvidas Sob Medida, Respeitando As Dimensões E Restrições Arquitetônicas." }
                        ].map((item, index) => (
                            <motion.div 
                                key={index} variants={fadeUp}
                                className="bg-[#111113] border border-white/5 p-6 md:p-8 hover:border-[#FF5E00]/40 transition-colors duration-300 rounded-md"
                            >
                                <div className="w-12 h-12 bg-[#FF5E00]/10 flex items-center justify-center mb-6">
                                    <item.icon className="w-6 h-6 text-[#FF5E00]" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                <p className="text-sm text-[#8F8F91] leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ========================================== */}
            {/* ESPECIFICAÇÕES                             */}
            {/* ========================================== */}
            <section className="relative z-10 py-24 md:py-32 bg-[#050505] border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-16 lg:gap-24">
                    <motion.div 
                        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp}
                        className="lg:w-1/3 lg:sticky lg:top-32 h-fit"
                    >
                        <span className="text-[#FF5E00] font-black uppercase tracking-widest text-xs mb-4 block">Portfólio</span>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-6">Encontre O Painel Ideal.</h2>
                        <p className="text-[#8F8F91] text-lg">Configuramos O Painel De Acordo Com O Ambiente E A Necessidade Do Seu Projeto.</p>
                    </motion.div>
                    
                    <motion.div 
                        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer}
                        className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-12 border-t border-white/5 pt-12 lg:border-none lg:pt-0"
                    >
                        {[
                            { icon: LayoutTemplate, title: "Painéis Indoor", desc: "Soluções Com Alta Taxa De Atualização E Resoluções Finas Para Visualização Próxima." },
                            { icon: SunMedium, title: "Painéis Outdoor", desc: "Equipamentos Resistentes A Intempéries Com Altíssimo Nível De Brilho E Visibilidade." },
                            { icon: Maximize, title: "Dimensões Modulares", desc: "Montagem Modular Permite Construção De Telas Em Praticamente Qualquer Formato Ou Proporção." },
                            { icon: Settings2, title: "Estruturas Sob Medida", desc: "Desde Totens Independentes Até Painéis Embutidos Em Marcenaria Ou Fachadas Planejadas." }
                        ].map((spec, index) => (
                            <motion.div key={index} variants={fadeUp} className="flex flex-col border-l-2 border-white/10 pl-6 hover:border-[#FF5E00]/50 transition-colors duration-300">
                                <spec.icon className="w-6 h-6 text-[#FF5E00] mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">{spec.title}</h3>
                                <p className="text-sm text-[#8F8F91]">{spec.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ========================================== */}
            {/* PROCESSO DE COMPRA                         */}
            {/* ========================================== */}
            <section className="relative z-10 py-24 md:py-32 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-16 text-center">Como Funciona O Nosso Processo</h2>
                    
                    <motion.div 
                        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {[
                            { num: "01", title: "Entendemos Seu Projeto", desc: "Você Informa Onde Pretende Instalar O Painel E Qual Será A Principal Utilização Da Tela.", active: true },
                            { num: "02", title: "Definimos A Solução", desc: "Nossa Equipe Avalia O Tamanho, A Aplicação, A Estrutura E As Especificações Técnicas.", active: false },
                            { num: "03", title: "Orçamento E Escopo", desc: "Você Recebe Uma Proposta Detalhada E Comercialmente Adequada À Realidade Do Projeto.", active: false },
                            { num: "04", title: "Instalação Completa", desc: "Após A Aprovação, Cuidamos De Toda A Etapa De Fixação E Instalação Do Equipamento.", active: false }
                        ].map((step, index) => (
                            <motion.div key={index} variants={fadeUp} className={`flex flex-col border-t pt-6 ${step.active ? 'border-[#FF5E00]' : 'border-white/10'}`}>
                                <span className={`${step.active ? 'text-[#FF5E00]' : 'text-white/20'} font-black text-4xl mb-4`}>{step.num}</span>
                                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-sm text-[#8F8F91]">{step.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ========================================== */}
            {/* DIFFERENCIAL ESTÉTICO                      */}
            {/* ========================================== */}
            <section className="relative z-20 w-full max-w-7xl mx-auto px-6 py-24 md:py-32">
                <motion.div 
                    initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp}
                    className="text-center"
                >
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-8">
                        Mais Do Que Um Painel.<br />Um Projeto Pensado Para O Seu Espaço.
                    </h2>
                    <p className="text-[#8F8F91] text-lg md:text-xl font-medium leading-relaxed max-w-3xl mx-auto">
                        Cada Ambiente Possui Uma Necessidade Diferente. Por Isso, Trabalhamos Com Soluções De LED Que Podem Ser Dimensionadas De Acordo Com O Espaço, Aplicação E Objetivo Do Cliente.
                    </p>
                </motion.div>
            </section>

            {/* ========================================== */}
            {/* CALL TO ACTION (CTA) FINAL                 */}
            {/* ========================================== */}
            <motion.section 
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp}
                className="relative z-20 w-full max-w-5xl mx-auto px-6 pb-32"
            >
                <div className="bg-[#050505] border border-white/10 p-10 md:p-16 text-center shadow-2xl relative overflow-hidden rounded-md">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[#FF5E00] to-transparent opacity-50" />
                    
                    <Target className="w-12 h-12 text-[#FF5E00] mx-auto mb-6" />
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        Tem Um Espaço Para Transformar?
                    </h2>
                    <p className="text-[#8F8F91] text-sm md:text-base max-w-2xl mx-auto mb-10">
                        Conte Para A Equipe Da T3 Solution Onde Você Pretende Instalar Seu Painel. Nós Ajudamos A Desenhar O Equipamento Ideal Para O Seu Negócio.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link to="/contato" className="w-full sm:w-auto">
                            <Button 
                                size="lg"
                                className="w-full sm:w-auto bg-[#FF5E00] hover:bg-[#e05300] text-[#0A0A0B] font-black border-none uppercase tracking-widest text-xs h-14 rounded-md shadow-[0_0_20px_rgba(255,94,0,0.3)] transition-all"
                            >
                                Solicitar Orçamento
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.section>

        </main>
    );
}