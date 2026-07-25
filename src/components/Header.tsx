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

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
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

    // Variável auxiliar para evitar erros de tipagem do TypeScript nas comparações
    const userRole = user?.role as string | undefined;

    return (
        <>
            <header 
                className={cn(
                    "fixed top-0 inset-x-0 h-16 md:h-20 z-[9999] transition-all duration-300 border-b",
                    scrolled 
                        ? "bg-[#0A0A0B]/90 backdrop-blur-md border-brand-border/40 shadow-lg" 
                        : "bg-[#0A0A0B]/50 md:bg-transparent border-transparent"
                )}
            >
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-4">

                    {/* Lado Esquerdo - Logo */}
                    <div className="flex-1 flex justify-start items-center">
                        <Link to="/" className="z-[9999] group flex items-center">
                            <motion.img 
                                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                src="/LOGO T3 BRANCO COM LARANJA somente t3.PNG" 
                                alt="Logo T3" 
                                className="h-8 md:h-12 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,94,0,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(255,94,0,0.6)] transition-all"
                            />
                        </Link>
                    </div>

                    {/* ========================================================= */}
                    {/* DESKTOP LAYOUT (100% PRESERVADO)                            */}
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
                                        "text-sm font-semibold transition-all duration-300 relative py-2",
                                        isActive ? "text-brand-text drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "text-brand-muted hover:text-brand-neon"
                                    )}
                                >
                                    {link.name}
                                    {isActive && (
                                        <motion.div layoutId="activeNav" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-brand-neon rounded-full drop-shadow-[0_0_5px_rgba(255,94,0,0.8)]" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="hidden md:flex flex-1 items-center justify-end gap-4 z-[9999]">
                        {!isAuthenticated ? (
                            <Button variant="ghost" size="sm" className="flex items-center border border-brand-border/40 hover:bg-brand-surface/50 text-brand-text" onClick={() => navigate('/login')} rightIcon={<LogIn className="w-4 h-4" />}>
                                Login
                            </Button>
                        ) : (
                            <div className="flex items-center gap-3 bg-brand-surface/30 pl-1 pr-3 py-1 rounded-full border border-brand-border/40 shadow-sm backdrop-blur-sm">
                                <div className="flex items-center gap-2.5 cursor-default">
                                    <div className="w-8 h-8 rounded-full bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon font-bold text-sm shadow-[0_0_10px_rgba(255,94,0,0.1)]">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col pr-2 border-r border-brand-border/60">
                                        <span className="text-[13px] font-semibold text-brand-text leading-tight truncate max-w-[100px]">{user?.name?.split(' ')[0]}</span>
                                        <span className="text-[9px] text-brand-neon font-medium leading-tight uppercase tracking-widest">{getRoleDisplayName(userRole)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                                        <button onClick={() => navigate('/dashboard')} className="p-1.5 text-brand-muted hover:text-brand-neon hover:bg-brand-neon/10 rounded-full transition-colors" title="Painel de Gestão"><LayoutDashboard className="w-4 h-4" /></button>
                                    )}
                                    {userRole === 'COMERCIAL' && (
                                        <button onClick={() => navigate('/crm')} className="p-1.5 text-brand-muted hover:text-brand-neon hover:bg-brand-neon/10 rounded-full transition-colors" title="Área Comercial"><Briefcase className="w-4 h-4" /></button>
                                    )}
                                    {userRole === 'USER' && (
                                        <button onClick={() => navigate('/perfil')} className="p-1.5 text-brand-muted hover:text-brand-neon hover:bg-brand-neon/10 rounded-full transition-colors" title="Meu Perfil"><UserIcon className="w-4 h-4" /></button>
                                    )}
                                    <button onClick={signOut} className="p-1.5 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors" title="Sair"><LogOut className="w-4 h-4" /></button>
                                </div>
                            </div>
                        )}

                        {(!isAuthenticated || userRole === 'USER') && (
                            <Button size="sm" className="shadow-[0_0_15px_rgba(255,94,0,0.2)] hover:shadow-[0_0_25px_rgba(255,94,0,0.4)] transition-shadow" rightIcon={<ArrowRight className="w-4 h-4" />} onClick={() => navigate('/mapa')} onMouseEnter={() => panelsService.getMapMarkers().catch(() => {})}>
                                Orçamento
                            </Button>
                        )}
                    </div>

                    {/* ========================================================= */}
                    {/* MOBILE LAYOUT (App Pattern)                                 */}
                    {/* ========================================================= */}
                    <div className="md:hidden flex flex-1 justify-end z-[9999]">
                        <button
                            type="button"
                            className="p-2 -mr-2 text-brand-text hover:text-brand-neon transition-colors relative"
                            onClick={() => setIsOpen(!isOpen)}
                            aria-label="Alternar menu"
                        >
                            {!isOpen && isAuthenticated ? (
                                <div className="w-7 h-7 rounded-full bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon font-bold text-xs">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                            ) : isOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* OVERLAY DE MENU MOBILE ESTILO APLICATIVO */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 top-16 bg-[#0A0A0B]/98 backdrop-blur-2xl z-[9998] md:hidden border-t border-brand-border/20 flex flex-col"
                    >
                        <div className="flex flex-col h-full px-5 py-6 overflow-y-auto">
                            
                            {/* Card de Usuário ou CTA de Login */}
                            {isAuthenticated ? (
                                <div className="bg-[#111113] border border-brand-border/30 rounded-2xl p-4 flex items-center gap-4 shadow-lg mb-8" onClick={() => { setIsOpen(false); navigate(userRole === 'USER' ? '/perfil' : userRole === 'COMERCIAL' ? '/crm' : '/dashboard'); }}>
                                    <div className="w-12 h-12 rounded-full bg-brand-neon/20 border border-brand-neon flex items-center justify-center text-brand-neon font-black text-xl shadow-[0_0_15px_rgba(255,94,0,0.2)]">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <span className="text-base font-bold text-white line-clamp-1">{user?.name}</span>
                                        <span className="text-xs text-brand-neon uppercase font-bold tracking-wider">{getRoleDisplayName(userRole)}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-brand-muted" />
                                </div>
                            ) : (
                                <div className="bg-gradient-to-r from-brand-neon/10 to-[#111113] border border-brand-neon/30 rounded-2xl p-5 flex flex-col gap-3 shadow-lg mb-8">
                                    <h3 className="text-sm font-bold text-white">Já é cliente T3?</h3>
                                    <Button className="w-full text-sm font-black text-black bg-brand-neon" onClick={() => { setIsOpen(false); navigate('/login'); }}>
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
                                                isActive ? "bg-brand-neon/10 border-brand-neon shadow-[0_0_10px_rgba(255,94,0,0.1)]" : "bg-[#111113] border-brand-border/20 active:bg-brand-surface/40"
                                            )}
                                        >
                                            <span className={cn("text-sm font-bold", isActive ? "text-brand-neon" : "text-white")}>{link.name}</span>
                                            <ChevronRight className={cn("w-4 h-4", isActive ? "text-brand-neon" : "text-brand-muted")} />
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Logout Bottom */}
                            {isAuthenticated && (
                                <div className="mt-auto pb-safe">
                                    <button 
                                        onClick={() => { setIsOpen(false); signOut(); }}
                                        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 font-bold text-sm active:bg-red-500/20 transition-all"
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