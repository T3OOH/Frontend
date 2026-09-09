import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    Menu, X, ArrowRight, LogIn, LayoutDashboard, LogOut, 
    Briefcase, User as UserIcon, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { panelsService } from '@/services/panels.service';

// ==========================================
// NAVIGATION CONFIGURATION
// ==========================================
interface NavLink {
    name: string;
    path: string;
}

const navLinks: NavLink[] = [
    { name: 'Início', path: '/' },
    { name: 'Mapa de Painéis', path: '/mapa' },
    { name: 'Serviços', path: '/servicos' },
    { name: 'Contato', path: '/contato' },
    { name: 'Sobre Nós', path: '/sobre' },
    { name: 'T3 Solution', path: '/solution' },
];

export function Header() {
    // State Management
    const [isOpen, setIsOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    
    // Hooks & References
    const location = useLocation();
    const navigate = useNavigate();
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { isAuthenticated, user, signOut } = useAuth(); 

    // Scroll Observer for Dynamic Header Background
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Route Change Observer: Resets overlay menus state
    useEffect(() => {
        setIsOpen(false);
        setIsUserMenuOpen(false);
    }, [location.pathname]);

    // Body Scroll Lock for Mobile Menu Overlay
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

    // Click Outside Listener for User Dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Role display normalization
    const getRoleDisplayName = (role?: string) => {
        switch (role) {
            case 'ADMIN':
            case 'MANAGER': return 'Gestor';
            case 'COMERCIAL': return 'Comercial';
            case 'USER': return 'Cliente';
            default: return '';
        }
    };

    // Current Route contextualization
    const getRouteName = (path: string) => {
        if (path === '/') return 'Início';
        if (path.startsWith('/mapa')) return 'Mapa Interativo';
        if (path.startsWith('/servicos')) return 'Painéis OOH';
        if (path.startsWith('/contato')) return 'Contato';
        if (path.startsWith('/sobre')) return 'Sobre Nós';
        if (path.startsWith('/solution')) return 'T3 Solution';
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
            <header className="fixed top-0 inset-x-0 z-[500]">
                
                {/* Dynamic Gradient Overlay */}
                <div 
                    className={cn(
                        "absolute inset-x-0 top-0 h-[140px] md:h-[160px] pointer-events-none transition-opacity duration-500",
                        "bg-gradient-to-b from-[#0A0A0B] via-[#0A0A0B]/80 to-transparent",
                        scrolled ? "opacity-100" : "opacity-60"
                    )}
                />

                <div className="relative max-w-7xl mx-auto px-4 md:px-6 h-[72px] md:h-[90px] flex items-center justify-between gap-4">

                    {/* Left Section: Brand Logo */}
                    <div className="flex-1 flex justify-start items-center">
                        <Link to="/" className="group flex items-center relative z-50">
                            <motion.img 
                                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                src="/t3d 2.png" 
                                alt="Logo T3" 
                                className="h-8 md:h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,94,0,0.15)] group-hover:drop-shadow-[0_0_20px_rgba(255,94,0,0.5)] transition-all duration-300"
                            />
                        </Link>
                    </div>

                    {/* Mobile Center Section: Contextual Route Badge */}
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

                    {/* Desktop Center Section: Primary Navigation */}
                    <nav className="hidden md:flex flex-none items-center justify-center gap-8">
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
                                        "text-[13px] font-bold transition-all duration-300 relative py-2",
                                        isActive ? "text-[#FF5E00]" : "text-[#8F8F91] hover:text-white"
                                    )}
                                >
                                    {link.name}
                                    {isActive && (
                                        <motion.div 
                                            layoutId="activeNav" 
                                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF5E00] rounded-full shadow-[0_0_8px_rgba(255,94,0,0.8)]" 
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Section: Actions & User Avatar */}
                    <div className="hidden md:flex flex-1 items-center justify-end gap-3 relative z-50">
                        
                        {!isAuthenticated ? (
                            <Link to="/login">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="border border-white/10 bg-[#111113] hover:border-[#FF5E00]/50 hover:bg-[#FF5E00]/10 text-white transition-all rounded-xl shadow-sm h-10 px-5 text-xs" 
                                    rightIcon={<LogIn className="w-4 h-4 text-[#FF5E00]" />}
                                >
                                    Login
                                </Button>
                            </Link>
                        ) : (
                            <div className="relative" ref={userMenuRef}>
                                {/* Standardized Avatar Button */}
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className={cn(
                                        "w-10 h-10 rounded-full bg-[#111113]/80 border flex items-center justify-center shadow-sm backdrop-blur-md transition-all active:scale-95 group",
                                        isUserMenuOpen ? "border-[#FF5E00] shadow-[0_0_15px_rgba(255,94,0,0.2)]" : "border-white/10 hover:border-[#FF5E00]/50"
                                    )}
                                    aria-label="User Context Menu"
                                >
                                    <span className="text-[#FF5E00] font-black text-sm group-hover:scale-110 transition-transform">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </span>
                                </button>

                                {/* User Dropdown Overlay */}
                                <AnimatePresence>
                                    {isUserMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute right-0 top-[calc(100%+12px)] w-64 bg-[#111113]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col"
                                        >
                                            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-[#FF5E00]/5 to-transparent flex flex-col items-center text-center">
                                                <div className="w-14 h-14 rounded-full bg-[#0A0A0B] border border-[#FF5E00]/30 flex items-center justify-center text-[#FF5E00] font-black text-xl mb-3 shadow-[0_0_15px_rgba(255,94,0,0.15)]">
                                                    {user?.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <p className="text-sm font-bold text-white truncate w-full">{user?.name}</p>
                                                <p className="text-[10px] text-[#8F8F91] font-black uppercase tracking-widest mt-1">
                                                    {getRoleDisplayName(userRole)}
                                                </p>
                                            </div>
                                            
                                            <div className="p-2 flex flex-col gap-1">
                                                {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                                                    <button onClick={() => { setIsUserMenuOpen(false); navigate('/dashboard'); }} className="flex items-center gap-3 w-full p-3 rounded-xl text-[13px] font-bold text-[#8F8F91] hover:text-[#FF5E00] hover:bg-[#FF5E00]/10 transition-all text-left">
                                                        <LayoutDashboard className="w-[18px] h-[18px]" /> Gestão T3
                                                    </button>
                                                )}
                                                {userRole === 'COMERCIAL' && (
                                                    <button onClick={() => { setIsUserMenuOpen(false); navigate('/crm'); }} className="flex items-center gap-3 w-full p-3 rounded-xl text-[13px] font-bold text-[#8F8F91] hover:text-[#FF5E00] hover:bg-[#FF5E00]/10 transition-all text-left">
                                                        <Briefcase className="w-[18px] h-[18px]" /> CRM Comercial
                                                    </button>
                                                )}
                                                {userRole === 'USER' && (
                                                    <button onClick={() => { setIsUserMenuOpen(false); navigate('/perfil'); }} className="flex items-center gap-3 w-full p-3 rounded-xl text-[13px] font-bold text-[#8F8F91] hover:text-[#FF5E00] hover:bg-[#FF5E00]/10 transition-all text-left">
                                                        <UserIcon className="w-[18px] h-[18px]" /> Meu Perfil
                                                    </button>
                                                )}
                                                
                                                <div className="h-px bg-white/5 my-1 mx-2" />
                                                
                                                <button onClick={() => { setIsUserMenuOpen(false); signOut(); }} className="flex items-center gap-3 w-full p-3 rounded-xl text-[13px] font-bold text-red-500 hover:bg-red-500/10 transition-all text-left">
                                                    <LogOut className="w-[18px] h-[18px]" /> Sair da Conta
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* CTA Budget Requirement */}
                        {(!isAuthenticated || userRole === 'USER') && (
                            <Button 
                                size="sm" 
                                className="bg-[#FF5E00] hover:bg-[#e05300] text-[#0A0A0B] font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_4px_15px_rgba(255,94,0,0.2)] hover:shadow-[0_6px_20px_rgba(255,94,0,0.3)] transition-all border-none h-10 px-5 ml-1" 
                                rightIcon={<ArrowRight className="w-4 h-4" />} 
                                onClick={() => navigate('/mapa')} 
                                onMouseEnter={() => panelsService.getMapMarkers().catch(() => {})}
                            >
                                Orçamento
                            </Button>
                        )}
                    </div>

                    {/* Mobile Section: Menu Trigger */}
                    <div className="md:hidden flex flex-1 justify-end relative z-[60]">
                        <button
                            type="button"
                            className="p-2 -mr-2 text-white hover:text-[#FF5E00] transition-colors relative"
                            onClick={() => setIsOpen(!isOpen)}
                            aria-label="Toggle Navigation"
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

            {/* MOBILE NAVIGATION OVERLAY */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 pt-[72px] bg-[#0A0A0B]/98 backdrop-blur-3xl z-[490] md:hidden border-t border-white/5 flex flex-col"
                    >
                        <div className="flex flex-col h-full px-5 py-6 overflow-y-auto custom-scrollbar">
                            
                            {/* User Authentication Card or Login CTA */}
                            {isAuthenticated ? (
                                <div 
                                    className="bg-[#111113] border border-white/5 rounded-[20px] p-4 flex items-center gap-4 shadow-xl mb-8 active:scale-95 transition-transform" 
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
                                <div className="bg-[#111113] border border-[#FF5E00]/20 rounded-[24px] p-6 flex flex-col gap-4 shadow-xl mb-8 relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FF5E00]/10 rounded-full blur-2xl pointer-events-none" />
                                    <h3 className="text-sm font-bold text-white relative z-10">Já é cliente T3?</h3>
                                    <Button 
                                        className="w-full text-[13px] font-black text-[#0A0A0B] bg-[#FF5E00] uppercase tracking-widest rounded-xl relative z-10 border-none h-12" 
                                        onClick={() => { setIsOpen(false); navigate('/login'); }}
                                    >
                                        Fazer Login
                                    </Button>
                                </div>
                            )}

                            {/* Block Navigation Menu */}
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
                                                "flex items-center justify-between p-4 rounded-[16px] border transition-all",
                                                isActive ? "bg-[#FF5E00]/10 border-[#FF5E00]/50 shadow-inner" : "bg-[#111113] border-white/5 active:bg-white/5"
                                            )}
                                        >
                                            <span className={cn("text-sm font-bold", isActive ? "text-[#FF5E00]" : "text-white")}>{link.name}</span>
                                            <ChevronRight className={cn("w-4 h-4", isActive ? "text-[#FF5E00]" : "text-brand-muted")} />
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Authentication Exit Handler */}
                            {isAuthenticated && (
                                <div className="mt-auto pb-safe">
                                    <button 
                                        onClick={() => { setIsOpen(false); signOut(); }}
                                        className="w-full flex items-center justify-center gap-2 h-14 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 font-bold text-[13px] hover:bg-red-500/10 active:bg-red-500/20 transition-all uppercase tracking-widest"
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