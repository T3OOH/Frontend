import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, LogIn, LayoutDashboard, LogOut, Briefcase, User as UserIcon, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { panelsService } from '@/services/panels.service';

const navLinks = [
    { name: 'Início', path: '/' },
    { name: 'Mapa de Painéis', path: '/mapa' },
    { name: 'Serviços', path: '/servicos' },
    { name: 'Contato', path: '/contato' },
];

export function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    
    const { isAuthenticated, user, signOut } = useAuth(); 

    // Detecta o scroll para aplicar o efeito Glassmorphism no Header
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fecha o menu mobile automaticamente ao trocar de rota
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Trava o scroll do fundo apenas quando o menu mobile estiver aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const getRoleDisplayName = (role?: string) => {
        switch (role) {
            case 'ADMIN':
            case 'MANAGER': return 'Gestor';
            case 'COMERCIAL': return 'Comercial';
            case 'USER': return 'Cliente';
            default: return '';
        }
    };

    // Função para identificar a tela atual e exibir na pílula mobile
    const getRouteName = (path: string) => {
        if (path === '/') return 'Início';
        if (path.startsWith('/mapa')) return 'Mapa Interativo';
        if (path.startsWith('/servicos')) return 'Painéis OOH';
        if (path.startsWith('/contato')) return 'Contato';
        if (path.startsWith('/login')) return 'Acesso';
        if (path.startsWith('/cadastro')) return 'Cadastro';
        if (path.startsWith('/perfil')) return 'Meu Perfil';
        if (path.startsWith('/dashboard')) return 'Gestão T3';
        if (path.startsWith('/crm')) return 'CRM Comercial';
        return 'T3 Network';
    };

    const userRole = user?.role as string | undefined;

    return (
        <>
            {/* 
              z-[500] garante que o Header fique acima de TUDO no site (mapa, cards, modais comuns),
              mas abaixo de funções extremas como Tela Cheia (z-[9999]).
            */}
            <header 
                className={cn(
                    "fixed top-0 inset-x-0 h-[64px] md:h-[80px] z-[500] transition-all duration-300",
                    scrolled 
                        ? "bg-[#0A0A0B]/85 backdrop-blur-xl border-b border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]" 
                        : "bg-gradient-to-b from-[#0A0A0B]/80 to-transparent border-b border-transparent"
                )}
            >
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-4">

                    {/* Lado Esquerdo - Logo T3 */}
                    <div className="flex-1 flex justify-start items-center">
                        <Link to="/" className="group flex items-center relative z-50">
                            <motion.img 
                                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                src="/LOGO T3 BRANCO COM LARANJA somente t3.PNG" 
                                alt="Logo T3" 
                                className="h-8 md:h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,94,0,0.15)] group-hover:drop-shadow-[0_0_20px_rgba(255,94,0,0.5)] transition-all duration-300"
                            />
                        </Link>
                    </div>

                    {/* ========================================================= */}
                    {/* CENTRO MOBILE (PÍLULA DE STATUS)                          */}
                    {/* ========================================================= */}
                    <div className="md:hidden flex flex-[2] justify-center items-center pointer-events-none">
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={location.pathname}
                                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-1.5 bg-[#111113]/80 border border-white/5 px-3 py-1.5 rounded-full shadow-inner backdrop-blur-md"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E00] animate-pulse shadow-[0_0_8px_rgba(255,94,0,0.8)]" />
                                <span className="text-[10px] font-black text-white tracking-widest uppercase mt-[1px]">
                                    {getRouteName(location.pathname)}
                                </span>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* ========================================================= */}
                    {/* DESKTOP LAYOUT (Navegação Central e Ações à Direita)      */}
                    {/* ========================================================= */}
                    <nav className="hidden md:flex flex-none items-center gap-8">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onMouseEnter={() => {
                                        if (link.path === '/mapa') panelsService.getMapMarkers().catch(() => {});
                                    }}
                                    className={cn(
                                        "text-sm font-bold transition-all duration-300 relative py-2",
                                        isActive ? "text-[#FF5E00]" : "text-brand-muted hover:text-white"
                                    )}
                                >
                                    {link.name}
                                    {isActive && (
                                        <motion.div 
                                            layoutId="activeNav" 
                                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#FF5E00] rounded-full shadow-[0_0_8px_rgba(255,94,0,0.8)]" 
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="hidden md:flex flex-1 items-center justify-end gap-4 relative z-50">
                        {!isAuthenticated ? (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="flex items-center border border-white/10 bg-[#111113] hover:border-[#FF5E00]/50 hover:bg-[#FF5E00]/10 text-white transition-all rounded-xl" 
                                onClick={() => navigate('/login')} 
                                rightIcon={<LogIn className="w-4 h-4 text-[#FF5E00]" />}
                            >
                                Área do Cliente
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2 bg-[#111113] pl-1 pr-3 py-1 rounded-full border border-white/5 shadow-md">
                                <div className="flex items-center gap-2.5 cursor-default">
                                    <div className="w-8 h-8 rounded-full bg-[#FF5E00]/10 border border-[#FF5E00]/30 flex items-center justify-center text-[#FF5E00] font-black text-sm">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col pr-3 border-r border-white/10">
                                        <span className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">{user?.name?.split(' ')[0]}</span>
                                        <span className="text-[9px] text-[#FF5E00] font-black leading-tight uppercase tracking-widest">{getRoleDisplayName(userRole)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5 ml-1">
                                    {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                                        <button onClick={() => navigate('/dashboard')} className="p-1.5 text-brand-muted hover:text-[#FF5E00] hover:bg-[#FF5E00]/10 rounded-full transition-colors" title="Painel de Gestão"><LayoutDashboard className="w-4 h-4" /></button>
                                    )}
                                    {userRole === 'COMERCIAL' && (
                                        <button onClick={() => navigate('/crm')} className="p-1.5 text-brand-muted hover:text-[#FF5E00] hover:bg-[#FF5E00]/10 rounded-full transition-colors" title="Área Comercial"><Briefcase className="w-4 h-4" /></button>
                                    )}
                                    {userRole === 'USER' && (
                                        <button onClick={() => navigate('/perfil')} className="p-1.5 text-brand-muted hover:text-[#FF5E00] hover:bg-[#FF5E00]/10 rounded-full transition-colors" title="Meu Perfil"><UserIcon className="w-4 h-4" /></button>
                                    )}
                                    <button onClick={signOut} className="p-1.5 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors" title="Sair"><LogOut className="w-4 h-4" /></button>
                                </div>
                            </div>
                        )}

                        {(!isAuthenticated || userRole === 'USER') && (
                            <Button 
                                size="sm" 
                                className="bg-[#FF5E00] text-[#0A0A0B] font-black uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(255,94,0,0.2)] hover:shadow-[0_0_25px_rgba(255,94,0,0.4)] transition-all border-none" 
                                rightIcon={<ArrowRight className="w-4 h-4" />} 
                                onClick={() => navigate('/mapa')} 
                                onMouseEnter={() => panelsService.getMapMarkers().catch(() => {})}
                            >
                                Orçamento
                            </Button>
                        )}
                    </div>

                    {/* ========================================================= */}
                    {/* MOBILE MENU TRIGGER E AVATAR                              */}
                    {/* ========================================================= */}
                    <div className="md:hidden flex flex-1 justify-end relative z-[60]">
                        <button
                            type="button"
                            className="p-2 -mr-2 text-white hover:text-[#FF5E00] transition-colors relative"
                            onClick={() => setIsOpen(!isOpen)}
                            aria-label="Alternar menu"
                        >
                            {!isOpen && isAuthenticated ? (
                                <div className="w-8 h-8 rounded-full bg-[#FF5E00]/10 border border-[#FF5E00]/30 flex items-center justify-center text-[#FF5E00] font-black text-xs shadow-md">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                            ) : isOpen ? (
                                <X className="w-6 h-6 text-white" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* ========================================================= */}
            {/* OVERLAY DE MENU MOBILE ESTILO APLICATIVO                  */}
            {/* ========================================================= */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        // O z-[490] garante que o menu mobile cubra os itens do mapa que estão no z-[400] e z-[100]
                        className="fixed inset-0 pt-[64px] bg-[#0A0A0B]/98 backdrop-blur-3xl z-[490] md:hidden border-t border-white/5 flex flex-col"
                    >
                        <div className="flex flex-col h-full px-5 py-6 overflow-y-auto custom-scrollbar">
                            
                            {/* Card de Usuário ou CTA de Login */}
                            {isAuthenticated ? (
                                <div 
                                    className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-xl mb-8 active:scale-95 transition-transform" 
                                    onClick={() => { setIsOpen(false); navigate(userRole === 'USER' ? '/perfil' : userRole === 'COMERCIAL' ? '/crm' : '/dashboard'); }}
                                >
                                    <div className="w-12 h-12 rounded-full bg-[#FF5E00]/10 border border-[#FF5E00]/30 flex items-center justify-center text-[#FF5E00] font-black text-xl shadow-[0_0_15px_rgba(255,94,0,0.1)]">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <span className="text-base font-bold text-white line-clamp-1">{user?.name}</span>
                                        <span className="text-xs text-[#FF5E00] uppercase font-black tracking-wider">{getRoleDisplayName(userRole)}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-brand-muted" />
                                </div>
                            ) : (
                                <div className="bg-[#111113] border border-[#FF5E00]/20 rounded-2xl p-5 flex flex-col gap-3 shadow-xl mb-8 relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FF5E00]/10 rounded-full blur-2xl pointer-events-none" />
                                    <h3 className="text-sm font-bold text-white relative z-10">Já é cliente T3?</h3>
                                    <Button 
                                        className="w-full text-sm font-black text-[#0A0A0B] bg-[#FF5E00] uppercase tracking-widest rounded-xl relative z-10 border-none" 
                                        onClick={() => { setIsOpen(false); navigate('/login'); }}
                                    >
                                        Fazer Login
                                    </Button>
                                </div>
                            )}

                            {/* Menu de Navegação em Blocos */}
                            <div className="flex flex-col gap-2 mb-8">
                                <h4 className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-2 mb-2">Explorar</h4>
                                {navLinks.map((link) => {
                                    const isActive = location.pathname === link.path;
                                    return (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-xl border transition-all",
                                                isActive ? "bg-[#FF5E00]/10 border-[#FF5E00]/50 shadow-inner" : "bg-[#111113] border-white/5 active:bg-white/5"
                                            )}
                                        >
                                            <span className={cn("text-sm font-bold", isActive ? "text-[#FF5E00]" : "text-white")}>{link.name}</span>
                                            <ChevronRight className={cn("w-4 h-4", isActive ? "text-[#FF5E00]" : "text-brand-muted")} />
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Logout Bottom */}
                            {isAuthenticated && (
                                <div className="mt-auto pb-safe">
                                    <button 
                                        onClick={() => { setIsOpen(false); signOut(); }}
                                        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 font-bold text-sm hover:bg-red-500/10 active:bg-red-500/20 transition-all uppercase tracking-widest"
                                    >
                                        <LogOut className="w-4 h-4" /> Sair da Conta
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}