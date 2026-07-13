import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Map as MapIcon, List, LogOut } from 'lucide-react';

export function DashboardLayout() {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        signOut();
        navigate('/login');
    };

    // Função auxiliar para saber qual menu está ativo
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-brand-black overflow-hidden">
            
            {/* 📋 BARRA LATERAL (Sidebar do Gestor) */}
            <aside className="w-64 border-r border-brand-border/50 bg-brand-surface/30 p-4 flex flex-col z-20">
                <div className="mb-10 px-2 pt-4">
                    <img src="/LOGO T3 BRANCO COM LARANJA somente t3.PNG" alt="Logo T3 OOH" className="h-10 w-auto object-contain" />
                    <p className="text-xs text-brand-muted tracking-widest uppercase mt-1">Painel de Gestão</p>
                </div>

                {/* Menu de Navegação */}
                <nav className="flex-1 flex flex-col gap-2">
                    <Link 
                        to="/dashboard" 
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                            isActive('/dashboard') 
                            ? 'bg-brand-neon/10 text-brand-neon font-medium' 
                            : 'text-brand-text hover:bg-brand-surface hover:text-brand-neon'
                        }`}
                    >
                        <LayoutDashboard className="w-5 h-5" /> 
                        Visão Geral
                    </Link>
                    
                    <Link 
                        to="/dashboard/paineis" 
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                            location.pathname.includes('/dashboard/paineis') 
                            ? 'bg-brand-neon/10 text-brand-neon font-medium' 
                            : 'text-brand-text hover:bg-brand-surface hover:text-brand-neon'
                        }`}
                    >
                        <List className="w-5 h-5" /> 
                        Meus Painéis
                    </Link>
                    
                    <Link 
                        to="/dashboard/mapa" 
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                            isActive('/dashboard/mapa') 
                            ? 'bg-brand-neon/10 text-brand-neon font-medium' 
                            : 'text-brand-text hover:bg-brand-surface hover:text-brand-neon'
                        }`}
                    >
                        <MapIcon className="w-5 h-5" /> 
                        Mapa de Cobertura
                    </Link>
                </nav>

                {/* Rodapé da Sidebar (Usuário e Logout) */}
                <div className="pt-4 border-t border-brand-border/50 mt-auto">
                    <div className="mb-4 px-3 flex flex-col">
                        <span className="text-sm font-bold text-brand-text truncate">{user?.name || 'Gestor'}</span>
                        <span className="text-xs text-brand-muted font-medium">{user?.role || 'ADMIN'}</span>
                    </div>
                    <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-3 p-3 w-full text-left rounded-xl hover:bg-red-500/10 text-brand-muted hover:text-red-500 transition-colors"
                    >
                        <LogOut className="w-5 h-5" /> 
                        Sair do Sistema
                    </button>
                </div>
            </aside>

            {/* 📺 ÁREA CENTRAL (Onde as telas são injetadas) */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 relative bg-gradient-to-br from-brand-black to-brand-surface/20">
                {/* O <Outlet /> é a mágica do React Router! Ele pega a rota atual (ex: /dashboard/mapa) 
                    e renderiza o componente correspondente (ex: <DashboardMap />) exatamente aqui. */}
                <Outlet />
            </main>

        </div>
    );
}