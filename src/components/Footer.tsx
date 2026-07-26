import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, ArrowRight, CircleUser } from 'lucide-react';

/**
 * Componente global de Rodapé (Footer).
 * Renderiza as informações institucionais, links de navegação auxiliar e dados de contato.
 * Implementa propriedades de flexbox (shrink-0, mt-auto) e z-index para garantir
 * que permaneça sempre ao final do fluxo de rolagem, sem sobrepor o conteúdo principal.
 *
 * @returns {JSX.Element} A estrutura do rodapé adaptada para Desktop e Mobile.
 */
export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full flex-shrink-0 mt-auto bg-[#050505] border-t border-brand-border/30 pt-10 lg:pt-16 pb-6 relative overflow-hidden z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            
            {/* Efeitos visuais de iluminação restritos ao escopo do componente */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-brand-neon/50 to-transparent opacity-50" />
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-neon/5 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                
                {/* ========================================================= */}
                {/* VIEWPORT: DESKTOP                                           */}
                {/* ========================================================= */}
                <div className="hidden lg:block">
                    <div className="grid grid-cols-12 gap-8 mb-16">
                        
                        {/* Seção Institucional e Identidade Visual */}
                        <div className="col-span-4 flex flex-col items-start">
                            <Link to="/" className="flex items-center gap-1.5 mb-6 group">
                                <img src="/t3d 2.png" alt="Logo T3" className="h-12 w-auto object-contain transition-all" />
                            </Link>
                            <p className="text-sm text-brand-muted leading-relaxed mb-6">
                                A plataforma inteligente para gestão e locação de painéis de LED em todo o Brasil. Conectamos anunciantes aos melhores pontos de mídia OOH com tecnologia, métricas e auditoria em tempo real.
                            </p>
                            <div className="flex items-center gap-4">
                                <a href="https://www.instagram.com/t3led/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-brand-surface border border-brand-border/50 flex items-center justify-center text-brand-muted hover:text-brand-neon hover:border-brand-neon/50 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                                    </svg>
                                </a>
                                <a href="https://www.linkedin.com/company/agencia-t3/?originalSubdomain=br" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-brand-surface border border-brand-border/50 flex items-center justify-center text-brand-muted hover:text-brand-neon hover:border-brand-neon/50 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                        <rect width="4" height="12" x="2" y="9"></rect>
                                        <circle cx="4" cy="4" r="2"></circle>
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Seção de Navegação Rápida */}
                        <div className="col-span-3 col-start-6 flex flex-col">
                            <h4 className="text-brand-text font-bold mb-6 uppercase tracking-wider text-xs">Links Rápidos</h4>
                            <nav className="flex flex-col gap-3">
                                <Link to="/" className="text-sm text-brand-muted hover:text-brand-neon transition-colors flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Início
                                </Link>
                                <Link to="/mapa" className="text-sm text-brand-muted hover:text-brand-neon transition-colors flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Mapa de Painéis
                                </Link>
                                <Link to="/servicos" className="text-sm text-brand-muted hover:text-brand-neon transition-colors flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Nossos Serviços
                                </Link>
                                <Link to="/contato" className="text-sm text-brand-muted hover:text-brand-neon transition-colors flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Fale Conosco
                                </Link>
                            </nav>
                        </div>

                        {/* Seção de Informações de Contato */}
                        <div className="col-span-4 flex flex-col">
                            <h4 className="text-brand-text font-bold mb-6 uppercase tracking-wider text-xs">Atendimento</h4>
                            <ul className="flex flex-col gap-4">
                                <li className="flex items-start gap-3 text-sm text-brand-muted">
                                    <MapPin className="w-5 h-5 text-brand-neon flex-shrink-0" />
                                    <span>Goiânia, Goiás, Brasil</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-brand-muted">
                                    <Phone className="w-5 h-5 text-brand-neon flex-shrink-0" />
                                    <span>(62) 9320-6010</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-brand-muted">
                                    <Mail className="w-5 h-5 text-brand-neon flex-shrink-0" />
                                    <span>contato@t3comunicacao.com</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-brand-muted">
                                    <CircleUser className="w-5 h-5 text-brand-neon flex-shrink-0" />
                                    <span>43.773.494/0001-50</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Rodapé Base (Copyright e Políticas) */}
                    <div className="pt-8 border-t border-brand-border/30 flex items-center justify-between gap-4">
                        <p className="text-xs text-brand-muted">© {currentYear} T3 OOH. Todos os direitos reservados.</p>
                        <div className="flex items-center gap-4">
                            <Link to="/privacidade" className="text-xs text-brand-muted hover:text-brand-neon transition-colors">Política de Privacidade</Link>
                            <span className="text-brand-border">|</span>
                            <Link to="/termos" className="text-xs text-brand-muted hover:text-brand-neon transition-colors">Termos de Uso</Link>
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* VIEWPORT: MOBILE                                            */}
                {/* ========================================================= */}
                {/* Espaçamento extra (pb-[120px]) garante folga para a bottom navigation global */}
                <div className="lg:hidden flex flex-col pb-[120px] bg-[#050505]">
                    
                    <div className="flex flex-col items-center text-center mb-10 pt-4">
                        <img src="/t3d 2.png" alt="Logo T3" className="h-16 w-auto object-contain mb-4 drop-shadow-[0_0_15px_rgba(255,94,0,0.2)]" />
                        <p className="text-sm text-brand-muted leading-relaxed px-4">
                            A plataforma inteligente para gestão e locação de painéis de LED no Centro-Oeste e Brasil.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-10 border-t border-b border-brand-border/20 py-8">
                        {/* Coluna de Navegação Mobile */}
                        <div className="flex flex-col items-center">
                            <h4 className="text-brand-text font-bold mb-4 uppercase tracking-wider text-xs">Navegação</h4>
                            <nav className="flex flex-col gap-3 items-center">
                                <Link to="/mapa" className="text-[13px] text-brand-muted hover:text-brand-neon">Mapa</Link>
                                <Link to="/servicos" className="text-[13px] text-brand-muted hover:text-brand-neon">Painéis</Link>
                                <Link to="/contato" className="text-[13px] text-brand-muted hover:text-brand-neon">Contato</Link>
                            </nav>
                        </div>
                        
                        {/* Coluna de Redes Sociais Mobile */}
                        <div className="flex flex-col items-center">
                            <h4 className="text-brand-text font-bold mb-4 uppercase tracking-wider text-xs">Redes</h4>
                            <div className="flex gap-3">
                                <a href="https://www.instagram.com/t3led/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-brand-surface/50 border border-brand-border/50 flex items-center justify-center text-brand-neon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                                    </svg>
                                </a>
                                <a href="https://www.linkedin.com/company/agencia-t3/?originalSubdomain=br" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-brand-surface/50 border border-brand-border/50 flex items-center justify-center text-brand-neon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                        <rect width="4" height="12" x="2" y="9"></rect>
                                        <circle cx="4" cy="4" r="2"></circle>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Resumo de Contato Mobile */}
                    <div className="flex flex-col gap-3 items-center mb-10">
                        <span className="flex items-center gap-2 text-sm text-brand-muted">
                            <Phone className="w-4 h-4 text-brand-neon" /> (62) 9320-6010
                        </span>
                        <span className="flex items-center gap-2 text-sm text-brand-muted">
                            <Mail className="w-4 h-4 text-brand-neon" /> contato@t3comunicacao.com
                        </span>
                    </div>

                    {/* Documentos e Direitos Mobile */}
                    <div className="flex flex-col items-center gap-4 text-center">
                        <p className="text-[11px] text-brand-muted/70">
                            © {currentYear} T3 OOH. Todos os direitos reservados.<br/>CNPJ: 43.773.494/0001-50
                        </p>
                        <div className="flex gap-4">
                            <Link to="/termos" className="text-[10px] text-brand-muted underline decoration-brand-border">Termos</Link>
                            <Link to="/privacidade" className="text-[10px] text-brand-muted underline decoration-brand-border">Privacidade</Link>
                        </div>
                    </div>
                </div>

            </div>
        </footer>
    );
}