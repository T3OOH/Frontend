import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
    LayoutDashboard, Map as MapIcon, List, LogOut, Globe, Menu, X,
    Users, ShoppingCart, ReceiptText, Sun, Moon, Images, 
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function DashboardLayout() {
    const { signOut, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen]);

    const handleLogout = () => {
        setIsMobileMenuOpen(false);
        signOut();
        navigate('/login');
    };

    const getLinkStyle = (path: string, exact: boolean = false) => {
        const isActive = exact ? location.pathname === path : location.pathname.includes(path);
        if (isActive) {
            return 'bg-brand-text text-brand-surface font-bold shadow-md';
        }
        return 'text-brand-muted hover:bg-brand-background hover:text-brand-text font-medium';
    };

    return (
        <div className={`flex h-[100dvh] w-full overflow-hidden relative transition-colors duration-300 bg-brand-background text-brand-text ${theme === 'light' ? 'dashboard-light' : ''}`}>

            {/* ========================================================= */}
            {/* DESKTOP SIDEBAR (ESTILO XENITH UI)                        */}
            {/* ========================================================= */}
            <aside className="hidden lg:flex w-[260px] flex-col flex-shrink-0 bg-brand-surface border-r border-brand-border/50 z-50 transition-colors duration-300">

                {/* LOGO */}
                <div className="h-24 flex flex-col justify-center items-center gap-1 border-b border-brand-border/30 shrink-0">
                    <img src={theme === 'dark' ? "/t3d 2.png" : "/T3 Black.png"} alt="Logo T3 OOH" className="h-9 w-auto object-contain" />
                    <p className="text-[9px] text-brand-muted tracking-[0.2em] uppercase font-bold text-center">Painel de Gestão</p>
                </div>

                {/* NAVEGAÇÃO PRINCIPAL */}
                <nav className="flex-1 flex flex-col gap-1.5 custom-scrollbar overflow-y-auto p-5">
                    <span className="text-[10px] font-black uppercase text-brand-muted/70 tracking-widest pl-3 mb-2 mt-2">Geral</span>
                    <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${getLinkStyle('/dashboard', true)}`}>
                        <LayoutDashboard className="w-[18px] h-[18px]" /> Visão Geral
                    </Link>

                    <Link to="/dashboard/paineis" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${getLinkStyle('/dashboard/paineis')}`}>
                        <List className="w-[18px] h-[18px]" /> Meus Painéis
                    </Link>

                    <Link to="/dashboard/pedidos" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${getLinkStyle('/dashboard/pedidos')}`}>
                        <ShoppingCart className="w-[18px] h-[18px]" /> Pedidos
                    </Link>

                    <Link to="/dashboard/mapa" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${getLinkStyle('/dashboard/mapa')}`}>
                        <MapIcon className="w-[18px] h-[18px]" /> Mapa de Cobertura
                    </Link>

                    <span className="text-[10px] font-black uppercase text-brand-muted/70 tracking-widest pl-3 mb-2 mt-6">Produtos & Soluções</span>
                    <Link to="/dashboard/solution" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${getLinkStyle('/dashboard/solution')}`}>
                        <Images className="w-[18px] h-[18px]" /> Gestão T3 Solution
                    </Link>

                    <span className="text-[10px] font-black uppercase text-brand-muted/70 tracking-widest pl-3 mb-2 mt-6">Administração</span>
                    <Link to="/dashboard/usuarios" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${getLinkStyle('/dashboard/usuarios')}`}>
                        <Users className="w-[18px] h-[18px]" /> Equipe
                    </Link>

                    <Link to="/crm" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${getLinkStyle('/crm')}`}>
                        <ReceiptText className="w-[18px] h-[18px]" /> Central CRM
                    </Link>
                </nav>

                {/* BOTTOM AREA: PERFIL E ALAVANCA DE TEMA */}
                <div className="p-5 border-t border-brand-border/30 bg-brand-surface shrink-0 flex flex-col gap-3">

                    <div className="flex items-center justify-between px-3 py-2 bg-brand-background rounded-full border border-brand-border">
                        <span className="text-xs font-bold text-brand-muted ml-1">Tema</span>
                        <button
                            onClick={toggleTheme}
                            className="relative flex items-center justify-between w-12 h-6 bg-brand-border rounded-full p-1 transition-colors focus:outline-none"
                        >
                            <motion.div
                                className="w-4 h-4 bg-brand-surface rounded-full shadow-md flex items-center justify-center"
                                layout
                                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                                animate={{ x: theme === 'dark' ? 24 : 0 }}
                            >
                                {theme === 'light' ? <Sun className="w-2.5 h-2.5 text-brand-neon" /> : <Moon className="w-2.5 h-2.5 text-brand-neon" />}
                            </motion.div>
                        </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-full bg-brand-neon/10 text-brand-neon font-black text-sm flex items-center justify-center shrink-0">
                                {user?.name?.charAt(0).toUpperCase() || 'G'}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-brand-text truncate">{user?.name || 'Gestor'}</span>
                                <span className="text-[9px] text-brand-muted tracking-wider uppercase truncate">{user?.role || 'MANAGER'}</span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-brand-muted hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors" title="Sair">
                            <LogOut className="w-[18px] h-[18px]" />
                        </button>
                    </div>

                    <Link to="/" className="flex items-center justify-center gap-2 py-2 mt-1 w-full text-center rounded-lg hover:bg-brand-background text-brand-muted hover:text-brand-text transition-colors text-[11px] font-bold uppercase tracking-wider">
                        <Globe className="w-3.5 h-3.5" /> Site Público
                    </Link>
                </div>
            </aside>

            {/* ========================================================= */}
            {/* ÁREA CENTRAL DESKTOP (CONTEÚDO)                           */}
            {/* ========================================================= */}
            <main className="hidden lg:flex flex-1 flex-col h-screen overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <Outlet />
                </div>
            </main>

            {/* ========================================================= */}
            {/* MOBILE LAYOUT (APP PATTERN NATIVO)                        */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full h-full relative">

                <div className="sticky top-0 z-40 bg-brand-surface/95 backdrop-blur-xl border-b border-brand-border/50 px-4 py-3 flex items-center justify-between shadow-sm pt-[env(safe-area-inset-top,12px)] transition-colors duration-300">
                    <div className="flex items-center gap-3">
                        <img src="/t3d 2.png" alt="T3 Logo" className="h-7 w-auto object-contain" />
                        <span className="text-[9px] font-bold text-brand-neon uppercase tracking-widest bg-brand-neon/10 px-2 py-1 rounded border border-brand-neon/20">
                            Gestor
                        </span>
                    </div>
                    <button onClick={toggleTheme} className="p-2 bg-brand-background rounded-full border border-brand-border text-brand-text">
                        {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-[100px]">
                    <Outlet />
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-brand-surface/95 backdrop-blur-2xl border-t border-brand-border z-[100] px-4 sm:px-6 py-3 flex justify-between items-center pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)] transition-colors duration-300">
                    <Link to="/dashboard" className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${location.pathname === '/dashboard' ? 'text-brand-neon' : 'text-brand-muted hover:text-brand-text'}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span className={`text-[9px] ${location.pathname === '/dashboard' ? 'font-bold' : 'font-medium'}`}>Início</span>
                    </Link>
                    <Link to="/dashboard/paineis" className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${location.pathname.includes('/dashboard/paineis') ? 'text-brand-neon' : 'text-brand-muted hover:text-brand-text'}`}>
                        <List className="w-5 h-5" />
                        <span className={`text-[9px] ${location.pathname.includes('/dashboard/paineis') ? 'font-bold' : 'font-medium'}`}>Painéis</span>
                    </Link>
                    <Link to="/dashboard/pedidos" className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${location.pathname.includes('/dashboard/pedidos') ? 'text-brand-neon' : 'text-brand-muted hover:text-brand-text'}`}>
                        <ShoppingCart className="w-5 h-5" />
                        <span className={`text-[9px] ${location.pathname.includes('/dashboard/pedidos') ? 'font-bold' : 'font-medium'}`}>Pedidos</span>
                    </Link>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center gap-1 min-w-[64px] text-brand-muted hover:text-brand-text transition-colors">
                        <Menu className="w-5 h-5" />
                        <span className="text-[9px] font-medium">Menu</span>
                    </button>
                </div>
            </div>

            {/* OVERLAY DE MENU MOBILE */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9999] lg:hidden bg-brand-background/98 backdrop-blur-2xl flex flex-col pt-[env(safe-area-inset-top,12px)]"
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
                            <h2 className="text-lg font-bold text-brand-text tracking-tight">Mais Opções</h2>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-brand-surface rounded-full border border-brand-border text-brand-muted hover:text-brand-text">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex flex-col h-full px-5 py-6 overflow-y-auto custom-scrollbar gap-4">
                            
                            <Link onClick={() => setIsMobileMenuOpen(false)} to="/dashboard/mapa" className="flex items-center gap-3 p-4 rounded-xl border border-brand-border bg-brand-surface text-brand-text font-bold text-sm">
                                <MapIcon className="w-5 h-5 text-brand-neon" /> Mapa de Cobertura
                            </Link>

                            <Link onClick={() => setIsMobileMenuOpen(false)} to="/dashboard/solution" className="flex items-center gap-3 p-4 rounded-xl border border-brand-border bg-brand-surface text-brand-text font-bold text-sm">
                                <Images className="w-5 h-5 text-brand-neon" /> Gestão T3 Solution
                            </Link>
                            
                            <Link onClick={() => setIsMobileMenuOpen(false)} to="/dashboard/usuarios" className="flex items-center gap-3 p-4 rounded-xl border border-brand-border bg-brand-surface text-brand-text font-bold text-sm">
                                <Users className="w-5 h-5 text-brand-neon" /> Gerenciar Equipe
                            </Link>

                            <Link onClick={() => setIsMobileMenuOpen(false)} to="/crm" className="flex items-center gap-3 p-4 rounded-xl border border-brand-border bg-brand-surface text-brand-text font-bold text-sm">
                                <ReceiptText className="w-5 h-5 text-brand-neon" /> Central CRM
                            </Link>

                            <div className="mt-auto pb-safe pt-8">
                                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 font-bold text-sm active:bg-red-500/20 transition-all">
                                    <LogOut className="w-4 h-4" /> Sair do Sistema
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}