import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Map as MapIcon, List, LogOut, Globe, Menu, X } from 'lucide-react';

export function DashboardLayout() {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Estado para controlar a abertura da barra lateral no Mobile
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Fecha o menu mobile automaticamente sempre que a rota mudar
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        signOut();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-brand-black overflow-hidden relative">

            {/* OVERLAY ESCURO PARA MOBILE (Clica fora e fecha o menu) */}
            {isMobileMenuOpen && (
                <div
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                />
            )}

            {/* BARRA LATERAL (Agora é responsiva: Fixed no Mobile, Static no Desktop) */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 flex flex-col flex-shrink-0
                border-r border-brand-border/50 bg-[#0A0A0B] lg:bg-brand-surface/30 p-5
                transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>

                {/* Botão de Fechar exclusivo do Mobile */}
                <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="absolute top-4 right-4 p-2 text-brand-muted hover:text-white lg:hidden"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* LOGO CENTRALIZADA */}
                <div className="mb-10 pt-2 flex flex-col items-center gap-2">
                    <img src="/t3d 2.png" alt="Logo T3 OOH" className="h-10 w-auto object-contain" />
                    <p className="text-[10px] text-brand-muted tracking-[0.2em] uppercase font-semibold text-center">Painel de Gestão</p>
                </div>

                <nav className="flex-1 flex flex-col gap-1.5">
                    <Link
                        to="/dashboard"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${isActive('/dashboard')
                                ? 'bg-brand-neon/10 text-brand-neon font-medium border border-brand-neon/20'
                                : 'text-brand-text/80 hover:bg-brand-surface hover:text-brand-neon border border-transparent'
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Visão Geral
                    </Link>

                    <Link
                        to="/dashboard/paineis"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${location.pathname.includes('/dashboard/paineis')
                                ? 'bg-brand-neon/10 text-brand-neon font-medium border border-brand-neon/20'
                                : 'text-brand-text/80 hover:bg-brand-surface hover:text-brand-neon border border-transparent'
                            }`}
                    >
                        <List className="w-4 h-4" />
                        Meus Painéis
                    </Link>

                    <Link
                        to="/dashboard/mapa"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${isActive('/dashboard/mapa')
                                ? 'bg-brand-neon/10 text-brand-neon font-medium border border-brand-neon/20'
                                : 'text-brand-text/80 hover:bg-brand-surface hover:text-brand-neon border border-transparent'
                            }`}
                    >
                        <MapIcon className="w-4 h-4" />
                        Mapa de Cobertura
                    </Link>
                </nav>

                <div className="pt-4 border-t border-brand-border/50 mt-auto">


                    <div className="mb-3 px-2 flex flex-col">
                        <span className="text-sm font-bold text-brand-text truncate">{user?.name || 'Gestor'}</span>
                        <span className="text-[10px] text-brand-muted font-medium tracking-wider uppercase">{user?.role || 'MANAGER'}</span>
                    </div>

                    <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-xl hover:bg-brand-surface text-brand-muted hover:text-brand-neon transition-colors text-sm font-medium mb-4"
                    >
                        <Globe className="w-4 h-4" />
                        Acessar Site Público
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-xl hover:bg-red-500/10 text-brand-muted hover:text-red-500 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair do Sistema
                    </button>
                </div>
            </aside>

            {/* 📺 ÁREA CENTRAL */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#0A0A0B]">

                {/* HEADER MOBILE (Visível apenas em telas pequenas) */}
                <div className="lg:hidden flex items-center justify-between p-4 border-b border-brand-border/50 bg-brand-surface/30 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <img src="/t3d 2.png" alt="T3 Logo" className="h-6 w-auto" />
                        <span className="text-xs font-bold text-brand-text tracking-widest uppercase opacity-80">Gestor</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 bg-brand-surface border border-brand-border/50 rounded-lg text-brand-text hover:text-brand-neon transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                {/* ÁREA DE SCROLL CONTEÚDO */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
                    <Outlet />
                </div>
            </main>

        </div>
    );
}