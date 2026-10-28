import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Plus, Shuffle, Trash2 } from 'lucide-react';
import { api } from '@/lib/axios';
import { useToast } from '@/contexts/ToastContext';
import { Badge, ConfirmSheet, CrmPage, EmptyState, Field, Sheet, Skeleton } from '@/components/app/ui';
import { crmBtn, crmInput, formatBRL, formatDate } from '@/components/app/tokens';

interface Coupon {
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_VALUE';
    value: number;
    minValue: number | null;
    validUntil: string | null;
    singleUse: boolean;
    isUsed: boolean;
    createdAt: string;
    creator?: { name: string } | null;
    usedBy?: { name: string } | null;
}

type Filter = 'all' | 'active' | 'used' | 'expired';

const EMPTY_FORM = { code: '', discountType: 'PERCENTAGE' as Coupon['discountType'], value: '', minValue: '', validUntil: '', singleUse: true };

const statusOf = (c: Coupon): Exclude<Filter, 'all'> => {
    if (c.isUsed) return 'used';
    if (c.validUntil && new Date(c.validUntil) < new Date()) return 'expired';
    return 'active';
};

const STATUS_LABEL = { active: 'Ativo', used: 'Usado', expired: 'Expirado' } as const;

const describe = (c: Coupon) => (c.discountType === 'PERCENTAGE' ? `${c.value}%` : formatBRL(c.value));

/** Código legível: sem 0/O e 1/I, para ditar por telefone sem confusão. */
const randomCode = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

export function CrmCoupons() {
    const { addToast } = useToast();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [filter, setFilter] = useState<Filter>('all');
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [toDelete, setToDelete] = useState<Coupon | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const load = async () => {
        try {
            setStatus('loading');
            const { data } = await api.get<Coupon[]>('/coupons');
            setCoupons(data);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => { load(); }, []);

    const counts = useMemo(() => {
        const c = { all: coupons.length, active: 0, used: 0, expired: 0 };
        coupons.forEach((coupon) => { c[statusOf(coupon)] += 1; });
        return c;
    }, [coupons]);

    const visible = filter === 'all' ? coupons : coupons.filter((c) => statusOf(c) === filter);

    const onCreate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.post('/coupons', { ...form, code: form.code.trim().toUpperCase() });
            addToast(`Cupom ${form.code.toUpperCase()} criado.`, 'success');
            setCreating(false);
            setForm(EMPTY_FORM);
            load();
        } catch (error: unknown) {
            const res = (error as { response?: { data?: { error?: string; details?: { message?: string }[] } } }).response?.data;
            addToast(res?.details?.[0]?.message || res?.error || 'Não foi possível criar o cupom.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async () => {
        if (!toDelete) return;
        try {
            setDeleting(true);
            await api.delete(`/coupons/${toDelete.id}`);
            setCoupons((prev) => prev.filter((c) => c.id !== toDelete.id));
            addToast('Cupom excluído.', 'success');
            setToDelete(null);
        } catch {
            addToast('Não foi possível excluir o cupom. Ele pode estar ligado a um pedido.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const copy = async (coupon: Coupon) => {
        try {
            await navigator.clipboard.writeText(coupon.code);
            setCopiedId(coupon.id);
            setTimeout(() => setCopiedId(null), 1800);
        } catch {
            addToast('Não foi possível copiar. Selecione o código manualmente.', 'error');
        }
    };

    const tone = (s: Exclude<Filter, 'all'>) => (s === 'active' ? 'accent' : s === 'used' ? 'neutral' : 'muted');

    return (
        <CrmPage
            eyebrow="Ferramentas"
            title="Cupons"
            description="Códigos de desconto extra que o cliente aplica no resumo do projeto, no catálogo."
            actions={<button type="button" onClick={() => setCreating(true)} className={crmBtn.primary}><Plus className="h-4 w-4" aria-hidden="true" /> Novo cupom</button>}
        >
            {/* Filtros por situação */}
            <div role="tablist" aria-label="Filtrar cupons" className="flex flex-wrap gap-px border border-brand-border bg-brand-border">
                {(['all', 'active', 'used', 'expired'] as Filter[]).map((f) => (
                    <button
                        key={f}
                        role="tab"
                        aria-selected={filter === f}
                        onClick={() => setFilter(f)}
                        className={`flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm transition-colors ${filter === f ? 'bg-brand-surface text-brand-text' : 'bg-brand-background text-brand-muted hover:text-brand-text'}`}
                    >
                        {f === 'all' ? 'Todos' : STATUS_LABEL[f]} <span className="font-mono text-xs text-brand-muted">{counts[f]}</span>
                    </button>
                ))}
            </div>

            {status === 'loading' && (
                <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
            )}

            {status === 'error' && (
                <EmptyState title="Não foi possível carregar os cupons" text="Verifique a conexão e tente de novo." action={<button type="button" onClick={load} className={crmBtn.secondary}>Tentar de novo</button>} />
            )}

            {status === 'ready' && visible.length === 0 && (
                <EmptyState
                    title={filter === 'all' ? 'Nenhum cupom criado' : `Nenhum cupom ${STATUS_LABEL[filter as Exclude<Filter, 'all'>].toLowerCase()}`}
                    text={filter === 'all' ? 'Crie um código para oferecer um desconto extra em uma negociação.' : undefined}
                    action={filter === 'all' ? <button type="button" onClick={() => setCreating(true)} className={crmBtn.primary}><Plus className="h-4 w-4" aria-hidden="true" /> Novo cupom</button> : undefined}
                />
            )}

            {status === 'ready' && visible.length > 0 && (
                <div className="border border-brand-border bg-brand-surface">
                    {/* Cabeçalho da tabela (desktop) */}
                    <div className="hidden grid-cols-[1.4fr_0.8fr_1fr_1fr_1fr_auto] gap-4 border-b border-brand-border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-brand-muted md:grid">
                        <span>Código</span><span>Desconto</span><span>Pedido mínimo</span><span>Validade</span><span>Situação</span><span className="w-20" />
                    </div>
                    <ul className="divide-y divide-brand-border">
                        {visible.map((coupon) => {
                            const s = statusOf(coupon);
                            return (
                                <li key={coupon.id} className="grid grid-cols-2 items-center gap-x-4 gap-y-2 px-5 py-4 md:grid-cols-[1.4fr_0.8fr_1fr_1fr_1fr_auto]">
                                    <div className="col-span-2 flex items-center gap-2 md:col-span-1">
                                        <span className={`font-mono text-base tracking-wider ${s === 'active' ? 'text-brand-text' : 'text-brand-muted line-through'}`}>{coupon.code}</span>
                                        <button type="button" onClick={() => copy(coupon)} className={crmBtn.icon} aria-label={`Copiar ${coupon.code}`}>
                                            {copiedId === coupon.id ? <Check className="h-4 w-4 text-brand-neon" /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
                                        </button>
                                    </div>
                                    <p className="font-mono text-sm text-brand-text"><span className="text-brand-muted md:hidden">Desconto </span>{describe(coupon)}</p>
                                    <p className="text-sm text-brand-muted">{coupon.minValue ? <>a partir de {formatBRL(coupon.minValue)}</> : 'Sem mínimo'}</p>
                                    <p className="text-sm text-brand-muted">{coupon.validUntil ? `até ${formatDate(coupon.validUntil)}` : 'Sem validade'}</p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge tone={tone(s)}>{STATUS_LABEL[s]}</Badge>
                                        <span className="text-xs text-brand-muted">{coupon.isUsed && coupon.usedBy ? coupon.usedBy.name : coupon.singleUse ? 'Uso único' : 'Uso livre'}</span>
                                    </div>
                                    <div className="col-span-2 flex justify-end md:col-span-1 md:w-20">
                                        <button type="button" onClick={() => setToDelete(coupon)} className={crmBtn.ghost} aria-label={`Excluir ${coupon.code}`}>
                                            <Trash2 className="h-4 w-4" strokeWidth={1.75} /> <span className="md:sr-only">Excluir</span>
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* ============================ NOVO CUPOM ============================ */}
            <Sheet
                open={creating}
                onClose={() => setCreating(false)}
                eyebrow="Cupons"
                title="Novo cupom"
                footer={<>
                    <button type="button" onClick={() => setCreating(false)} className={crmBtn.secondary}>Cancelar</button>
                    <button type="submit" form="coupon-form" disabled={saving} className={crmBtn.primary}>{saving ? 'Criando…' : 'Criar cupom'}</button>
                </>}
            >
                <form id="coupon-form" onSubmit={onCreate} className="grid grid-cols-2 gap-4">
                    <Field label="Código" htmlFor="c-code" hint="Letras e números, de 3 a 50 caracteres." className="col-span-2">
                        <div className="flex">
                            <input id="c-code" required minLength={3} maxLength={50} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })} className={`${crmInput} font-mono uppercase tracking-wider`} placeholder="VERAO2026" />
                            <button type="button" onClick={() => setForm({ ...form, code: randomCode() })} className="border border-l-0 border-brand-border px-3 text-brand-muted hover:text-brand-text" aria-label="Gerar código aleatório" title="Gerar código">
                                <Shuffle className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                        </div>
                    </Field>
                    <Field label="Tipo" htmlFor="c-type">
                        <select id="c-type" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as Coupon['discountType'] })} className={crmInput}>
                            <option value="PERCENTAGE">Porcentagem</option>
                            <option value="FIXED_VALUE">Valor fixo (R$)</option>
                        </select>
                    </Field>
                    <Field label={form.discountType === 'PERCENTAGE' ? 'Desconto (%)' : 'Desconto (R$)'} htmlFor="c-value">
                        <input id="c-value" required type="number" inputMode="decimal" min="0.01" max={form.discountType === 'PERCENTAGE' ? 100 : undefined} step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={`${crmInput} font-mono`} />
                    </Field>
                    <Field label="Pedido mínimo (R$)" htmlFor="c-min" hint="Opcional.">
                        <input id="c-min" type="number" inputMode="decimal" min="0" step="0.01" value={form.minValue} onChange={(e) => setForm({ ...form, minValue: e.target.value })} className={`${crmInput} font-mono`} />
                    </Field>
                    <Field label="Válido até" htmlFor="c-until" hint="Opcional. Vale até o fim do dia.">
                        <input id="c-until" type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className={crmInput} />
                    </Field>
                    <label className="col-span-2 flex cursor-pointer items-start gap-3 border border-brand-border p-3.5">
                        <input type="checkbox" checked={form.singleUse} onChange={(e) => setForm({ ...form, singleUse: e.target.checked })} className="mt-0.5 h-4 w-4 accent-brand-neon" />
                        <span>
                            <span className="block text-sm text-brand-text">Uso único</span>
                            <span className="block text-xs text-brand-muted">O cupom deixa de valer depois do primeiro pedido que o usar.</span>
                        </span>
                    </label>
                </form>
            </Sheet>

            <ConfirmSheet
                open={Boolean(toDelete)}
                title={`Excluir ${toDelete?.code ?? 'cupom'}?`}
                text="O código deixa de funcionar na hora. Pedidos que já usaram o cupom não mudam."
                busy={deleting}
                onConfirm={onDelete}
                onClose={() => setToDelete(null)}
            />
        </CrmPage>
    );
}
