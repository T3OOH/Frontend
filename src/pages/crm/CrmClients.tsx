import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, FileDown, MessageCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { crmService, CrmClient, CrmDeal, CreateClientData } from '@/services/crm.service';
import { useToast } from '@/contexts/ToastContext';
import { downloadDealContract } from '@/lib/pdf/contract';
import { Badge, ConfirmSheet, CrmPage, EmptyState, Field, Sheet, Skeleton } from '@/components/app/ui';
import { crmBtn, crmInput, formatBRL, formatDate, initials, whatsappUrl } from '@/components/app/tokens';

const EMPTY_FORM: CreateClientData = { name: '', company: '', email: '', phone: '', document: '', city: '' };

const STATUS = {
    OPEN: { label: 'Em andamento', tone: 'neutral' },
    WON: { label: 'Ganho', tone: 'accent' },
    LOST: { label: 'Perdido', tone: 'muted' },
} as const;

const errorMessage = (error: unknown, fallback: string) => {
    const data = (error as { response?: { data?: { error?: string; details?: { message?: string; path?: string[] }[] } } }).response?.data;
    const detail = data?.details?.[0];
    if (detail?.path?.[0] === 'email') return 'E-mail inválido.';
    if (detail?.path?.[0] === 'name') return 'O nome precisa de pelo menos 2 letras.';
    return data?.error || fallback;
};

/** Tira espaços das pontas. Campos vazios seguem como "" para que a edição consiga apagar um dado. */
const clean = (data: CreateClientData): CreateClientData =>
    Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])) as unknown as CreateClientData;

export function CrmClients() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [clients, setClients] = useState<CrmClient[]>([]);
    const [deals, setDeals] = useState<CrmDeal[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [query, setQuery] = useState('');

    const [profile, setProfile] = useState<CrmClient | null>(null);
    const [editing, setEditing] = useState<CrmClient | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<CreateClientData>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [toDelete, setToDelete] = useState<CrmClient | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [creatingDealFor, setCreatingDealFor] = useState<string | null>(null);

    const load = async () => {
        try {
            setStatus('loading');
            const [c, d] = await Promise.all([crmService.getClients(), crmService.getDeals()]);
            setClients(c);
            setDeals(d);
            setStatus('ready');
            return { c, d };
        } catch {
            setStatus('error');
            return null;
        }
    };

    useEffect(() => {
        load().then((data) => {
            // Link vindo do funil: /crm/clientes?dealId=...
            const dealId = searchParams.get('dealId');
            if (!data || !dealId) return;
            const deal = data.d.find((x) => x.id === dealId);
            const client = deal && data.c.find((x) => x.id === deal.clientId);
            if (client) setProfile(client);
            else addToast('Este cliente não está na sua carteira.', 'info');
            searchParams.delete('dealId');
            setSearchParams(searchParams, { replace: true });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return clients;
        const digits = q.replace(/\D/g, '');
        return clients.filter((c) =>
            [c.name, c.company, c.email, c.city].some((v) => v?.toLowerCase().includes(q)) ||
            (digits.length >= 3 && [c.phone, c.whatsapp, c.document].some((v) => v?.replace(/\D/g, '').includes(digits))),
        );
    }, [clients, query]);

    const profileDeals = profile ? deals.filter((d) => d.clientId === profile.id) : [];

    const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormOpen(true); };
    const openEdit = (client: CrmClient) => {
        setEditing(client);
        setForm({ name: client.name, company: client.company || '', email: client.email || '', phone: client.phone || '', document: client.document || '', city: client.city || '' });
        setFormOpen(true);
    };

    const onSave = async (e: FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (editing) {
                const updated = await crmService.updateClient(editing.id, clean(form));
                setProfile((p) => (p?.id === editing.id ? { ...p, ...updated } : p));
                addToast('Cliente atualizado.', 'success');
            } else {
                await crmService.createClient(clean(form));
                addToast('Cliente cadastrado.', 'success');
            }
            setFormOpen(false);
            load();
        } catch (error) {
            addToast(errorMessage(error, 'Não foi possível salvar o cliente.'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async () => {
        if (!toDelete) return;
        try {
            setDeleting(true);
            await crmService.deleteClient(toDelete.id);
            addToast('Cliente excluído.', 'success');
            setToDelete(null);
            setProfile(null);
            load();
        } catch (error) {
            addToast(errorMessage(error, 'Não foi possível excluir o cliente.'), 'error');
        } finally {
            setDeleting(false);
        }
    };

    const newDeal = async (client: CrmClient) => {
        try {
            setCreatingDealFor(client.id);
            await crmService.createDeal({ clientId: client.id, title: `Oportunidade · ${client.company || client.name}`, expectedValue: 0 });
            addToast('Oportunidade criada em novos leads.', 'success');
            navigate('/crm/pipeline');
        } catch (error) {
            addToast(errorMessage(error, 'Não foi possível criar a oportunidade.'), 'error');
        } finally {
            setCreatingDealFor(null);
        }
    };

    const contract = (deal: CrmDeal) => {
        try {
            downloadDealContract(deal, profile);
        } catch {
            addToast('Não foi possível gerar o contrato.', 'error');
        }
    };

    const field = (key: keyof CreateClientData, label: string, props: Record<string, unknown> = {}, className = '') => (
        <Field label={label} htmlFor={`cl-${key}`} className={className}>
            <input id={`cl-${key}`} value={(form[key] as string) ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={crmInput} {...props} />
        </Field>
    );

    return (
        <CrmPage
            eyebrow="Carteira"
            title="Clientes"
            description="Contatos, empresas e o histórico de negócios de cada cliente."
            actions={<button type="button" onClick={openCreate} className={crmBtn.primary}><Plus className="h-4 w-4" aria-hidden="true" /> Novo cliente</button>}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:max-w-md">
                    <label htmlFor="client-search" className="sr-only">Buscar clientes</label>
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" aria-hidden="true" />
                    <input id="client-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome, empresa, e-mail, telefone ou documento" className={`${crmInput} pl-10`} />
                </div>
                {status === 'ready' && <p className="text-sm text-brand-muted"><span className="font-mono text-brand-text">{filtered.length}</span> de {clients.length} clientes</p>}
            </div>

            {status === 'loading' && <div className="flex flex-col gap-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>}

            {status === 'error' && <EmptyState title="Não foi possível carregar a carteira" action={<button type="button" onClick={load} className={crmBtn.secondary}>Tentar de novo</button>} />}

            {status === 'ready' && filtered.length === 0 && (
                clients.length === 0
                    ? <EmptyState title="Carteira vazia" text="Cadastre um cliente ou assuma um lead da fila na tela inicial." action={<button type="button" onClick={openCreate} className={crmBtn.primary}><Plus className="h-4 w-4" aria-hidden="true" /> Novo cliente</button>} />
                    : <EmptyState title="Nenhum cliente encontrado" text={`Nada bate com "${query}".`} action={<button type="button" onClick={() => setQuery('')} className={crmBtn.secondary}>Limpar busca</button>} />
            )}

            {status === 'ready' && filtered.length > 0 && (
                <div className="border border-brand-border bg-brand-surface">
                    <div className="hidden grid-cols-[2fr_1.6fr_1fr_0.6fr_0.9fr] gap-4 border-b border-brand-border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-brand-muted md:grid">
                        <span>Cliente</span><span>Contato</span><span>Cidade</span><span>Negócios</span><span>Desde</span>
                    </div>
                    <ul className="divide-y divide-brand-border">
                        {filtered.map((client) => (
                            <li key={client.id}>
                                <button type="button" onClick={() => setProfile(client)} className="grid w-full grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 px-5 py-3.5 text-left hover:bg-brand-background md:grid-cols-[2fr_1.6fr_1fr_0.6fr_0.9fr] md:gap-4">
                                    <span className="flex min-w-0 items-center gap-3 md:col-span-1">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-brand-border font-mono text-xs text-brand-muted" aria-hidden="true">{initials(client.name)}</span>
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium text-brand-text">{client.name}</span>
                                            <span className="block truncate text-xs text-brand-muted">{client.company || client.document || 'Pessoa física'}</span>
                                        </span>
                                    </span>
                                    <span className="col-start-2 min-w-0 truncate text-sm text-brand-muted md:col-start-auto">{[client.phone || client.whatsapp, client.email].filter(Boolean).join(' · ') || '—'}</span>
                                    <span className="hidden truncate text-sm text-brand-muted md:block">{client.city || '—'}</span>
                                    <span className="hidden font-mono text-sm text-brand-text md:block">{client._count?.deals ?? 0}</span>
                                    <span className="hidden font-mono text-sm text-brand-muted md:block">{formatDate(client.createdAt)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ============================ FICHA ============================ */}
            <Sheet
                open={Boolean(profile)}
                onClose={() => setProfile(null)}
                eyebrow="Ficha do cliente"
                title={profile?.name ?? ''}
                size="lg"
                footer={profile && <>
                    <button type="button" onClick={() => setToDelete(profile)} className={`${crmBtn.ghost} sm:mr-auto`}><Trash2 className="h-4 w-4" aria-hidden="true" /> Excluir</button>
                    <button type="button" onClick={() => openEdit(profile)} className={crmBtn.secondary}><Pencil className="h-4 w-4" aria-hidden="true" /> Editar</button>
                    <button type="button" onClick={() => newDeal(profile)} disabled={creatingDealFor === profile.id} className={crmBtn.primary}><Briefcase className="h-4 w-4" aria-hidden="true" /> Nova oportunidade</button>
                </>}
            >
                {profile && (
                    <div className="flex flex-col gap-6">
                        <dl className="grid grid-cols-1 gap-px border border-brand-border bg-brand-border sm:grid-cols-2">
                            {[
                                ['Empresa', profile.company],
                                ['CPF / CNPJ', profile.document],
                                ['E-mail', profile.email],
                                ['Telefone', profile.phone || profile.whatsapp],
                                ['Cidade', [profile.city, profile.state].filter(Boolean).join(' - ')],
                                ['Na carteira desde', formatDate(profile.createdAt)],
                            ].map(([k, v]) => (
                                <div key={k} className="bg-brand-surface p-3">
                                    <dt className="text-xs text-brand-muted">{k}</dt>
                                    <dd className="mt-1 truncate text-sm text-brand-text">{v || '—'}</dd>
                                </div>
                            ))}
                        </dl>

                        {(profile.phone || profile.whatsapp) && (
                            <a href={whatsappUrl(profile.whatsapp || profile.phone || '', `Olá, ${profile.name.split(' ')[0]}! Aqui é do comercial da T3 OOH.`)} target="_blank" rel="noopener noreferrer" className={`${crmBtn.secondary} self-start`}>
                                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Conversar no WhatsApp
                            </a>
                        )}

                        <div>
                            <p className="mb-2 text-sm text-brand-muted">Negócios ({profileDeals.length})</p>
                            {profileDeals.length === 0 ? (
                                <p className="border border-dashed border-brand-border p-5 text-sm text-brand-muted">Nenhum negócio com este cliente ainda.</p>
                            ) : (
                                <ul className="divide-y divide-brand-border border border-brand-border">
                                    {profileDeals.map((deal) => (
                                        <li key={deal.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-brand-text">{deal.title}</p>
                                                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-brand-muted">
                                                    <Badge tone={STATUS[deal.status].tone}>{STATUS[deal.status].label}</Badge>
                                                    {formatDate(deal.createdAt)} · <span className="font-mono text-brand-text">{formatBRL(deal.expectedValue)}</span>
                                                </p>
                                            </div>
                                            <button type="button" onClick={() => contract(deal)} className={crmBtn.secondary}><FileDown className="h-4 w-4" aria-hidden="true" /> Contrato</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </Sheet>

            {/* ============================ CADASTRO / EDIÇÃO ============================ */}
            <Sheet
                open={formOpen}
                onClose={() => setFormOpen(false)}
                eyebrow="Carteira"
                title={editing ? `Editar ${editing.name}` : 'Novo cliente'}
                footer={<>
                    <button type="button" onClick={() => setFormOpen(false)} className={crmBtn.secondary}>Cancelar</button>
                    <button type="submit" form="client-form" disabled={saving} className={crmBtn.primary}>{saving ? 'Salvando…' : editing ? 'Salvar' : 'Cadastrar'}</button>
                </>}
            >
                <form id="client-form" onSubmit={onSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {field('name', 'Nome do contato', { required: true, minLength: 2, autoComplete: 'off' }, 'sm:col-span-2')}
                    {field('company', 'Empresa ou agência', { autoComplete: 'off' }, 'sm:col-span-2')}
                    {field('phone', 'Telefone / WhatsApp', { type: 'tel', inputMode: 'tel', placeholder: '(62) 9 0000-0000' })}
                    {field('document', 'CPF ou CNPJ', { inputMode: 'numeric' })}
                    {field('email', 'E-mail', { type: 'email' }, 'sm:col-span-2')}
                    {field('city', 'Cidade', { placeholder: 'Goiânia' }, 'sm:col-span-2')}
                </form>
            </Sheet>

            <ConfirmSheet
                open={Boolean(toDelete)}
                title={`Excluir ${toDelete?.name ?? 'cliente'}?`}
                text="Os negócios e as mensagens deste cliente também serão apagados. Essa ação não pode ser desfeita."
                busy={deleting}
                onConfirm={onDelete}
                onClose={() => setToDelete(null)}
            />
        </CrmPage>
    );
}
