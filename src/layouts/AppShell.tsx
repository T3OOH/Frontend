import { ComponentType, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRight, Globe, LogOut, Menu, Moon, Sun, UserRound, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatarClass, useTheme } from '@/contexts/ThemeContext';
import { roleLabel } from '@/lib/roles';

export interface ShellNavItem {
    to: string;
    label: string;
    /** Rótulo curto da barra inferior no celular. */
    short?: string;
    icon: ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' }>;
    end?: boolean;
}

interface AppShellProps {
    /** Nome da área ao lado da logo ("Comercial", "Gestão"). */
    area: string;
    nav: ShellNavItem[];
    /** Atalho para a outra área interna, quando o usuário tem acesso. */
    switchTo?: { to: string; label: string };
}

/**
 * Casca das áreas internas: barra lateral no desktop, barra superior e navegação
 * inferior no celular, menu completo, tema claro/escuro e saída.
 */
export function AppShell({ area, nav, switchTo }: AppShellProps) {
    const { signOut, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const avatarClass = useAvatarClass();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => { setMenuOpen(false); }, [location.pathname]);
    useEffect(() => {
        if (!menuOpen) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    const handleLogout = () => {
        setMenuOpen(false);
        signOut();
        navigate('/login');
    };

    const logo = theme === 'dark' ? '/t3-logo.webp' : '/t3-logo-black.webp';
    const ThemeIcon = theme === 'dark' ? Sun : Moon;
    const themeLabel = theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro';
    const tabs = nav.slice(0, 3);

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `relative flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isActive
            ? 'bg-brand-background font-medium text-brand-text before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-brand-neon'
            : 'text-brand-muted hover:bg-brand-background hover:text-brand-text'}`;

    const secondary = 'flex items-center gap-3 px-3 py-2 text-sm text-brand-muted hover:bg-brand-background hover:text-brand-text';

    return (
        <div className={`flex min-h-[100dvh] w-full bg-brand-background text-brand-text ${theme === 'light' ? 'dashboard-light' : ''}`}>
            {/* ============================ BARRA LATERAL (desktop) ============================ */}
            <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col border-r border-brand-border bg-brand-surface lg:flex">
                <div className="flex h-16 items-center gap-3 border-b border-brand-border px-5">
                    <img src={logo} alt="T3 OOH" className="h-7 w-auto" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-muted">{area}</span>
                </div>

                <nav aria-label={area} className="flex flex-1 flex-col gap-0.5 overflow-y-auto py-4">
                    {nav.map(({ to, label, icon: Icon, end }) => (
                        <NavLink key={to} to={to} end={end} className={linkClass}>
                            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" /> {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="flex flex-col gap-1 border-t border-brand-border p-3">
                    {switchTo && (
                        <Link to={switchTo.to} className={secondary}>
                            <ArrowLeftRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> {switchTo.label}
                        </Link>
                    )}
                    <Link to="/" className={secondary}>
                        <Globe className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Site público
                    </Link>
                    <Link to="/perfil" className={secondary}>
                        <UserRound className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Meu perfil
                    </Link>
                    <button type="button" onClick={toggleTheme} className={`${secondary} text-left`}>
                        <ThemeIcon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> {themeLabel}
                    </button>
                    <div className="mt-2 flex items-center gap-3 border-t border-brand-border px-3 pt-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center font-mono text-xs font-semibold ${avatarClass}`} aria-hidden="true">
                            {user?.name?.charAt(0).toUpperCase() || 'T'}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{user?.name || 'Equipe T3'}</p>
                            <p className="truncate text-xs text-brand-muted">{roleLabel(user?.role)}</p>
                        </div>
                        <button type="button" onClick={handleLogout} aria-label="Sair" title="Sair" className="p-3 text-brand-muted hover:text-brand-text">
                            <LogOut className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ============================ CONTEÚDO ============================ */}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-brand-border bg-brand-surface/95 px-4 backdrop-blur lg:hidden">
                    <div className="flex items-center gap-2.5">
                        <img src={logo} alt="T3 OOH" className="h-6 w-auto" />
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-muted">{area}</span>
                    </div>
                    <button type="button" onClick={toggleTheme} aria-label={themeLabel} className="p-3 text-brand-muted hover:text-brand-text">
                        <ThemeIcon className="h-5 w-5" strokeWidth={1.75} />
                    </button>
                </header>

                <main className="flex-1 px-4 pb-28 pt-6 md:px-6 lg:px-8 lg:pb-10 lg:pt-8">
                    <Outlet />
                </main>
            </div>

            {/* ============================ NAVEGAÇÃO INFERIOR (celular) ============================ */}
            <nav aria-label={area} className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-brand-border bg-brand-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
                {tabs.map(({ to, label, short, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[11px] ${isActive ? 'text-brand-neon' : 'text-brand-muted'}`}
                    >
                        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                        {short || label}
                    </NavLink>
                ))}
                <button type="button" onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-brand-muted" aria-expanded={menuOpen}>
                    <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" /> Mais
                </button>
            </nav>

            {/* ============================ MENU COMPLETO (celular) ============================ */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.18 }}
                        className={`fixed inset-0 z-[9999] flex flex-col overflow-y-auto bg-brand-background text-brand-text lg:hidden ${theme === 'light' ? 'dashboard-light' : ''}`}
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Menu · ${area}`}
                    >
                        <div className="flex h-14 shrink-0 items-center justify-between border-b border-brand-border px-4">
                            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-muted">{area}</span>
                            <button type="button" aria-label="Fechar" onClick={() => setMenuOpen(false)} className="p-3 text-brand-muted hover:text-brand-text"><X className="h-5 w-5" strokeWidth={1.75} /></button>
                        </div>
                        <div className="flex items-center gap-3 border-b border-brand-border px-4 py-4">
                            <span className={`flex h-10 w-10 items-center justify-center font-mono font-semibold ${avatarClass}`} aria-hidden="true">{user?.name?.charAt(0).toUpperCase() || 'T'}</span>
                            <div className="min-w-0">
                                <p className="truncate font-medium">{user?.name || 'Equipe T3'}</p>
                                <p className="text-sm text-brand-muted">{roleLabel(user?.role)}</p>
                            </div>
                        </div>
                        <nav className="flex flex-col py-2">
                            {nav.map(({ to, label, icon: Icon, end }) => (
                                <NavLink key={to} to={to} end={end} className={linkClass}>
                                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" /> {label}
                                </NavLink>
                            ))}
                            {switchTo && <Link to={switchTo.to} className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-muted"><ArrowLeftRight className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" /> {switchTo.label}</Link>}
                            <Link to="/" className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-muted"><Globe className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" /> Site público</Link>
                            <Link to="/perfil" className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-muted"><UserRound className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" /> Meu perfil</Link>
                        </nav>
                        <div className="mt-auto border-t border-brand-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                            <button type="button" onClick={handleLogout} className="flex w-full items-center justify-center gap-2 border border-brand-border py-3 text-sm text-brand-text">
                                <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Sair
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
