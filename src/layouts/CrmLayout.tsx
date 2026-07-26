import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
    LayoutDashboard, 
    Filter, 
    Users, 
    MessageSquare, 
    Calendar, 
    LogOut, 
    Globe, 
    Menu, 
    X,
    Ticket,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Componente de Layout principal para o Módulo Comercial (CRM).
 * Implementa a arquitetura de separação de viewports para garantir
 * uma experiência nativa de aplicativo em dispositivos móveis e um
 * painel administrativo clássico em telas maiores.
 */
export function CrmLayout() {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    /**
     * Ciclo de vida: Fecha o menu mobile automaticamente sempre que a rota for alterada.
     */
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    /**
     * Ciclo de vida: Previne a rolagem do corpo da página (body) quando o 
     * overlay do menu mobile estiver aberto, evitando comportamento indesejado.
     */
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

    /**
     * Processa a ação de logout do usuário, limpando o estado de autenticação
     * e redirecionando-o para a tela de acesso inicial.
     */
    const handleLogout = () => {
        setIsMobileMenuOpen(false);
        signOut();
        navigate('/login');
    };

    /**
     * Verifica se o caminho atual da aplicação corresponde à rota informada.
     * Útil para aplicar estilos ativos nos itens de navegação.
     * 
     * @param path - O caminho base a ser verificado.
     * @returns Boolean indicando se a rota está ativa.
     */
    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

    return (
        <div className="flex h-[100dvh] w-full bg-[#0A0A0B] overflow-hidden relative">
            
            {/* ========================================================= */}
            {/* VIEWPORT: DESKTOP                                           */}
            {/* ========================================================= */}
            <aside className="hidden lg:flex w-64 flex-col flex-shrink-0 border-r border-brand-border/50 bg-[#0A0A0B] lg:bg-brand-surface/30 p-5 z-50">
                
                <div className="mb-10 pt-2 flex flex-col items-center gap-2">
                    <img src="/t3d 2.png" alt="Logo T3 OOH" className="h-10 w-auto object-contain" />
                    <p className="text-[10px] text-brand-neon tracking-[0.2em] uppercase font-semibold text-center">
                        Módulo Comercial
                    </p>
                </div>

                <nav className="flex-1 flex flex-col gap-1.5 custom-scrollbar overflow-y-auto pr-2">
                    <Link
                        to="/crm"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${location.pathname === '/crm'
                                ? 'bg-brand-neon/10 text-brand-neon font-medium border border-brand-neon/20 shadow-[0_0_15px_rgba(255,94,0,0.1)]'
                                : 'text-brand-text/80 hover:bg-brand-surface hover:text-brand-neon border border-transparent'
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>

                    <Link
                        to="/crm/pipeline"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${isActive('/crm/pipeline')
                                ? 'bg-brand-neon/10 text-brand-neon font-medium border border-brand-neon/20 shadow-[0_0_15px_rgba(255,94,0,0.1)]'
                                : 'text-brand-text/80 hover:bg-brand-surface hover:text-brand-neon border border-transparent'
                            }`}
                    >
                        <Filter className="w-4 h-4" /> Funil de Vendas
                    </Link>

                    <Link
                        to="/crm/clientes"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${isActive('/crm/clientes')
                                ? 'bg-brand-neon/10 text-brand-neon font-medium border border-brand-neon/20 shadow-[0_0_15px_rgba(255,94,0,0.1)]'
                                : 'text-brand-text/80 hover:bg-brand-surface hover:text-brand-neon border border-transparent'
                            }`}
                    >
                        <Users className="w-4 h-4" /> Minha Carteira
                    </Link>

                    <Link
                        to="/crm/chat"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${isActive('/crm/chat')
                                ? 'bg-brand-neon/10 text-brand-neon font-medium border border-brand-neon/20 shadow-[0_0_15px_rgba(255,94,0,0.1)]'
                                : 'text-brand-text/80 hover:bg-brand-surface hover:text-brand-neon border border-transparent'
                            }`}
                    >
                        <MessageSquare className="w-4 h-4" /> Comunicações
                    </Link>

                    <Link
                        to="/crm/agenda"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${isActive('/crm/agenda')
                                ? 'bg-brand-neon/10 text-brand-neon font-medium border border-brand-neon/20 shadow-[0_0_15px_rgba(255,94,0,0.1)]'
                                : 'text-brand-text/80 hover:bg-brand-surface hover:text-brand-neon border border-transparent'
                            }`}
                    >
                        <Calendar className="w-4 h-4" /> Agenda & Tarefas
                    </Link>

                    <Link
                        to="/crm/cupons"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${isActive('/crm/cupons')
                                ? 'bg-brand-neon/10 text-brand-neon font-medium border border-brand-neon/20 shadow-[0_0_15px_rgba(255,94,0,0.1)]'
                                : 'text-brand-text/80 hover:bg-brand-surface hover:text-brand-neon border border-transparent'
                            }`}
                    >
                        <Ticket className="w-4 h-4" /> Cupons & Descontos
                    </Link>
                </nav>

                <div className="pt-4 border-t border-brand-border/50 mt-4 shrink-0">
                    <div className="mb-3 px-2 flex flex-col">
                        <span className="text-sm font-bold text-brand-text truncate">{user?.name || 'Vendedor'}</span>
                        <span className="text-[10px] text-brand-muted font-medium tracking-wider uppercase">{user?.role || 'COMERCIAL'}</span>
                    </div>

                    <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-xl hover:bg-brand-surface text-brand-muted hover:text-brand-neon transition-colors text-sm font-medium mb-2"
                    >
                        <Globe className="w-4 h-4" /> Acessar Site Público
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-xl hover:bg-red-500/10 text-brand-muted hover:text-red-500 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" /> Sair do Sistema
                    </button>
                </div>
            </aside>

            {/* ÁREA CENTRAL DESKTOP */}
            <main className="hidden lg:flex flex-1 flex-col h-screen overflow-hidden relative bg-[#0A0A0B]">
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <Outlet />
                </div>
            </main>

            {/* ========================================================= */}
            {/* VIEWPORT: MOBILE (APP PATTERN NATIVO)                       */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full h-full relative bg-[#0A0A0B]">
                
                {/* Header (App Bar) Fixa no Topo */}
                <div className="sticky top-0 z-40 bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-brand-border/20 px-4 py-3 flex items-center justify-between shadow-sm pt-[env(safe-area-inset-top,12px)]">
                    <div className="flex items-center gap-3">
                        <img src="/t3d 2.png" alt="T3 Logo" className="h-7 w-auto object-contain" />
                        <span className="text-[10px] font-bold text-brand-neon uppercase tracking-widest bg-brand-neon/10 px-2.5 py-1 rounded-md border border-brand-neon/20">
                            CRM
                        </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-brand-surface/80 border border-brand-border/40 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {user?.name?.charAt(0).toUpperCase() || 'C'}
                    </div>
                </div>

                {/* Área de Rolagem do Conteúdo. O padding inferior garante que a Bottom Nav não sobreponha a UI */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-[100px]">
                    <Outlet />
                </div>

                {/* Bottom Navigation Nativa */}
                <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-2xl border-t border-brand-border/20 z-[100] px-4 sm:px-6 py-3 flex justify-between items-center pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
                    <Link to="/crm" className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${location.pathname === '/crm' ? 'text-brand-neon' : 'text-brand-muted hover:text-white'}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span className={`text-[9px] ${location.pathname === '/crm' ? 'font-bold' : 'font-medium'}`}>Início</span>
                    </Link>
                    <Link to="/crm/pipeline" className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${isActive('/crm/pipeline') ? 'text-brand-neon' : 'text-brand-muted hover:text-white'}`}>
                        <Filter className="w-5 h-5" />
                        <span className={`text-[9px] ${isActive('/crm/pipeline') ? 'font-bold' : 'font-medium'}`}>Funil</span>
                    </Link>
                    <Link to="/crm/clientes" className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${isActive('/crm/clientes') ? 'text-brand-neon' : 'text-brand-muted hover:text-white'}`}>
                        <Users className="w-5 h-5" />
                        <span className={`text-[9px] ${isActive('/crm/clientes') ? 'font-bold' : 'font-medium'}`}>Clientes</span>
                    </Link>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center gap-1 min-w-[64px] text-brand-muted hover:text-white transition-colors">
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
                        className="fixed inset-0 z-[9999] lg:hidden bg-[#0A0A0B]/98 backdrop-blur-2xl flex flex-col pt-[env(safe-area-inset-top,12px)]"
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border/20">
                            <h2 className="text-lg font-bold text-white tracking-tight">Módulo Comercial</h2>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-[#111113] rounded-full border border-brand-border/40 text-brand-muted hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-col h-full px-5 py-6 overflow-y-auto custom-scrollbar">
                            
                            {/* Card Resumo do Usuário */}
                            <div className="bg-[#111113] border border-brand-border/30 rounded-2xl p-4 flex items-center gap-4 shadow-lg mb-8">
                                <div className="w-12 h-12 rounded-full bg-brand-neon/20 border border-brand-neon flex items-center justify-center text-brand-neon font-black text-xl shadow-[0_0_15px_rgba(255,94,0,0.2)]">
                                    {user?.name?.charAt(0).toUpperCase() || 'C'}
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="text-base font-bold text-white line-clamp-1">{user?.name || 'Vendedor'}</span>
                                    <span className="text-xs text-brand-neon uppercase font-bold tracking-wider">{user?.role || 'COMERCIAL'}</span>
                                </div>
                            </div>

                            {/* Menu de Navegação Secundária */}
                            <div className="flex flex-col gap-2 mb-8">
                                <h4 className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-2 mb-2">Ferramentas</h4>
                                
                                <Link onClick={() => setIsMobileMenuOpen(false)} to="/crm/chat" className="flex items-center justify-between p-4 rounded-xl border bg-[#111113] border-brand-border/20 active:bg-brand-surface/40 transition-all">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare className="w-5 h-5 text-brand-muted" />
                                        <span className="text-sm font-bold text-white">Comunicações</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-brand-muted" />
                                </Link>

                                <Link onClick={() => setIsMobileMenuOpen(false)} to="/crm/agenda" className="flex items-center justify-between p-4 rounded-xl border bg-[#111113] border-brand-border/20 active:bg-brand-surface/40 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-brand-muted" />
                                        <span className="text-sm font-bold text-white">Agenda & Tarefas</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-brand-muted" />
                                </Link>

                                <Link onClick={() => setIsMobileMenuOpen(false)} to="/crm/cupons" className="flex items-center justify-between p-4 rounded-xl border bg-[#111113] border-brand-border/20 active:bg-brand-surface/40 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Ticket className="w-5 h-5 text-brand-muted" />
                                        <span className="text-sm font-bold text-white">Cupons & Descontos</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-brand-muted" />
                                </Link>

                                <h4 className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-2 mt-6 mb-2">Sistema</h4>

                                <Link onClick={() => setIsMobileMenuOpen(false)} to="/" className="flex items-center justify-between p-4 rounded-xl border bg-[#111113] border-brand-border/20 active:bg-brand-surface/40 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-5 h-5 text-brand-muted" />
                                        <span className="text-sm font-bold text-white">Acessar Site Público</span>
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