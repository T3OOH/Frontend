import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

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

    return (
        <>
            {/* O Header base agora tem z-[9999] para ficar acima de botões de mapa */}
            <header 
                className={cn(
                    "fixed top-0 inset-x-0 h-20 z-[9999] transition-all duration-300 border-b",
                    scrolled 
                        ? "bg-[#0A0A0B]/90 backdrop-blur-md border-brand-border/40 shadow-lg" 
                        : "bg-transparent border-transparent"
                )}
            >
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-4">

                    <div className="flex-1 flex justify-start items-center">
                        <Link to="/" className="z-[9999] group">
                            <motion.div 
                                className="flex items-center gap-1.5"
                                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <img 
                                    src="/LOGO T3 BRANCO COM LARANJA somente t3.PNG" 
                                    alt="Logo T3" 
                                    className="h-12 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,94,0,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(255,94,0,0.6)] transition-all"
                                />
                            </motion.div>
                        </Link>
                    </div>

                    <nav className="hidden md:flex flex-none items-center gap-8">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        "text-sm font-semibold transition-all duration-300 relative py-2",
                                        isActive
                                            ? "text-brand-text drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                            : "text-brand-muted hover:text-brand-neon"
                                    )}
                                >
                                    {link.name}
                                    {isActive && (
                                        <motion.div 
                                            layoutId="activeNav"
                                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-brand-neon rounded-full drop-shadow-[0_0_5px_rgba(255,94,0,0.8)]"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="hidden md:flex flex-1 items-center justify-end gap-4 z-[9999]">
                        {!isAuthenticated ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center border border-brand-border/40 hover:bg-brand-surface/50 text-brand-text"
                                onClick={() => navigate('/login')}
                                rightIcon={<LogIn className="w-4 h-4" />}
                            >
                                Login
                            </Button>
                        ) : (
                            <div className="flex items-center gap-3 bg-brand-surface/30 pl-1 pr-3 py-1 rounded-full border border-brand-border/40 shadow-sm backdrop-blur-sm">
                                <div className="flex items-center gap-2.5 cursor-default">
                                    <div className="w-8 h-8 rounded-full bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon font-bold text-sm shadow-[0_0_10px_rgba(255,94,0,0.1)]">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col pr-2 border-r border-brand-border/60">
                                        <span className="text-[13px] font-semibold text-brand-text leading-tight truncate max-w-[100px]">
                                            {user?.name?.split(' ')[0]}
                                        </span>
                                        <span className="text-[9px] text-brand-neon font-medium leading-tight uppercase tracking-widest">
                                            {user?.role === 'USER' ? 'Cliente' : 'Gestor'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                                        <button 
                                            onClick={() => navigate('/dashboard')}
                                            className="p-1.5 text-brand-muted hover:text-brand-neon hover:bg-brand-neon/10 rounded-full transition-colors"
                                            title="Painel de Gestão"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button 
                                        onClick={signOut}
                                        className="p-1.5 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                                        title="Sair"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {user?.role !== 'ADMIN' && user?.role !== 'MANAGER' && (
                            <Button 
                                size="sm" 
                                className="shadow-[0_0_15px_rgba(255,94,0,0.2)] hover:shadow-[0_0_25px_rgba(255,94,0,0.4)] transition-shadow"
                                rightIcon={<ArrowRight className="w-4 h-4" />}
                                onClick={() => navigate('/mapa')}
                            >
                                Orçamento
                            </Button>
                        )}
                    </div>

                    <div className="md:hidden flex-1 flex justify-end">
                        <button
                            type="button"
                            className="relative z-[9999] p-2 -mr-2 text-brand-text hover:text-brand-neon transition-colors"
                            onClick={() => setIsOpen(!isOpen)}
                            aria-label="Alternar menu"
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* A Gaveta também recebe z-[9998] para empurrar mapas e outros floats para trás */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 top-20 bg-[#0A0A0B]/95 backdrop-blur-xl z-[9998] md:hidden border-t border-brand-border/40 flex flex-col"
                    >
                        <div className="flex flex-col h-full p-6 pb-24 overflow-y-auto">
                            <nav className="flex flex-col gap-6 mt-4">
                                {navLinks.map((link) => {
                                    const isActive = location.pathname === link.path;
                                    return (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "text-2xl font-bold tracking-tight transition-colors duration-300",
                                                isActive ? "text-brand-neon drop-shadow-[0_0_10px_rgba(255,94,0,0.3)]" : "text-brand-text hover:text-brand-neon"
                                            )}
                                        >
                                            {link.name}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="mt-auto flex flex-col gap-4 pt-8">
                                {isAuthenticated && (
                                    <div className="flex items-center justify-between p-4 bg-brand-surface/30 border border-brand-border/40 rounded-xl mb-2 backdrop-blur-md">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon font-bold text-lg shadow-[0_0_10px_rgba(255,94,0,0.1)]">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-base font-semibold text-brand-text leading-tight">
                                                    {user?.name?.split(' ')[0]}
                                                </span>
                                                <span className="text-[10px] text-brand-neon uppercase tracking-wider font-medium mt-0.5">
                                                    {user?.role === 'USER' ? 'Cliente' : 'Gestor'}
                                                </span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => { setIsOpen(false); signOut(); }} 
                                            className="p-2 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Sair"
                                        >
                                            <LogOut className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}

                                {!isAuthenticated ? (
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        className="w-full justify-center border-brand-border/40"
                                        onClick={() => { setIsOpen(false); navigate('/login'); }}
                                        rightIcon={<LogIn className="w-5 h-5" />}
                                    >
                                        Login
                                    </Button>
                                ) : (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        className="w-full justify-center border-brand-border/40"
                                        onClick={() => { setIsOpen(false); navigate('/dashboard'); }}
                                        rightIcon={<LayoutDashboard className="w-5 h-5" />}
                                    >
                                        Painel de Gestão
                                    </Button>
                                )}

                                {user?.role !== 'ADMIN' && user?.role !== 'MANAGER' && (
                                    <Button 
                                        size="lg" 
                                        className="w-full justify-center shadow-[0_0_15px_rgba(255,94,0,0.2)]" 
                                        rightIcon={<ArrowRight className="w-5 h-5" />}
                                        onClick={() => { setIsOpen(false); navigate('/mapa'); }}
                                    >
                                        Solicitar Orçamento
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}