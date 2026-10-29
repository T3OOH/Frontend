import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Eye, EyeOff, LogOut, Monitor, ShieldCheck, Smartphone, Tablet, X } from 'lucide-react';
import { api } from '@/lib/axios';
import { apiErrorMessage } from '@/lib/upload';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { btnGhost, btnPrimary } from '@/lib/ui';

interface Session {
    id: string; browser: string | null; os: string | null; deviceType: string | null; ip: string | null;
    method: string; persistent: boolean; createdAt: string; lastUsedAt: string; current: boolean;
}
interface SecurityEvent { id: string; type: string; label: string; ip: string | null; device: string; createdAt: string }
interface Security { sessions: Session[]; events: SecurityEvent[]; googleLinked: boolean }

/** Mesmas regras do cadastro e da recuperação de senha. */
const RULES = [
    { id: 'len', label: '8 caracteres ou mais', test: (p: string) => p.length >= 8 },
    { id: 'upper', label: 'Uma letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
    { id: 'digit', label: 'Um número', test: (p: string) => /\d/.test(p) },
];

/** Tipos de evento que pedem atenção na lista de atividade. */
const ALERT_EVENTS = new Set(['LOGIN_FAILED', 'LOGIN_LOCKED', 'NEW_DEVICE', 'TOKEN_REUSE', 'REPORTED_NOT_ME']);

const field = 'w-full border border-white/15 bg-ink-900 px-4 py-3.5 text-sm text-ink-100 placeholder:text-ink-500 focus:border-brand-neon focus:outline-none';
const dateTime = (iso: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

function ago(iso: string) {
    const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 2) return 'agora';
    if (min < 60) return `há ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `há ${h} h`;
    const d = Math.round(h / 24);
    return d === 1 ? 'ontem' : `há ${d} dias`;
}

const DeviceIcon = ({ type }: { type: string | null }) => {
    const Icon = type === 'mobile' ? Smartphone : type === 'tablet' ? Tablet : Monitor;
    return <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />;
};

/**
 * Perfil → Segurança: aparelhos conectados, troca de senha e atividade recente.
 * Ver docs/SEGURANCA.md no backend.
 */
export function SecurityTab() {
    const { signOut } = useAuth();
    const { addToast } = useToast();
    const [data, setData] = useState<Security | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [busy, setBusy] = useState<string | null>(null);
    const [confirmOthers, setConfirmOthers] = useState(false);
    const [pw, setPw] = useState({ current: '', next: '', repeat: '' });
    const [show, setShow] = useState(false);
    const [savingPw, setSavingPw] = useState(false);

    const load = useCallback(async () => {
        try {
            const { data } = await api.get<Security>('/profile/security');
            setData(data);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const revoke = async (s: Session) => {
        if (s.current) { signOut(); return; }
        setBusy(s.id);
        try {
            await api.delete(`/profile/sessions/${s.id}`);
            addToast('Aparelho desconectado.', 'success');
            await load();
        } catch (error) {
            addToast(apiErrorMessage(error, 'Não foi possível desconectar o aparelho.'), 'error');
        } finally {
            setBusy(null);
        }
    };

    const revokeOthers = async () => {
        setBusy('others');
        try {
            const { data } = await api.post<{ closed: number }>('/profile/sessions/revoke-others');
            addToast(data.closed ? `${data.closed} ${data.closed === 1 ? 'aparelho desconectado' : 'aparelhos desconectados'}.` : 'Nenhum outro aparelho conectado.', 'success');
            setConfirmOthers(false);
            await load();
        } catch (error) {
            addToast(apiErrorMessage(error, 'Não foi possível desconectar os outros aparelhos.'), 'error');
        } finally {
            setBusy(null);
        }
    };

    const rulesOk = RULES.every((r) => r.test(pw.next));
    const mismatch = pw.repeat.length > 0 && pw.repeat !== pw.next;
    const canSave = pw.current.length > 0 && rulesOk && pw.next === pw.repeat && !savingPw;

    const changePassword = async (e: FormEvent) => {
        e.preventDefault();
        if (!canSave) return;
        setSavingPw(true);
        try {
            const { data } = await api.put<{ closedSessions: number }>('/profile/password', { currentPassword: pw.current, newPassword: pw.next });
            setPw({ current: '', next: '', repeat: '' });
            addToast(data.closedSessions ? `Senha alterada. ${data.closedSessions} ${data.closedSessions === 1 ? 'outro aparelho saiu' : 'outros aparelhos saíram'} da conta.` : 'Senha alterada.', 'success');
            await load();
        } catch (error) {
            addToast(apiErrorMessage(error, 'Não foi possível alterar a senha.'), 'error');
        } finally {
            setSavingPw(false);
        }
    };

    if (status === 'loading') return <div className="mt-6 flex flex-col gap-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse bg-ink-900" />)}</div>;
    if (status === 'error' || !data) {
        return (
            <div className="mt-6 border border-dashed border-white/15 p-8">
                <p className="text-ink-100">Não foi possível carregar a segurança da conta</p>
                <button type="button" onClick={load} className={`mt-4 ${btnGhost}`}>Tentar de novo</button>
            </div>
        );
    }

    const others = data.sessions.filter((s) => !s.current).length;

    return (
        <div className="mt-6 flex flex-col gap-6">
            {/* ============================ APARELHOS ============================ */}
            <section className="border border-white/[0.08] bg-ink-950/90">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] p-5 md:px-8">
                    <div>
                        <h2 className="text-sm font-semibold text-ink-100">Aparelhos conectados</h2>
                        <p className="mt-1 text-xs text-ink-500">Quando a conta entra em um aparelho novo, avisamos por e-mail.</p>
                    </div>
                    {others > 0 && !confirmOthers && (
                        <button type="button" onClick={() => setConfirmOthers(true)} className="min-h-11 text-sm text-ink-300 underline underline-offset-4 hover:text-ink-100">
                            Desconectar os outros {others}
                        </button>
                    )}
                </div>

                {confirmOthers && (
                    <div className="flex flex-col gap-3 border-b border-white/[0.08] bg-ink-900 p-5 sm:flex-row sm:items-center sm:justify-between md:px-8" role="alert">
                        <p className="text-sm text-ink-100">Desconectar {others === 1 ? 'o outro aparelho' : `os outros ${others} aparelhos`}? Este continua conectado.</p>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setConfirmOthers(false)} className={`${btnGhost} px-4 py-2.5`}>Cancelar</button>
                            <button type="button" onClick={revokeOthers} disabled={busy === 'others'} className={`${btnPrimary} px-4 py-2.5`}>{busy === 'others' ? 'Desconectando…' : 'Desconectar'}</button>
                        </div>
                    </div>
                )}

                {data.sessions.length === 0 ? (
                    <p className="p-5 text-sm text-ink-400 md:px-8">Nenhum aparelho com sessão mantida. Esta sessão é anterior à atualização de segurança e termina quando você sair.</p>
                ) : (
                    <ul className="divide-y divide-white/[0.08]">
                        {data.sessions.map((s) => (
                            <li key={s.id} className="flex items-center gap-4 p-5 md:px-8">
                                <span className={`flex h-11 w-11 shrink-0 items-center justify-center border ${s.current ? 'border-brand-neon/50 text-brand-neon' : 'border-white/15 text-ink-300'}`}><DeviceIcon type={s.deviceType} /></span>
                                <div className="min-w-0 flex-1">
                                    <p className="flex flex-wrap items-center gap-2 text-sm text-ink-100">
                                        {s.browser || 'Navegador'} no {s.os || 'sistema desconhecido'}
                                        {s.current && <span className="border border-brand-neon/50 bg-brand-neon/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-brand-neon">Este aparelho</span>}
                                    </p>
                                    <p className="mt-1 text-xs text-ink-500">
                                        {s.current ? 'Em uso agora' : `Último uso ${ago(s.lastUsedAt)}`} · entrou em {dateTime(s.createdAt)} {s.method === 'google' ? 'pelo Google' : 'com e-mail e senha'}{s.ip ? ` · IP ${s.ip}` : ''}{!s.persistent ? ' · até fechar a aba' : ''}
                                    </p>
                                </div>
                                <button type="button" onClick={() => revoke(s)} disabled={busy === s.id} className="flex min-h-11 shrink-0 items-center gap-1.5 px-2 text-sm text-ink-400 hover:text-ink-100 disabled:opacity-50" aria-label={s.current ? 'Sair deste aparelho' : `Desconectar ${s.browser} no ${s.os}`}>
                                    <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> <span className="hidden sm:inline">{s.current ? 'Sair' : 'Desconectar'}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* ============================ SENHA ============================ */}
            <form onSubmit={changePassword} className="border border-white/[0.08] bg-ink-950/90" noValidate>
                <div className="border-b border-white/[0.08] p-5 md:px-8">
                    <h2 className="text-sm font-semibold text-ink-100">Alterar senha</h2>
                    <p className="mt-1 text-xs text-ink-500">Ao trocar, os outros aparelhos saem da conta e você recebe um e-mail de confirmação.</p>
                </div>
                <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 md:px-8">
                    <div className="md:col-span-2">
                        <label htmlFor="sec-current" className="mb-2 block text-sm text-ink-300">Senha atual</label>
                        <input id="sec-current" type={show ? 'text' : 'password'} autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className={field} />
                        {data.googleLinked && (
                            <p className="mt-2 text-xs text-ink-500">Entra só pelo Google e não sabe a senha? <Link to="/recuperar-senha" className="text-ink-300 underline underline-offset-4 hover:text-ink-100">Crie uma pelo e-mail</Link>.</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="sec-new" className="mb-2 block text-sm text-ink-300">Nova senha</label>
                        <div className="relative">
                            <input id="sec-new" type={show ? 'text' : 'password'} autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} aria-describedby="sec-rules" className={`${field} pr-12`} />
                            <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-400 hover:text-ink-100" aria-label={show ? 'Ocultar senhas' : 'Mostrar senhas'}>
                                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="sec-repeat" className="mb-2 block text-sm text-ink-300">Repita a nova senha</label>
                        <input id="sec-repeat" type={show ? 'text' : 'password'} autoComplete="new-password" value={pw.repeat} onChange={(e) => setPw({ ...pw, repeat: e.target.value })} className={field} aria-invalid={mismatch} />
                        {mismatch && <p role="alert" className="mt-2 text-sm text-red-400">As senhas não são iguais.</p>}
                    </div>
                    <ul id="sec-rules" className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm md:col-span-2">
                        {RULES.map((r) => {
                            const ok = r.test(pw.next);
                            return (
                                <li key={r.id} className={`flex items-center gap-1.5 ${ok ? 'text-emerald-400' : 'text-ink-500'}`}>
                                    {ok ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />} {r.label}
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div className="flex justify-end border-t border-white/[0.08] p-5 md:px-8">
                    <button type="submit" disabled={!canSave} className={btnPrimary}>{savingPw ? 'Salvando…' : 'Salvar nova senha'}</button>
                </div>
            </form>

            {/* ============================ ATIVIDADE ============================ */}
            <section className="border border-white/[0.08] bg-ink-950/90">
                <div className="flex items-center gap-2 border-b border-white/[0.08] p-5 md:px-8">
                    <ShieldCheck className="h-4 w-4 text-ink-400" strokeWidth={1.75} aria-hidden="true" />
                    <h2 className="text-sm font-semibold text-ink-100">Atividade recente</h2>
                </div>
                {data.events.length === 0 ? (
                    <p className="p-5 text-sm text-ink-400 md:px-8">Ainda sem registros. Entradas, trocas de senha e aparelhos desconectados aparecem aqui.</p>
                ) : (
                    <ul className="divide-y divide-white/[0.08]">
                        {data.events.map((e) => (
                            <li key={e.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:gap-4 md:px-8">
                                <span className="shrink-0 font-mono text-xs text-ink-500 sm:w-36">{dateTime(e.createdAt)}</span>
                                <span className={`min-w-0 flex-1 text-sm ${ALERT_EVENTS.has(e.type) ? 'text-brand-neon' : 'text-ink-100'}`}>{e.label}</span>
                                <span className="truncate text-xs text-ink-500">{e.device}{e.ip ? ` · ${e.ip}` : ''}</span>
                            </li>
                        ))}
                    </ul>
                )}
                <p className="border-t border-white/[0.08] p-5 text-xs text-ink-500 md:px-8">
                    Viu algo que não reconhece? Desconecte os outros aparelhos e troque a senha. Se precisar, fale com o comercial da T3.
                </p>
            </section>
        </div>
    );
}
