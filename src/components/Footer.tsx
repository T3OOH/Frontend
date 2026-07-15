import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, ArrowRight } from 'lucide-react'; // 👈 Removidos Instagram e Linkedin daqui

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#050505] border-t border-brand-border/30 pt-16 pb-8 relative overflow-hidden">
            {/* Efeito de luz de fundo no Footer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-brand-neon/50 to-transparent opacity-50" />
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-neon/5 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
                    
                    {/* Coluna 1: Marca e Sobre (Ocupa 4 colunas) */}
                    <div className="lg:col-span-4 flex flex-col items-start">
                        <Link to="/" className="flex items-center gap-1.5 mb-6 group">
                            <img 
                                src="/t3d 2.png" 
                                alt="Logo T3" 
                                className="h-12 w-auto object-contain transition-all"
                            />
                        </Link>
                        <p className="text-sm text-brand-muted leading-relaxed mb-6">
                            A plataforma definitiva para gestão e locação de painéis de LED. Posicionamos sua marca com inteligência, métricas e alto impacto visual.
                        </p>
                        <div className="flex items-center gap-4">
                            {/* 👇 SVG do Instagram */}
                            <a href="https://www.instagram.com/t3led/" className="w-10 h-10 rounded-lg bg-brand-surface border border-brand-border/50 flex items-center justify-center text-brand-muted hover:text-brand-neon hover:border-brand-neon/50 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                                </svg>
                            </a>
                            
                            {/* 👇 SVG do LinkedIn */}
                            <a href="#" className="w-10 h-10 rounded-lg bg-brand-surface border border-brand-border/50 flex items-center justify-center text-brand-muted hover:text-brand-neon hover:border-brand-neon/50 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                    <rect width="4" height="12" x="2" y="9"></rect>
                                    <circle cx="4" cy="4" r="2"></circle>
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Coluna 2: Links Rápidos (Ocupa 3 colunas) */}
                    <div className="lg:col-span-3 lg:col-start-6 flex flex-col">
                        <h4 className="text-brand-text font-bold mb-6 uppercase tracking-wider text-xs">Links Rápidos</h4>
                        <nav className="flex flex-col gap-3">
                            <Link to="/" className="text-sm text-brand-muted hover:text-brand-neon transition-colors flex items-center gap-2 group">
                                <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                Início
                            </Link>
                            <Link to="/mapa" className="text-sm text-brand-muted hover:text-brand-neon transition-colors flex items-center gap-2 group">
                                <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                Mapa de Painéis
                            </Link>
                            <Link to="/servicos" className="text-sm text-brand-muted hover:text-brand-neon transition-colors flex items-center gap-2 group">
                                <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                Nossos Serviços
                            </Link>
                            <Link to="/contato" className="text-sm text-brand-muted hover:text-brand-neon transition-colors flex items-center gap-2 group">
                                <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                Fale Conosco
                            </Link>
                        </nav>
                    </div>

                    {/* Coluna 3: Contato (Ocupa 4 colunas) */}
                    <div className="lg:col-span-4 flex flex-col">
                        <h4 className="text-brand-text font-bold mb-6 uppercase tracking-wider text-xs">Atendimento</h4>
                        <ul className="flex flex-col gap-4">
                            <li className="flex items-start gap-3 text-sm text-brand-muted">
                                <MapPin className="w-5 h-5 text-brand-neon flex-shrink-0" />
                                <span>Goiânia, Goiás, Brasil<br/>Atendimento nacional.</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-brand-muted">
                                <Phone className="w-5 h-5 text-brand-neon flex-shrink-0" />
                                <span>(00) 00000-0000</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-brand-muted">
                                <Mail className="w-5 h-5 text-brand-neon flex-shrink-0" />
                                <span>contato@t3ooh.com.br</span>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Base do Footer / Copyright */}
                <div className="pt-8 border-t border-brand-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-brand-muted">
                        © {currentYear} T3 OOH. Todos os direitos reservados.
                    </p>
                    <div className="flex items-center gap-4">
                        <Link to="/privacidade" className="text-xs text-brand-muted hover:text-brand-neon transition-colors">Política de Privacidade</Link>
                        <span className="text-brand-border">|</span>
                        <Link to="/termos" className="text-xs text-brand-muted hover:text-brand-neon transition-colors">Termos de Uso</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}