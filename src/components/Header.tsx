import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, LogIn, LayoutDashboard } from 'lucide-react';
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

    // Efeito para detectar o scroll e deixar o header mais denso ao rolar a página
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
            <header 
                className={cn(
                    "fixed top-0 inset-x-0 h-20 z-50 transition-all duration-300 border-b",
                    scrolled 
                        ? "bg-[#0A0A0B]/90 backdrop-blur-md border-brand-border/40 shadow-lg" 
                        : "bg-transparent border-transparent"
                )}
            >
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">

                    {/* LOGO HARMONIZADA */}
                    <Link to="/" className="flex items-center z-50 group">
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

                    {/* NAVEGAÇÃO DESKTOP (Tipografia Premium) */}
                    <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
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
                                    {/* Indicador de link ativo sutil */}
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

                    {/* 💻 VERSÃO DESKTOP: Botões da direita */}
                    <div className="hidden md:flex items-center gap-4 z-50">
                        {!isAuthenticated ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center border border-brand-border/40 hover:bg-brand-surface/50 text-brand-text"
                                onClick={() => navigate('/login')}
                                rightIcon={<LogIn className="w-4 h-4" />}
                            >
                                Acessar Sistema
                            </Button>
                        ) : (
                            <div className="flex items-center gap-4 border-r border-brand-border/40 pr-4 mr-1">
                                {/* Info do Usuário Premium */}
                                <div className="flex items-center gap-3 text-brand-text">
                                    <div className="w-8 h-8 rounded-full bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon font-bold text-sm shadow-[0_0_10px_rgba(255,94,0,0.1)]">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold leading-none mb-1">
                                            {user?.name?.split(' ')[0]}
                                        </span>
                                        <span className="text-[9px] text-brand-neon font-medium leading-none uppercase tracking-widest">
                                            {user?.role === 'USER' ? 'Cliente' : 'Gestor'}
                                        </span>
                                    </div>
                                </div>

                                {/* Botão do Dashboard apenas para ADMIN/MANAGER */}
                                {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="px-2 hover:bg-brand-neon/10 hover:text-brand-neon transition-colors border border-transparent hover:border-brand-neon/20"
                                        onClick={() => navigate('/dashboard')}
                                        title="Painel de Gestão"
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                    </Button>
                                )}
                                
                                <button 
                                    onClick={signOut}
                                    className="text-[11px] font-medium text-brand-muted hover:text-red-500 transition-colors uppercase tracking-wider"
                                >
                                    Sair
                                </button>
                            </div>
                        )}

                        {/* O botão de Orçamento some para Gestores */}
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

                    <button
                        type="button"
                        className="md:hidden relative z-50 p-2 -mr-2 text-brand-text hover:text-brand-neon transition-colors"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Alternar menu"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            {/* VERSÃO MOBILE: Gaveta de Menu com Glassmorphism */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 top-20 bg-[#0A0A0B]/95 backdrop-blur-xl z-40 md:hidden border-t border-brand-border/40 flex flex-col"
                    >
                        <div className="flex flex-col h-full p-6 pb-24 overflow-y-auto">
                            <nav className="flex flex-col gap-6 mt-8">
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

                            <div className="mt-auto flex flex-col gap-4">
                                {/* CARD DO USUÁRIO MOBILE */}
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
                                            className="text-xs font-semibold uppercase tracking-wider text-brand-muted hover:text-red-500 transition-colors px-2 py-1"
                                        >
                                            Sair
                                        </button>
                                    </div>
                                )}

                                {/* BOTÕES DE AÇÃO MOBILE */}
                                {!isAuthenticated ? (
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        className="w-full justify-center border-brand-border/40"
                                        onClick={() => { setIsOpen(false); navigate('/login'); }}
                                        rightIcon={<LogIn className="w-5 h-5" />}
                                    >
                                        Acessar Sistema
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