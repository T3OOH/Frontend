import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext'; // <-- Adicionado o Contexto de Tema
import { 
    LayoutDashboard, 
    Filter, 
    Users, 
    FileText, 
    Calendar, 
    LogOut, 
    Globe, 
    Menu, 
    X,
    Ticket,
    ChevronRight,
    Sun, // Ícones para o toggle de tema
    Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CrmLayout() {
    const { signOut, user } = useAuth();
    const { theme, toggleTheme } = useTheme(); // Puxa o tema atual e a função de trocar
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
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    const handleLogout = () => {
        setIsMobileMenuOpen(false);
        signOut();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

    // Lógica do design da Pílula Invertida para links ativos (Xenith UI)
    const getLinkStyle = (path: string, exact: boolean = false) => {
        const active = exact ? location.pathname === path : isActive(path);
        if (active) {
            return 'bg-brand-text text-brand-surface font-bold shadow-md';
        }
        return 'text-brand-muted hover:bg-brand-background hover:text-brand-text font-medium';
    };

    return (
        // ADICIONADO AQUI A CLASSE "dashboard-light" CONDICIONAL PARA BLINDAR O SITE PÚBLICO
        <div className={`flex h-[100dvh] w-full overflow-hidden relative transition-colors duration-300 bg-brand-background text-brand-text ${theme === 'light' ? 'dashboard-light' : ''}`}>
            
            {/* ========================================================= */}
            {/* VIEWPORT: DESKTOP                                         */}
            {/* ========================================================= */}
            <aside className="hidden lg:flex w-[260px] flex-col flex-shrink-0 bg-brand-surface border-r border-brand-border z-50 transition-colors duration-300">
                
                {/* LOGO E CABEÇALHO */}
                <div className="h-24 flex flex-col justify-center items-center gap-1 border-b border-brand-border shrink-0">
                    <img 
                        src={theme === 'dark' ? "/t3d 2.png" : "/T3 Black.png"} // <-- NOME DA SUA LOGO PRETA AQUI
                        alt="Logo T3 OOH" 
                        className="h-9 w-auto object-contain" 
                    />
                    <p className="text-[9px] text-brand-muted tracking-[0.2em] uppercase font-bold text-center">
                        Módulo Comercial
                    </p>
                </div>

                {/* NAVEGAÇÃO PRINCIPAL */}
                <nav className="flex-1 flex flex-col gap-1.5 custom-scrollbar overflow-y-auto p-5">
                    <span className="text-[10px] font-black uppercase text-brand-muted/70 tracking-widest pl-3 mb-2 mt-2">Visão Geral</span>
                    <Link to="/crm" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${getLinkStyle('/crm', true)}`}>
                        <LayoutDashboard className="w-[18px] h-[18px]" /> Dashboard
                    </Link>

                    <Link to="/crm/pipeline" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${getLinkStyle('/crm/pipeline')}`}>
                        <Filter className="w-[18px] h-[18px]" /> Funil de Vendas
                    </Link>

                    <Link to="/crm/clientes" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${getLinkStyle('/crm/clientes')}`}>
                        <Users className="w-[18px] h-[18px]" /> Minha Carteira
                    </Link>

                    <span className="text-[10px] font-black uppercase text-brand-muted/70 tracking-widest pl-3 mb-2 mt-6">Ferramentas</span>
                    <Link to="/crm/propostas" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${getLinkStyle('/crm/propostas')}`}>
                        <FileText className="w-[18px] h-[18px]" /> Propostas Comerciais
                    </Link>

                    <Link to="/crm/agenda" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${getLinkStyle('/crm/agenda')}`}>
                        <Calendar className="w-[18px] h-[18px]" /> Agenda & Tarefas
                    </Link>

                    <Link to="/crm/cupons" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${getLinkStyle('/crm/cupons')}`}>
                        <Ticket className="w-[18px] h-[18px]" /> Cupons & Descontos
                    </Link>
                </nav>

                {/* BOTTOM AREA: PERFIL E ALAVANCA DE TEMA */}
                <div className="p-5 border-t border-brand-border bg-brand-surface shrink-0 flex flex-col gap-3">
                    
                    {/* Alavanca de Tema (Switch Claro/Escuro) */}
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

                    {/* Perfil e Saída */}
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-full bg-brand-neon/10 text-brand-neon font-black text-sm flex items-center justify-center shrink-0">
                                {user?.name?.charAt(0).toUpperCase() || 'C'}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-brand-text truncate">{user?.name || 'Vendedor'}</span>
                                <span className="text-[9px] text-brand-muted tracking-wider uppercase truncate">{user?.role || 'COMERCIAL'}</span>
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

            {/* ÁREA CENTRAL DESKTOP */}
            <main className="hidden lg:flex flex-1 flex-col h-screen overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <Outlet />
                </div>
            </main>

            {/* ========================================================= */}
            {/* VIEWPORT: MOBILE (APP PATTERN NATIVO)                       */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full h-full relative">
                
                {/* Header (App Bar) Fixa no Topo */}
                <div className="sticky top-0 z-40 bg-brand-surface/95 backdrop-blur-xl border-b border-brand-border px-4 py-3 flex items-center justify-between shadow-sm pt-[env(safe-area-inset-top,12px)] transition-colors duration-300">
                    <div className="flex items-center gap-3">
                        <img 
                            src={theme === 'dark' ? "/t3d 2.png" : "/logo-preta.png"} // <-- NOME DA SUA LOGO PRETA AQUI
                            alt="T3 Logo" 
                            className="h-7 w-auto object-contain" 
                        />
                        <span className="text-[9px] font-bold text-brand-neon uppercase tracking-widest bg-brand-neon/10 px-2 py-1 rounded border border-brand-neon/20">
                            CRM
                        </span>
                    </div>
                    <button onClick={toggleTheme} className="p-2 bg-brand-background rounded-full border border-brand-border text-brand-text">
                        {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>

                {/* Área de Rolagem do Conteúdo. */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-[100px]">
                    <Outlet />
                </div>

                {/* Bottom Navigation Nativa */}
                <div className="fixed bottom-0 left-0 right-0 bg-brand-surface/95 backdrop-blur-2xl border-t border-brand-border z-[100] px-4 sm:px-6 py-3 flex justify-between items-center pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)] transition-colors duration-300">
                    <Link to="/crm" className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${location.pathname === '/crm' ? 'text-brand-neon' : 'text-brand-muted hover:text-brand-text'}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span className={`text-[9px] ${location.pathname === '/crm' ? 'font-bold' : 'font-medium'}`}>Início</span>
                    </Link>
                    <Link to="/crm/pipeline" className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${isActive('/crm/pipeline') ? 'text-brand-neon' : 'text-brand-muted hover:text-brand-text'}`}>
                        <Filter className="w-5 h-5" />
                        <span className={`text-[9px] ${isActive('/crm/pipeline') ? 'font-bold' : 'font-medium'}`}>Funil</span>
                    </Link>
                    <Link to="/crm/clientes" className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${isActive('/crm/clientes') ? 'text-brand-neon' : 'text-brand-muted hover:text-brand-text'}`}>
                        <Users className="w-5 h-5" />
                        <span className={`text-[9px] ${isActive('/crm/clientes') ? 'font-bold' : 'font-medium'}`}>Clientes</span>
                    </Link>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center gap-1 min-w-[64px] text-brand-muted hover:text-brand-text transition-colors">
                        <Menu className="w-5 h-5" />
                        <span className="text-[9px] font-medium">Menu</span>
                    </button>
                </div>
            </div>

            {/* ========================================================= */}
            {/* OVERLAY DE MENU MOBILE ESTILO APLICATIVO                    */}
            {/* ========================================================= */}
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
                            <h2 className="text-lg font-bold text-brand-text tracking-tight">Módulo Comercial</h2>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-brand-surface rounded-full border border-brand-border text-brand-muted hover:text-brand-text">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-col h-full px-5 py-6 overflow-y-auto custom-scrollbar">
                            
                            {/* Card Resumo do Usuário */}
                            <div className="bg-brand-surface border border-brand-border rounded-[24px] p-4 flex items-center gap-4 shadow-sm mb-8">
                                <div className="w-12 h-12 rounded-full bg-brand-neon/10 border border-brand-neon flex items-center justify-center text-brand-neon font-black text-xl shadow-sm">
                                    {user?.name?.charAt(0).toUpperCase() || 'C'}
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="text-base font-bold text-brand-text line-clamp-1">{user?.name || 'Vendedor'}</span>
                                    <span className="text-xs text-brand-neon uppercase font-bold tracking-wider">{user?.role || 'COMERCIAL'}</span>
                                </div>
                            </div>

                            {/* Menu de Navegação Secundária */}
                            <div className="flex flex-col gap-2 mb-8">
                                <h4 className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-2 mb-2">Ferramentas</h4>
                                
                                <Link onClick={() => setIsMobileMenuOpen(false)} to="/crm/propostas" className="flex items-center justify-between p-4 rounded-xl border bg-brand-surface border-brand-border hover:border-brand-neon/50 transition-all">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-brand-muted" />
                                        <span className="text-sm font-bold text-brand-text">Propostas Comerciais</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-brand-muted" />
                                </Link>

                                <Link onClick={() => setIsMobileMenuOpen(false)} to="/crm/agenda" className="flex items-center justify-between p-4 rounded-xl border bg-brand-surface border-brand-border hover:border-brand-neon/50 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-brand-muted" />
                                        <span className="text-sm font-bold text-brand-text">Agenda & Tarefas</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-brand-muted" />
                                </Link>

                                <Link onClick={() => setIsMobileMenuOpen(false)} to="/crm/cupons" className="flex items-center justify-between p-4 rounded-xl border bg-brand-surface border-brand-border hover:border-brand-neon/50 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Ticket className="w-5 h-5 text-brand-muted" />
                                        <span className="text-sm font-bold text-brand-text">Cupons & Descontos</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-brand-muted" />
                                </Link>

                                <h4 className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-2 mt-6 mb-2">Sistema</h4>

                                <Link onClick={() => setIsMobileMenuOpen(false)} to="/" className="flex items-center justify-between p-4 rounded-xl border bg-brand-surface border-brand-border hover:border-brand-neon/50 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-5 h-5 text-brand-muted" />
                                        <span className="text-sm font-bold text-brand-text">Acessar Site Público</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-brand-muted" />
                                </Link>
                            </div>

                            {/* Botão de Saída ao final da rolagem */}
                            <div className="mt-auto pb-safe">
                                <button 
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 font-bold text-sm active:bg-red-500/20 transition-all"
                                >
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