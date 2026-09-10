import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, ArrowRight, CircleUser } from 'lucide-react';

/**
 * Footer Component
 * Global application footer rendering institutional data, auxiliary navigation, and contact info.
 * 
 * Architecture & UI/UX Strategy:
 * - Employs `flex-shrink-0` and `mt-auto` to ensure it anchors to the bottom of the DOM tree.
 * - Refactored to the Premium B2B aesthetic: eliminated exaggerated glows, unified the color palette 
 *   (#050505 for base demarcation, #8F8F91 for muted text, #FF5E00 for interaction highlights).
 * - Mobile viewport retains a specific bottom padding (pb-[120px]) to prevent overlapping with 
 *   the system's fixed bottom navigation bar.
 */
export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full flex-shrink-0 mt-auto bg-[#050505] border-t border-white/5 pt-16 pb-8 relative overflow-hidden z-20">
            
            {/* Subtle top edge highlight to establish depth without excessive AI-like glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-[#FF5E00]/30 to-transparent" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                
                {/* ========================================================= */}
                {/* VIEWPORT: DESKTOP                                         */}
                {/* ========================================================= */}
                <div className="hidden lg:block">
                    <div className="grid grid-cols-12 gap-8 mb-16">
                        
                        {/* Column 1: Institutional & Identity */}
                        <div className="col-span-4 flex flex-col items-start">
                            <Link to="/" className="flex items-center gap-1.5 mb-6 group">
                                <img src="/t3d 2.png" alt="Logo T3" className="h-12 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            <p className="text-[13px] text-[#8F8F91] leading-relaxed mb-8 font-medium pr-4">
                                A plataforma inteligente para gestão e locação de painéis de LED em todo o Brasil. Conectamos anunciantes aos melhores pontos de mídia OOH com tecnologia, métricas e auditoria em tempo real.
                            </p>
                            
                            {/* Social Media Actions */}
                            <div className="flex items-center gap-3">
                                <a 
                                    href="https://www.instagram.com/t3led/" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="w-10 h-10 rounded-sm bg-[#111113] border border-white/10 flex items-center justify-center text-[#8F8F91] hover:text-[#FF5E00] hover:border-[#FF5E00]/50 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                                    </svg>
                                </a>
                                <a 
                                    href="https://www.linkedin.com/company/agencia-t3/?originalSubdomain=br" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="w-10 h-10 rounded-sm bg-[#111113] border border-white/10 flex items-center justify-center text-[#8F8F91] hover:text-[#FF5E00] hover:border-[#FF5E00]/50 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                        <rect width="4" height="12" x="2" y="9"></rect>
                                        <circle cx="4" cy="4" r="2"></circle>
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Column 2: Navigation Links */}
                        <div className="col-span-3 col-start-6 flex flex-col">
                            <h4 className="text-[#FF5E00] font-bold mb-6 uppercase tracking-widest text-[11px]">Links Rápidos</h4>
                            <nav className="flex flex-col gap-4">
                                <Link to="/" className="text-[13px] font-bold text-[#8F8F91] hover:text-white transition-colors flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 text-[#FF5E00] opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Início
                                </Link>
                                <Link to="/mapa" className="text-[13px] font-bold text-[#8F8F91] hover:text-white transition-colors flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 text-[#FF5E00] opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Mapa de Painéis
                                </Link>
                                <Link to="/servicos" className="text-[13px] font-bold text-[#8F8F91] hover:text-white transition-colors flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 text-[#FF5E00] opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Nossos Serviços
                                </Link>
                                <Link to="/contato" className="text-[13px] font-bold text-[#8F8F91] hover:text-white transition-colors flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 text-[#FF5E00] opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Fale Conosco
                                </Link>
                            </nav>
                        </div>

                        {/* Column 3: Contact & Business Data */}
                        <div className="col-span-4 flex flex-col">
                            <h4 className="text-[#FF5E00] font-bold mb-6 uppercase tracking-widest text-[11px]">Atendimento Corporativo</h4>
                            <ul className="flex flex-col gap-5">
                                <li className="flex items-start gap-3 text-[13px] font-medium text-[#8F8F91]">
                                    <MapPin className="w-4 h-4 text-[#FF5E00] flex-shrink-0 mt-0.5" />
                                    <span>Goiânia, Goiás, Brasil</span>
                                </li>
                                <li className="flex items-center gap-3 text-[13px] font-medium text-[#8F8F91]">
                                    <Phone className="w-4 h-4 text-[#FF5E00] flex-shrink-0" />
                                    <span>(62) 9320-6010</span>
                                </li>
                                <li className="flex items-center gap-3 text-[13px] font-medium text-[#8F8F91]">
                                    <Mail className="w-4 h-4 text-[#FF5E00] flex-shrink-0" />
                                    <span>contato@t3comunicacao.com</span>
                                </li>
                                <li className="flex items-center gap-3 text-[13px] font-medium text-[#8F8F91]">
                                    <CircleUser className="w-4 h-4 text-[#FF5E00] flex-shrink-0" />
                                    <span>CNPJ: 43.773.494/0001-50</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Desktop Base Footer (Copyright & Legal) */}
                    <div className="pt-8 border-t border-white/5 flex items-center justify-between gap-4">
                        <p className="text-[11px] font-bold tracking-wider text-[#8F8F91] uppercase">© {currentYear} T3 OOH. Todos os direitos reservados.</p>
                        <div className="flex items-center gap-4">
                            <Link to="/privacidade" className="text-[11px] font-bold tracking-wider uppercase text-[#8F8F91] hover:text-white transition-colors">Política de Privacidade</Link>
                            <span className="text-white/10">|</span>
                            <Link to="/termos" className="text-[11px] font-bold tracking-wider uppercase text-[#8F8F91] hover:text-white transition-colors">Termos de Uso</Link>
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* VIEWPORT: MOBILE                                          */}
                {/* pb-[120px] is retained to clear the fixed bottom nav bar. */}
                {/* ========================================================= */}
                <div className="lg:hidden flex flex-col pb-[120px]">
                    
                    <div className="flex flex-col items-center text-center mb-10 pt-2">
                        <img src="/t3d 2.png" alt="Logo T3" className="h-16 w-auto object-contain mb-6 opacity-90" />
                        <p className="text-[13px] text-[#8F8F91] leading-relaxed font-medium px-4">
                            A plataforma inteligente para gestão e locação de painéis de LED no Centro-Oeste e Brasil.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-10 border-t border-b border-white/5 py-8">
                        {/* Mobile Navigation Column */}
                        <div className="flex flex-col items-center">
                            <h4 className="text-[#FF5E00] font-bold mb-5 uppercase tracking-widest text-[10px]">Navegação</h4>
                            <nav className="flex flex-col gap-4 items-center">
                                <Link to="/mapa" className="text-xs font-bold text-[#8F8F91] hover:text-white transition-colors">Mapa de Painéis</Link>
                                <Link to="/servicos" className="text-xs font-bold text-[#8F8F91] hover:text-white transition-colors">Inventário</Link>
                                <Link to="/contato" className="text-xs font-bold text-[#8F8F91] hover:text-white transition-colors">Atendimento</Link>
                            </nav>
                        </div>
                        
                        {/* Mobile Social Media Column */}
                        <div className="flex flex-col items-center">
                            <h4 className="text-[#FF5E00] font-bold mb-5 uppercase tracking-widest text-[10px]">Redes Sociais</h4>
                            <div className="flex gap-3">
                                <a 
                                    href="https://www.instagram.com/t3led/" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="w-10 h-10 rounded-sm bg-[#111113] border border-white/10 flex items-center justify-center text-[#8F8F91] hover:text-[#FF5E00]"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                                    </svg>
                                </a>
                                <a 
                                    href="https://www.linkedin.com/company/agencia-t3/?originalSubdomain=br" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="w-10 h-10 rounded-sm bg-[#111113] border border-white/10 flex items-center justify-center text-[#8F8F91] hover:text-[#FF5E00]"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                        <rect width="4" height="12" x="2" y="9"></rect>
                                        <circle cx="4" cy="4" r="2"></circle>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Contact Summary */}
                    <div className="flex flex-col gap-3 items-center mb-10">
                        <span className="flex items-center gap-2 text-[13px] font-medium text-[#8F8F91]">
                            <Phone className="w-4 h-4 text-[#FF5E00]" /> (62) 9320-6010
                        </span>
                        <span className="flex items-center gap-2 text-[13px] font-medium text-[#8F8F91]">
                            <Mail className="w-4 h-4 text-[#FF5E00]" /> contato@t3comunicacao.com
                        </span>
                    </div>

                    {/* Mobile Legal & Copyright */}
                    <div className="flex flex-col items-center gap-5 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F91]/70 leading-relaxed">
                            © {currentYear} T3 OOH. Todos os direitos reservados.<br/>CNPJ: 43.773.494/0001-50
                        </p>
                        <div className="flex gap-6">
                            <Link to="/termos" className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F91] hover:text-white transition-colors">Termos</Link>
                            <Link to="/privacidade" className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F91] hover:text-white transition-colors">Privacidade</Link>
                        </div>
                    </div>
                </div>

            </div>
        </footer>
    );
}