import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Briefcase, LayoutDashboard, LogOut, Menu, User as UserIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { panelsService } from '@/services/panels.service';

const NAV_LINKS = [
    { name: 'Mapa de painéis', path: '/mapa' },
    { name: 'Catálogo', path: '/servicos' },
    { name: 'T3 Solution', path: '/solution' },
    { name: 'Sobre', path: '/sobre' },
    { name: 'Contato', path: '/contato' },
];

const ROLE_LABEL: Record<string, string> = {
    ADMIN: 'Gestor',
    MANAGER: 'Gestor',
    COMERCIAL: 'Comercial',
    USER: 'Cliente',
    COMPANY: 'Cliente',
};

const spring = { type: 'spring', stiffness: 260, damping: 28 } as const;

export function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { isAuthenticated, user, signOut } = useAuth();
    const role = user?.role as string | undefined;

    // Fundo sólido só depois de rolar: no topo o header deixa o hero respirar
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setIsOpen(false);
        setIsUserMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!isOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKey);
        };
    }, [isOpen]);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setIsUserMenuOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const accountLinks = [
        ...(role === 'ADMIN' || role === 'MANAGER' ? [{ label: 'Gestão T3', path: '/dashboard', icon: LayoutDashboard }] : []),
        ...(role === 'ADMIN' || role === 'MANAGER' || role === 'COMERCIAL' ? [{ label: 'CRM comercial', path: '/crm', icon: Briefcase }] : []),
        ...(role === 'USER' || role === 'COMPANY' ? [{ label: 'Meu perfil', path: '/perfil', icon: UserIcon }] : []),
    ];
    const initial = user?.name?.trim().charAt(0).toUpperCase() ?? '';
    const prefetchMap = (path: string) => { if (path === '/mapa') panelsService.getMapMarkers().catch(() => {}); };

    return (
        <header
            className={cn(
                'fixed inset-x-0 top-0 z-[500] h-20 transition-colors duration-300',
                scrolled || isOpen ? 'border-b border-white/[0.06] bg-ink-950' : 'border-b border-transparent bg-transparent'
            )}
        >
            <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-6 px-4 md:px-8">
                <Link to="/" className="relative z-10 shrink-0" aria-label="T3 OOH, página inicial">
                    <img src="/t3-logo.webp" alt="" className="h-9 w-auto" />
                </Link>

                <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
                    {NAV_LINKS.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            onMouseEnter={() => prefetchMap(link.path)}
                            className={({ isActive }) => cn(
                                'relative rounded-lg px-3 py-2 text-sm transition-colors',
                                isActive ? 'text-ink-100' : 'text-ink-400 hover:text-ink-100'
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    {link.name}
                                    {isActive && (
                                        <motion.span layoutId="nav-active" transition={spring} className="absolute inset-x-3 -bottom-px h-px bg-brand-neon" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="hidden items-center gap-2 lg:flex">
                    {!isAuthenticated ? (
                        <Link to="/login" className="rounded-lg px-3 py-2 text-sm text-ink-300 transition-colors hover:text-ink-100">
                            Entrar
                        </Link>
                    ) : (
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setIsUserMenuOpen((v) => !v)}
                                aria-label="Menu da conta"
                                aria-expanded={isUserMenuOpen}
                                className="flex items-center gap-2.5 rounded-full border border-white/10 py-1 pl-1 pr-3 text-sm text-ink-300 transition-colors hover:border-white/20 hover:text-ink-100"
                            >
                                <span className="grid h-7 w-7 place-items-center rounded-full bg-ink-800 font-mono text-xs text-brand-neon">{initial}</span>
                                <span className="max-w-[9rem] truncate">{user?.name?.split(' ')[0]}</span>
                            </button>
                            <AnimatePresence>
                                {isUserMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        transition={spring}
                                        className="absolute right-0 top-[calc(100%+10px)] w-60 overflow-hidden rounded-xl border border-white/10 bg-ink-900 shadow-panel"
                                    >
                                        <div className="border-b border-white/[0.06] px-4 py-3">
                                            <p className="truncate text-sm font-medium text-ink-100">{user?.name}</p>
                                            <p className="text-xs text-ink-400">{ROLE_LABEL[role ?? ''] ?? ''}</p>
                                        </div>
                                        <div className="p-1.5">
                                            {accountLinks.map(({ label, path, icon: Icon }) => (
                                                <button
                                                    key={path}
                                                    onClick={() => navigate(path)}
                                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-300 hover:bg-white/[0.04] hover:text-ink-100"
                                                >
                                                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> {label}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => signOut()}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-400 hover:bg-white/[0.04] hover:text-ink-100"
                                            >
                                                <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Sair
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                    <Link
                        to="/mapa"
                        onMouseEnter={() => prefetchMap('/mapa')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-neon px-4 py-2.5 text-sm font-semibold text-ink-950 transition-transform hover:bg-brand-neonHover active:scale-[0.98]"
                    >
                        Solicitar orçamento
                    </Link>
                </div>

                <button
                    type="button"
                    onClick={() => setIsOpen((v) => !v)}
                    aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
                    aria-expanded={isOpen}
                    aria-controls="menu-mobile"
                    className="relative z-10 -mr-2 grid h-10 w-10 place-items-center rounded-lg text-ink-100 lg:hidden"
                >
                    {isOpen ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        id="menu-mobile"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-x-0 bottom-0 top-20 overflow-y-auto bg-ink-950 lg:hidden"
                    >
                        <nav aria-label="Principal" className="flex flex-col px-4 pt-4">
                            {[{ name: 'Início', path: '/' }, ...NAV_LINKS].map((link, i) => (
                                <motion.div
                                    key={link.path}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...spring, delay: i * 0.035 }}
                                >
                                    <NavLink
                                        to={link.path}
                                        end={link.path === '/'}
                                        className={({ isActive }) => cn(
                                            'flex items-center justify-between border-b border-white/[0.06] py-4 text-2xl tracking-tight',
                                            isActive ? 'text-ink-100' : 'text-ink-400'
                                        )}
                                    >
                                        {link.name}
                                        <ArrowRight className="h-5 w-5 text-ink-500" strokeWidth={1.5} aria-hidden="true" />
                                    </NavLink>
                                </motion.div>
                            ))}
                        </nav>

                        <div className="flex flex-col gap-3 px-4 py-8">
                            <Link to="/mapa" className="rounded-xl bg-brand-neon px-5 py-3.5 text-center text-sm font-semibold text-ink-950 active:scale-[0.98]">
                                Solicitar orçamento
                            </Link>
                            {!isAuthenticated ? (
                                <Link to="/login" className="rounded-xl border border-white/15 px-5 py-3.5 text-center text-sm font-medium text-ink-100">
                                    Entrar na minha conta
                                </Link>
                            ) : (
                                <>
                                    <p className="mt-2 text-sm text-ink-400">
                                        Conectado como <span className="text-ink-100">{user?.name}</span>
                                    </p>
                                    {accountLinks.map(({ label, path }) => (
                                        <Link key={path} to={path} className="rounded-xl border border-white/15 px-5 py-3.5 text-center text-sm font-medium text-ink-100">
                                            {label}
                                        </Link>
                                    ))}
                                    <button onClick={() => signOut()} className="py-2 text-sm text-ink-400">Sair</button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
