import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { usersService, UserData, UserRole } from '@/services/users.service';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { roleLabel } from '@/lib/roles';
import { apiErrorMessage } from '@/lib/upload';
import { Badge, CrmPage, EmptyState, Skeleton } from '@/components/app/ui';
import { crmBtn, crmInput, initials } from '@/components/app/tokens';

type Filter = 'ALL' | 'TEAM' | UserRole;

const ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'COMERCIAL', 'COMPANY', 'USER'];
const TEAM: UserRole[] = ['ADMIN', 'MANAGER', 'COMERCIAL'];
const HINT: Record<UserRole, string> = {
    ADMIN: 'Acesso total, inclusive a outros administradores.',
    MANAGER: 'Painel de gestão e CRM.',
    COMERCIAL: 'Somente o CRM, com a própria carteira.',
    COMPANY: 'Conta de empresa anunciante.',
    USER: 'Cliente do site.',
};

export function Users() {
    const toast = useToast();
    const { user: me } = useAuth();
    const isAdmin = me?.role === 'ADMIN';

    const [users, setUsers] = useState<UserData[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('TEAM');
    const [savingId, setSavingId] = useState<string | null>(null);

    const load = async () => {
        try {
            setStatus('loading');
            setUsers(await usersService.getAllUsers());
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => { load(); }, []);

    const counts = useMemo(() => {
        const c: Record<string, number> = { ALL: users.length, TEAM: 0 };
        users.forEach((u) => { c[u.role] = (c[u.role] ?? 0) + 1; if (TEAM.includes(u.role)) c.TEAM += 1; });
        return c;
    }, [users]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return users.filter((u) =>
            (filter === 'ALL' || (filter === 'TEAM' ? TEAM.includes(u.role) : u.role === filter)) &&
            (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
        );
    }, [users, query, filter]);

    /** Ninguém muda o próprio papel; só ADMIN mexe em ADMIN (a regra também está no backend). */
    const locked = (u: UserData) => u.id === me?.id || (!isAdmin && u.role === 'ADMIN');
    const options = isAdmin ? ROLES : ROLES.filter((r) => r !== 'ADMIN');

    const changeRole = async (target: UserData, role: UserRole) => {
        if (role === target.role) return;
        const before = target.role;
        setSavingId(target.id);
        setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, role } : u)));
        try {
            await usersService.updateUserRole(target.id, role);
            toast.success(`${target.name.split(' ')[0]} agora é ${roleLabel(role).toLowerCase()}.`);
        } catch (error) {
            setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, role: before } : u)));
            toast.error(apiErrorMessage(error, 'Não foi possível alterar o papel.'));
        } finally {
            setSavingId(null);
        }
    };

    const tabs: Filter[] = ['TEAM', 'ALL', 'ADMIN', 'MANAGER', 'COMERCIAL', 'COMPANY', 'USER'];

    return (
        <CrmPage eyebrow="Acessos" title="Usuários" description="Quem entra no painel e no CRM. A mudança de papel vale no próximo login da pessoa.">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1 lg:max-w-md">
                    <label htmlFor="user-search" className="sr-only">Buscar usuários</label>
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" aria-hidden="true" />
                    <input id="user-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome ou e-mail" className={`${crmInput} pl-10`} />
                </div>
                <div role="tablist" aria-label="Papel" className="flex gap-px overflow-x-auto border border-brand-border bg-brand-border">
                    {tabs.filter((t) => t === 'ALL' || t === 'TEAM' || counts[t]).map((t) => (
                        <button key={t} role="tab" aria-selected={filter === t} onClick={() => setFilter(t)}
                            className={`flex shrink-0 items-center gap-2 px-3.5 py-2 text-sm ${filter === t ? 'bg-brand-surface text-brand-text' : 'bg-brand-background text-brand-muted hover:text-brand-text'}`}>
                            {t === 'ALL' ? 'Todos' : t === 'TEAM' ? 'Equipe' : roleLabel(t)} <span className="font-mono text-xs text-brand-muted">{counts[t] ?? 0}</span>
                        </button>
                    ))}
                </div>
            </div>

            {status === 'loading' && <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>}
            {status === 'error' && <EmptyState title="Não foi possível carregar os usuários" action={<button type="button" onClick={load} className={crmBtn.secondary}>Tentar de novo</button>} />}
            {status === 'ready' && visible.length === 0 && <EmptyState title="Nenhum usuário encontrado" text="Ajuste a busca ou o filtro." />}

            {status === 'ready' && visible.length > 0 && (
                <div className="border border-brand-border bg-brand-surface">
                    <div className="hidden grid-cols-[2fr_1fr_1.4fr] gap-4 border-b border-brand-border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-brand-muted md:grid">
                        <span>Pessoa</span><span>Papel</span><span>Alterar papel</span>
                    </div>
                    <ul className="divide-y divide-brand-border">
                        {visible.map((u) => (
                            <li key={u.id} className="grid grid-cols-1 items-center gap-3 px-5 py-3.5 md:grid-cols-[2fr_1fr_1.4fr] md:gap-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-brand-border font-mono text-xs text-brand-muted" aria-hidden="true">{initials(u.name)}</span>
                                    <div className="min-w-0">
                                        <p className="flex items-center gap-2 truncate text-sm font-medium text-brand-text">{u.name} {u.id === me?.id && <Badge tone="accent">Você</Badge>}</p>
                                        <p className="truncate text-xs text-brand-muted">{u.email}</p>
                                    </div>
                                </div>
                                <span className="hidden md:block"><Badge tone={u.role === 'ADMIN' || u.role === 'MANAGER' ? 'accent' : TEAM.includes(u.role) ? 'neutral' : 'muted'}>{roleLabel(u.role)}</Badge></span>
                                <div>
                                    <label htmlFor={`role-${u.id}`} className="sr-only">Papel de {u.name}</label>
                                    <select
                                        id={`role-${u.id}`}
                                        value={u.role}
                                        disabled={locked(u) || savingId === u.id}
                                        onChange={(e) => changeRole(u, e.target.value as UserRole)}
                                        className={`${crmInput} py-2`}
                                        title={locked(u) ? (u.id === me?.id ? 'Você não pode alterar o próprio papel.' : 'Só administradores alteram outro administrador.') : HINT[u.role]}
                                    >
                                        {(locked(u) ? [u.role] : options).map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                                    </select>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <dl className="grid grid-cols-1 gap-px border border-brand-border bg-brand-border text-sm sm:grid-cols-2 lg:grid-cols-5">
                {ROLES.map((r) => (
                    <div key={r} className="bg-brand-surface p-4">
                        <dt className="font-medium text-brand-text">{roleLabel(r)}</dt>
                        <dd className="mt-1 text-xs text-brand-muted">{HINT[r]}</dd>
                    </div>
                ))}
            </dl>
        </CrmPage>
    );
}
