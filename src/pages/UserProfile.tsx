import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, MessageCircle, Pencil, RotateCcw } from 'lucide-react';
import { DEFAULT_SALES_PHONE } from '@/lib/contacts';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { AVATAR_COLORS, Preferences, usePreferences, useAvatarClass } from '@/contexts/ThemeContext';
import { roleLabel } from '@/lib/roles';
import { SecurityTab } from '@/pages/profile/SecurityTab';
import { profileService } from '@/services/profile.service';
import { Seo } from '@/components/Seo';
import { btnGhost, btnPrimary, eyebrow } from '@/lib/ui';
import { DealLine, SOLUTION_SERVICES, SolutionDetails, solutionSummary } from '@/lib/solution';

type Status = 'IN_REVIEW' | 'PROPOSAL_SENT' | 'APPROVED' | 'CANCELLED';

interface MyOrder {
    id: string;
    source: 'MAP' | 'CATALOG';
    createdAt: string;
    status: Status;
    total: number;
    months: number;
    seller?: { name?: string; phone?: string | null } | null;
    items: { id: string; priceSnapshot: number; panel?: { name?: string; city?: string; state?: string; images?: string[] } | null }[];
    /** Pedido da T3 Solution: sem painéis da rede, com o projeto da tela. */
    line?: DealLine;
    solution?: SolutionDetails | null;
}

const isSolution = (o: MyOrder) => o.line === 'SOLUTION';
const originLabel = (o: MyOrder) => (isSolution(o) ? 'T3 Solution' : o.source === 'MAP' ? 'Pelo mapa' : 'Pelo catálogo');
const serviceLabel = (value: string) => SOLUTION_SERVICES.find((s) => s.value === value)?.label ?? value;

const STATUS: Record<Status, { label: string; className: string }> = {
    IN_REVIEW: { label: 'Em análise', className: 'border-white/20 text-ink-100' },
    PROPOSAL_SENT: { label: 'Proposta enviada', className: 'border-brand-neon/50 bg-brand-neon/10 text-brand-neon' },
    APPROVED: { label: 'Aprovado', className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
    CANCELLED: { label: 'Cancelado', className: 'border-white/10 text-ink-500' },
};

/** Etapas que o cliente acompanha e o que acontece em cada uma. */
const STEPS: { status: Status; label: string }[] = [
    { status: 'IN_REVIEW', label: 'Em análise' },
    { status: 'PROPOSAL_SENT', label: 'Proposta enviada' },
    { status: 'APPROVED', label: 'Aprovado' },
];
const NEXT: Record<Status, string> = {
    IN_REVIEW: 'Um consultor está conferindo a disponibilidade dos painéis e prepara a proposta. Ela chega por WhatsApp ou e-mail.',
    PROPOSAL_SENT: 'A proposta foi enviada. Fale com o consultor para aprovar ou ajustar painéis e prazo.',
    APPROVED: 'Tudo certo. O consultor combina com você a arte da campanha e a data de início.',
    CANCELLED: 'Este orçamento foi encerrado. Se quiser, monte um novo no mapa de painéis.',
};
/** Mesmas etapas para o pedido de painel de LED da T3 Solution. */
const NEXT_SOLUTION: Record<Status, string> = {
    IN_REVIEW: 'A equipe da T3 Solution está analisando o espaço e o uso da tela. Um consultor fala com você para fechar medidas e especificação.',
    PROPOSAL_SENT: 'A proposta com escopo e investimento foi enviada. Fale com o consultor para aprovar ou ajustar o projeto.',
    APPROVED: 'Projeto aprovado. O consultor combina com você a visita técnica e a data da instalação.',
    CANCELLED: 'Este pedido foi encerrado. Se quiser, faça um novo pela página da T3 Solution.',
};

function OrderSteps({ status, solution = false }: { status: Status; solution?: boolean }) {
    const current = STEPS.findIndex((st) => st.status === status);
    return (
        <div className="border-b border-white/[0.08] p-4 md:p-6">
            {status === 'CANCELLED' ? (
                <p className="text-sm text-ink-400">Orçamento cancelado</p>
            ) : (
                <ol className="grid grid-cols-3 gap-2" aria-label="Andamento do orçamento">
                    {STEPS.map((st, i) => {
                        const done = i <= current;
                        return (
                            <li key={st.status} aria-current={i === current ? 'step' : undefined}>
                                <span className={`block h-1 ${done ? 'bg-brand-neon' : 'bg-white/10'}`} aria-hidden="true" />
                                <span className={`mt-2 flex items-center gap-1.5 text-xs ${done ? 'text-ink-100' : 'text-ink-500'}`}>
                                    {i < current && <Check className="h-3.5 w-3.5 text-brand-neon" aria-hidden="true" />}
                                    {st.label}
                                    <span className="sr-only">{i < current ? ' (concluída)' : i === current ? ' (etapa atual)' : ' (próxima)'}</span>
                                </span>
                            </li>
                        );
                    })}
                </ol>
            )}
            <p className="mt-3 max-w-[60ch] text-sm text-ink-400">{(solution ? NEXT_SOLUTION : NEXT)[status]}</p>
        </div>
    );
}

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const date = (v: string) => new Date(v).toLocaleDateString('pt-BR');
const shortId = (id: string) => id.slice(0, 6).toUpperCase();

const maskPhone = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) return v.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    if (v.length > 6) return v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    if (v.length > 2) return v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    return v ? `(${v}` : '';
};

type Option<K extends keyof Preferences> = { value: Preferences[K]; label: string };
type Group = { [K in keyof Preferences]: { key: K; title: string; hint: string; options: Option<K>[]; staffOnly?: boolean } }[keyof Preferences];

const GROUPS: Group[] = [
    { key: 'background', title: 'Fundo do site', hint: 'O vídeo da cidade toca uma vez e para no último quadro. A imagem parada é mais leve para dados móveis.', options: [{ value: 'video', label: 'Vídeo da cidade' }, { value: 'still', label: 'Imagem parada' }] },
    { key: 'motion', title: 'Movimento', hint: 'Menos movimento desliga animações, transições e o vídeo de fundo.', options: [{ value: 'full', label: 'Completo' }, { value: 'reduced', label: 'Menos movimento' }] },
    { key: 'textSize', title: 'Tamanho do texto', hint: 'Aumenta textos e espaçamentos do site inteiro.', options: [{ value: 'default', label: 'Padrão' }, { value: 'large', label: 'Maior' }] },
    { key: 'mapStyle', title: 'Mapa de painéis', hint: 'Cor do mapa na página de painéis.', options: [{ value: 'dark', label: 'Escuro' }, { value: 'light', label: 'Claro' }] },
    { key: 'theme', title: 'Tema da Gestão e do CRM', hint: 'Cor das áreas internas da equipe.', options: [{ value: 'dark', label: 'Escuro' }, { value: 'light', label: 'Claro' }], staffOnly: true },
];

function Appearance({ isStaff, initial }: { isStaff: boolean; initial: string }) {
    const { preferences, setPreference, resetPreferences } = usePreferences();
    const { isAuthenticated } = useAuth();
    const { addToast } = useToast();
    const avatarClass = useAvatarClass();
    const [savedAt, setSavedAt] = useState<number | null>(null);

    const change = async <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
        try {
            await setPreference(key, value);
            setSavedAt(Date.now());
        } catch {
            addToast('A mudança vale neste navegador, mas não foi salva na sua conta. Tente de novo.', 'error');
        }
    };

    const reset = async () => {
        try {
            await resetPreferences();
            setSavedAt(Date.now());
        } catch {
            addToast('Não foi possível restaurar na sua conta. Tente de novo.', 'error');
        }
    };

    return (
        <div className="mt-6 border border-white/[0.08] bg-ink-950/90">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] p-5 md:px-8">
                <p className="max-w-[56ch] text-sm text-ink-400">
                    As escolhas mudam o site na hora e ficam salvas na sua conta: valem em qualquer aparelho em que você entrar.
                </p>
                <p aria-live="polite" className="flex items-center gap-1.5 font-mono text-xs text-ink-500">
                    {savedAt && isAuthenticated && <><Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" /> Salvo</>}
                </p>
            </div>

            <div className="divide-y divide-white/[0.08]">
                {GROUPS.filter((g) => !g.staffOnly || isStaff).map((group) => (
                    <div key={group.key} className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center md:gap-8 md:px-8">
                        <div>
                            <p id={`pref-${group.key}`} className="text-sm text-ink-100">{group.title}</p>
                            <p className="mt-1 text-xs leading-relaxed text-ink-500">{group.hint}</p>
                        </div>
                        <div role="radiogroup" aria-labelledby={`pref-${group.key}`} className="grid grid-cols-2 gap-px border border-white/[0.08] bg-white/[0.08] md:w-80">
                            {(group.options as Option<keyof Preferences>[]).map((opt) => {
                                const active = preferences[group.key] === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        onClick={() => !active && change(group.key, opt.value)}
                                        className={`min-h-11 px-3 py-2.5 text-sm transition-colors ${active ? 'bg-ink-900 text-ink-100 shadow-[inset_0_-2px_0_rgb(255,94,0)]' : 'bg-ink-950 text-ink-400 hover:text-ink-100'}`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <div className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center md:gap-8 md:px-8">
                    <div className="flex items-center gap-4">
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center font-mono text-lg font-semibold ${avatarClass}`} aria-hidden="true">{initial}</span>
                        <div>
                            <p id="pref-avatar" className="text-sm text-ink-100">Cor do avatar</p>
                            <p className="mt-1 text-xs leading-relaxed text-ink-500">Aparece no menu da conta e nas áreas internas.</p>
                        </div>
                    </div>
                    <div role="radiogroup" aria-labelledby="pref-avatar" className="flex flex-wrap gap-2 md:w-80 md:justify-end">
                        {(Object.keys(AVATAR_COLORS) as Preferences['avatarColor'][]).map((color) => {
                            const active = preferences.avatarColor === color;
                            return (
                                <button
                                    key={color}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    aria-label={AVATAR_COLORS[color].label}
                                    title={AVATAR_COLORS[color].label}
                                    onClick={() => !active && change('avatarColor', color)}
                                    className={`flex h-11 w-11 items-center justify-center ${AVATAR_COLORS[color].className} ${active ? 'outline outline-2 outline-offset-2 outline-ink-100' : 'opacity-70 hover:opacity-100'}`}
                                >
                                    {active && <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex justify-end border-t border-white/[0.08] p-5 md:px-8">
                <button type="button" onClick={reset} className={btnGhost}>
                    <RotateCcw className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Restaurar padrão
                </button>
            </div>
        </div>
    );
}

const field = 'w-full border border-white/15 bg-ink-900 px-4 py-3.5 text-sm text-ink-100 placeholder:text-ink-500 focus:border-brand-neon focus:outline-none disabled:border-white/[0.06] disabled:bg-ink-950 disabled:text-ink-400';

export function UserProfile() {
    const { addToast } = useToast();
    const { user } = useAuth();
    const avatarClass = useAvatarClass();
    // Equipe (gestão e comercial) não faz orçamentos pelo site: vê dados e aparência
    const isStaff = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'COMERCIAL';
    const [tab, setTab] = useState<'data' | 'orders' | 'appearance' | 'security'>(() =>
        // Links de e-mail podem abrir direto na segurança ou nos orçamentos (/perfil?aba=seguranca|orcamentos)
        ({ seguranca: 'security', orcamentos: 'orders' } as const)[new URLSearchParams(window.location.search).get('aba') as 'seguranca' | 'orcamentos'] ?? 'data');
    const [googleLinked, setGoogleLinked] = useState(false);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [orders, setOrders] = useState<MyOrder[]>([]);
    const [open, setOpen] = useState<MyOrder | null>(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', companyName: '' });
    const [saved, setSaved] = useState(form);

    const load = useCallback(async () => {
        try {
            setStatus('loading');
            const [profile, list] = await Promise.all([profileService.getProfile(), isStaff ? Promise.resolve([]) : profileService.getMyOrders()]);
            const data = {
                name: profile.name || '',
                email: profile.email || '',
                phone: profile.phone || profile.whatsapp || '',
                companyName: profile.companyName || (typeof profile.company === 'string' ? profile.company : '') || '',
            };
            setForm(data);
            setSaved(data);
            setGoogleLinked(Boolean(profile.googleLinked));
            setOrders(Array.isArray(list) ? list : []);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    }, [isStaff]);

    useEffect(() => { load(); }, [load]);

    const onSave = async (e: FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await profileService.updateProfile({ name: form.name.trim(), phone: form.phone, companyName: form.companyName.trim() });
            setSaved(form);
            setEditing(false);
            addToast('Dados atualizados.', 'success');
        } catch {
            addToast('Não foi possível salvar. Confira os dados e tente de novo.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const talkToSeller = (order: MyOrder) => {
        let phone = String(order.seller?.phone || DEFAULT_SALES_PHONE).replace(/\D/g, '');
        if (!phone.startsWith('55') && phone.length <= 11) phone = `55${phone}`;
        const text = `Olá! Quero falar sobre o meu ${isSolution(order) ? 'pedido da T3 Solution' : 'orçamento'} #${shortId(order.id)} (${STATUS[order.status].label.toLowerCase()}).`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    };

    const openOrders = orders.filter((o) => o.status === 'IN_REVIEW' || o.status === 'PROPOSAL_SENT').length;

    return (
        <>
            <Seo title="Meu perfil" description="Seus dados e orçamentos na plataforma T3 OOH." path="/perfil" noIndex />

            <section className="mx-auto max-w-[1000px] px-4 pb-20 pt-10 md:px-8 md:pt-16">
                {/* ============================ CABEÇALHO ============================ */}
                <header className="flex items-center gap-4 border-b border-white/[0.08] pb-8 md:gap-6">
                    <span className={`flex h-16 w-16 shrink-0 items-center justify-center font-mono text-2xl font-semibold md:h-20 md:w-20 md:text-3xl ${avatarClass}`} aria-hidden="true">
                        {(saved.name || 'U').charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                        <p className={`${eyebrow} flex flex-wrap items-center gap-2`}>
                            Minha conta
                            <span className="border border-white/15 px-1.5 py-0.5 text-[10px] tracking-[0.15em] text-ink-300">{roleLabel(user?.role)}</span>
                        </p>
                        <h1 className="mt-2 truncate text-3xl font-light uppercase leading-none tracking-tight text-ink-100 md:text-5xl">{saved.name || 'Meu perfil'}</h1>
                        <p className="mt-2 truncate text-sm text-ink-400">{[saved.companyName, saved.email].filter(Boolean).join(' · ')}</p>
                    </div>
                </header>

                {/* ============================ ABAS ============================ */}
                <div role="tablist" aria-label="Seções do perfil" className={`mt-6 grid grid-cols-2 gap-px border border-white/[0.08] bg-white/[0.08] ${isStaff ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
                    {([['data', 'Meus dados'], ...(isStaff ? [] : [['orders', 'Orçamentos']] as const), ['appearance', 'Aparência'], ['security', 'Segurança']] as const).map(([id, label]) => (
                        <button key={id} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setOpen(null); }}
                            className={`flex items-center justify-center gap-2 px-4 py-3 text-sm transition-colors ${tab === id ? 'bg-ink-900 text-ink-100 shadow-[inset_0_-2px_0_rgb(255,94,0)]' : 'bg-ink-950 text-ink-400 hover:text-ink-100'}`}>
                            {label} {id === 'orders' && status === 'ready' && <span className="font-mono text-xs text-ink-500">{orders.length}</span>}
                        </button>
                    ))}
                </div>

                {tab === 'security' && <SecurityTab />}
                {tab === 'appearance' && <Appearance isStaff={isStaff} initial={(saved.name || user?.name || 'U').charAt(0).toUpperCase()} />}

                {status === 'loading' && tab !== 'appearance' && tab !== 'security' && <div className="mt-6 flex flex-col gap-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse bg-ink-900" />)}</div>}

                {status === 'error' && tab !== 'appearance' && tab !== 'security' && (
                    <div className="mt-6 border border-dashed border-white/15 p-8">
                        <p className="text-ink-100">Não foi possível carregar seu perfil</p>
                        <button type="button" onClick={load} className={`mt-4 ${btnGhost}`}>Tentar de novo</button>
                    </div>
                )}

                {/* ============================ DADOS ============================ */}
                {status === 'ready' && tab === 'data' && (
                    <form onSubmit={onSave} className="mt-6 border border-white/[0.08] bg-ink-950/90">
                        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 md:p-8">
                            <div className="md:col-span-2">
                                <label htmlFor="pf-name" className="mb-2 block text-sm text-ink-300">Nome completo</label>
                                <input id="pf-name" required minLength={2} autoComplete="name" disabled={!editing} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
                            </div>
                            <div>
                                <label htmlFor="pf-email" className="mb-2 block text-sm text-ink-300">E-mail <span className="text-ink-500">(não pode ser alterado)</span></label>
                                <input id="pf-email" type="email" disabled value={form.email} className={field} />
                                {googleLinked && <p className="mt-2 text-xs text-ink-500">Conta ligada ao Google: você também pode entrar com o botão do Google.</p>}
                            </div>
                            <div>
                                <label htmlFor="pf-phone" className="mb-2 block text-sm text-ink-300">WhatsApp</label>
                                <input id="pf-phone" type="tel" inputMode="tel" autoComplete="tel" disabled={!editing} value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} placeholder="(62) 9 0000-0000" className={field} />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="pf-company" className="mb-2 block text-sm text-ink-300">Empresa ou marca</label>
                                <input id="pf-company" autoComplete="organization" disabled={!editing} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className={field} />
                            </div>
                        </div>
                        <div className="flex flex-col-reverse gap-2 border-t border-white/[0.08] p-5 sm:flex-row sm:justify-end md:px-8">
                            {editing ? (
                                <>
                                    <button type="button" onClick={() => { setForm(saved); setEditing(false); }} className={btnGhost}>Cancelar</button>
                                    <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Salvando…' : 'Salvar dados'}</button>
                                </>
                            ) : (
                                <button type="button" onClick={() => setEditing(true)} className={btnGhost}><Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Editar dados</button>
                            )}
                        </div>
                    </form>
                )}

                {/* ============================ ORÇAMENTOS ============================ */}
                {status === 'ready' && tab === 'orders' && !open && (
                    orders.length === 0 ? (
                        <div className="mt-6 border border-dashed border-white/15 p-8">
                            <p className="text-2xl font-light uppercase tracking-tight text-ink-100">Nenhum orçamento ainda</p>
                            <p className="mt-3 max-w-[48ch] text-ink-400">Escolha os pontos no mapa ou no catálogo e envie o orçamento. Ele aparece aqui para você acompanhar.</p>
                            <Link to="/mapa" className={`mt-6 ${btnPrimary}`}>Ver painéis no mapa <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                        </div>
                    ) : (
                        <>
                            <p className="mt-6 text-sm text-ink-400"><span className="font-mono text-ink-100">{openOrders}</span> {openOrders === 1 ? 'orçamento em andamento' : 'orçamentos em andamento'}</p>
                            <ul className="mt-3 divide-y divide-white/[0.08] border border-white/[0.08] bg-ink-950/90">
                                {orders.map((o) => (
                                    <li key={`${o.source}-${o.id}`}>
                                        <button type="button" onClick={() => setOpen(o)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-ink-900">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-mono text-sm text-ink-100">#{shortId(o.id)}</span>
                                                    <span className={`border px-2 py-0.5 text-[11px] ${STATUS[o.status].className}`}>{STATUS[o.status].label}</span>
                                                </div>
                                                <p className="mt-1 truncate text-xs text-ink-400">
                                                    {originLabel(o)} · {date(o.createdAt)} · {isSolution(o)
                                                        ? [o.solution?.application, solutionSummary(o.solution)].filter(Boolean).join(' · ') || 'Painel de LED'
                                                        : `${o.items.length} ${o.items.length === 1 ? 'painel' : 'painéis'}`}
                                                </p>
                                            </div>
                                            {isSolution(o) ? (
                                                <span className="shrink-0 text-right font-mono text-sm text-ink-100">{o.total > 0 ? brl(o.total) : <span className="text-xs text-ink-400">Valor na proposta</span>}</span>
                                            ) : (
                                                <span className="shrink-0 text-right font-mono text-sm text-ink-100">{brl(o.total)}<span className="block text-xs text-ink-500">{o.months} {o.months === 1 ? 'mês' : 'meses'}</span></span>
                                            )}
                                            <ArrowRight className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )
                )}

                {status === 'ready' && tab === 'orders' && open && (
                    <div className="mt-6 border border-white/[0.08] bg-ink-950/90">
                        <div className="flex items-center gap-3 border-b border-white/[0.08] p-4 md:p-6">
                            <button type="button" onClick={() => setOpen(null)} className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/15 text-ink-300 hover:text-ink-100" aria-label="Voltar para a lista">
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <div className="min-w-0 flex-1">
                                <p className="font-mono text-lg text-ink-100">#{shortId(open.id)}</p>
                                <p className="text-xs text-ink-400">{originLabel(open)} · {date(open.createdAt)}</p>
                            </div>
                            <span className={`shrink-0 border px-2 py-0.5 text-[11px] ${STATUS[open.status].className}`}>{STATUS[open.status].label}</span>
                        </div>

                        <OrderSteps status={open.status} solution={isSolution(open)} />

                        {isSolution(open) ? (
                            <dl className="grid grid-cols-1 gap-px bg-white/[0.08] sm:grid-cols-2">
                                {([
                                    ['Aplicação', open.solution?.application],
                                    ['Ambiente', open.solution?.environment === 'indoor' ? 'Indoor' : open.solution?.environment === 'outdoor' ? 'Outdoor' : null],
                                    ['Tela', solutionSummary({ width: open.solution?.width, height: open.solution?.height, pitch: open.solution?.pitch })],
                                    ['Serviços', open.solution?.services?.map(serviceLabel).join(', ')],
                                ] as const).map(([k, v]) => (
                                    <div key={k} className="bg-ink-950 px-4 py-3 md:px-6">
                                        <dt className="text-xs text-ink-500">{k}</dt>
                                        <dd className="mt-1 text-sm text-ink-100">{v || <span className="text-ink-500">A definir com o consultor</span>}</dd>
                                    </div>
                                ))}
                                {open.solution?.notes && (
                                    <div className="bg-ink-950 px-4 py-3 sm:col-span-2 md:px-6">
                                        <dt className="text-xs text-ink-500">Detalhes</dt>
                                        <dd className="mt-1 whitespace-pre-line text-sm text-ink-300">{open.solution.notes}</dd>
                                    </div>
                                )}
                            </dl>
                        ) : (
                        <ul className="divide-y divide-white/[0.08]">
                            {open.items.map((item) => (
                                <li key={item.id} className="flex items-center gap-3 px-4 py-3 md:px-6">
                                    <img src={item.panel?.images?.[0] || '/placeholder.svg'} alt="" className="h-12 w-16 shrink-0 bg-ink-900 object-cover" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm text-ink-100">{item.panel?.name || 'Painel removido'}</span>
                                        <span className="block truncate text-xs text-ink-400">{[item.panel?.city, item.panel?.state].filter(Boolean).join(' - ')}</span>
                                    </span>
                                    <span className="shrink-0 font-mono text-sm text-ink-100">{brl(item.priceSnapshot)}<span className="text-xs text-ink-500">/mês</span></span>
                                </li>
                            ))}
                        </ul>
                        )}

                        <div className="flex flex-col gap-4 border-t border-white/[0.08] p-4 md:flex-row md:items-end md:justify-between md:p-6">
                            <dl className="font-mono">
                                {isSolution(open) ? (
                                    <>
                                        <dt className="text-xs text-ink-500">Investimento</dt>
                                        <dd className="mt-1 text-2xl text-brand-neon">{open.total > 0 ? brl(open.total) : <span className="font-sans text-base text-ink-300">Sai na proposta</span>}</dd>
                                    </>
                                ) : (
                                    <>
                                        <dt className="text-xs text-ink-500">Total do contrato · {open.months} {open.months === 1 ? 'mês' : 'meses'}</dt>
                                        <dd className="mt-1 text-2xl text-brand-neon">{brl(open.total)}</dd>
                                    </>
                                )}
                                {open.seller?.name && <dd className="mt-1 font-sans text-xs text-ink-400">Consultor: {open.seller.name}</dd>}
                            </dl>
                            <button type="button" onClick={() => talkToSeller(open)} className={`${btnPrimary} w-full md:w-auto`}>
                                <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Falar com o consultor
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </>
    );
}
