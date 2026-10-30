import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Database, Download, ExternalLink, GitCommit, Globe, LifeBuoy, RefreshCw, Search, Server, XCircle } from 'lucide-react';
import { CrmPage, Badge, EmptyState, Field, Sheet, Skeleton } from '@/components/app/ui';
import { crmBtn, crmInput } from '@/components/app/tokens';
import { downloadCsv } from '@/components/app/charts';
import { CustomSelect } from '@/components/CustomSelect';
import { supportUrl } from '@/lib/support';
import { AuditFilters, AuditLevel, AuditLog, AuditPage, AuditSource, auditService } from '@/services/audit.service';

const PERIODS = [{ value: '1', label: 'Últimas 24 horas' }, { value: '7', label: '7 dias' }, { value: '30', label: '30 dias' }, { value: '90', label: '90 dias' }, { value: '365', label: '12 meses' }];

const LEVEL: Record<AuditLevel, { label: string; tone: 'muted' | 'accent' | 'danger' }> = {
    info: { label: 'Informação', tone: 'muted' },
    warning: { label: 'Atenção', tone: 'accent' },
    error: { label: 'Erro', tone: 'danger' },
};

const SOURCE: Record<AuditSource, { label: string; icon: typeof Server }> = {
    api: { label: 'Sistema', icon: Server },
    database: { label: 'Direto no banco', icon: Database },
    repository: { label: 'Repositório', icon: GitCommit },
    client: { label: 'Site (navegador)', icon: Globe },
};

const ACTION: Record<string, string> = {
    create: 'Criação', update: 'Alteração', delete: 'Exclusão', upsert: 'Gravação', error: 'Erro',
    commit: 'Commit', merge: 'PR mesclado', deploy: 'Início da API',
};

/** Nome de cada tabela como a equipe fala. */
const ENTITY: Record<string, string> = {
    companies: 'Empresas', users: 'Usuários', panels: 'Painéis', institutional: 'Página Sobre', categories: 'Categorias',
    orders: 'Pedidos', order_items: 'Itens de pedido', crm_clients: 'Clientes (CRM)', crm_deals: 'Negócios', crm_deal_items: 'Painéis dos negócios',
    crm_activities: 'Atividades', crm_notes: 'Anotações', crm_coupons: 'Cupons', agenda_tasks: 'Agenda', banners: 'Banners',
    solution_portfolio: 'Portfólio Solution', contacts: 'Contatos do site', system_settings: 'Configurações', security_events: 'Segurança',
    servidor: 'Servidor', Backend: 'Repositório Backend', Frontend: 'Repositório Frontend',
};
const entityName = (e: string | null) => (e ? ENTITY[e] ?? e : '—');

const dateTime = (iso: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(iso));
const show = (v: unknown) => (v == null || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));

function useDebounced<T>(value: T, ms: number) {
    const [v, setV] = useState(value);
    useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
    return v;
}

// ============================ DETALHE ============================

function Changes({ log }: { log: AuditLog }) {
    const c = log.changes ?? {};
    const fields = c.fields as Record<string, { from: unknown; to: unknown }> | undefined;
    const record = (c.after ?? c.before) as Record<string, unknown> | undefined;
    const stack = c.stack as string | undefined;
    const url = c.url as string | undefined;
    const message = c.message as string | undefined;

    return (
        <div className="flex flex-col gap-5">
            {fields && Object.keys(fields).length > 0 && (
                <div className="overflow-x-auto border border-brand-border">
                    <table className="w-full min-w-[420px] text-sm">
                        <thead><tr className="border-b border-brand-border text-left text-xs text-brand-muted"><th className="px-3 py-2 font-normal">Campo</th><th className="px-3 py-2 font-normal">Antes</th><th className="px-3 py-2 font-normal">Depois</th></tr></thead>
                        <tbody className="divide-y divide-brand-border">
                            {Object.entries(fields).map(([k, v]) => (
                                <tr key={k}>
                                    <td className="px-3 py-2 font-mono text-xs text-brand-muted">{k}</td>
                                    <td className="break-all px-3 py-2 font-mono text-xs text-red-500/90 line-through decoration-red-500/40">{show(v.from)}</td>
                                    <td className="break-all px-3 py-2 font-mono text-xs text-emerald-500">{show(v.to)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {record && (
                <div>
                    <p className="mb-2 text-xs text-brand-muted">{c.after ? 'Registro criado' : 'Registro excluído'}</p>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 border border-brand-border p-3 sm:grid-cols-[max-content_1fr]">
                        {Object.entries(record).map(([k, v]) => (
                            <div key={k} className="contents">
                                <dt className="font-mono text-xs text-brand-muted">{k}</dt>
                                <dd className="break-all font-mono text-xs text-brand-text">{show(v)}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            )}
            {message && <p className="whitespace-pre-wrap text-sm text-brand-text">{message}</p>}
            {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 self-start text-sm text-brand-text underline underline-offset-4">
                    Abrir <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
            )}
            {stack && (
                <div>
                    <p className="mb-2 text-xs text-brand-muted">Detalhe técnico</p>
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all border border-brand-border bg-brand-background p-3 font-mono text-[11px] leading-relaxed text-brand-muted">{stack}</pre>
                </div>
            )}
        </div>
    );
}

function Detail({ log, onClose }: { log: AuditLog | null; onClose: () => void }) {
    const meta: [string, string | null][] = log ? [
        ['Quando', dateTime(log.createdAt)],
        ['Origem', SOURCE[log.source]?.label ?? log.source],
        ['Ação', ACTION[log.action] ?? log.action],
        ['Onde', entityName(log.entity)],
        ['Registro', log.entityId],
        ['Quem', log.actorName ? `${log.actorName}${log.actorRole ? ` · ${log.actorRole}` : ''}` : null],
        ['Rota', log.method && log.path ? `${log.method} ${log.path}` : log.path],
        ['Status', log.status ? String(log.status) : null],
        ['IP', log.ip],
        ['Requisição', log.requestId],
        ['Código', log.id],
    ] : [];

    return (
        <Sheet
            open={Boolean(log)}
            onClose={onClose}
            size="lg"
            eyebrow={log ? `${LEVEL[log.level]?.label ?? log.level} · ${SOURCE[log.source]?.label ?? log.source}` : undefined}
            title={log?.summary ?? ''}
            footer={log?.level === 'error' ? (
                <a href={supportUrl({ message: log.summary, code: log.id, page: log.path ?? undefined })} target="_blank" rel="noopener noreferrer" className={crmBtn.primary}>
                    <LifeBuoy className="h-4 w-4" aria-hidden="true" /> Enviar ao suporte
                </a>
            ) : undefined}
        >
            {log && (
                <div className="flex flex-col gap-6">
                    <p className="text-sm text-brand-text">{log.summary}</p>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                        {meta.filter(([, v]) => v).map(([k, v]) => (
                            <div key={k} className="min-w-0">
                                <dt className="text-xs text-brand-muted">{k}</dt>
                                <dd className="mt-0.5 break-all font-mono text-xs text-brand-text">{v}</dd>
                            </div>
                        ))}
                    </dl>
                    <Changes log={log} />
                </div>
            )}
        </Sheet>
    );
}

// ============================ PÁGINA ============================

const LEVEL_FILTERS: { value: AuditLevel | ''; label: string }[] = [{ value: '', label: 'Tudo' }, { value: 'error', label: 'Erros' }, { value: 'warning', label: 'Atenção' }, { value: 'info', label: 'Informação' }];
const PAGE_SIZE = 50;

export function AuditLogPage() {
    const [days, setDays] = useState('7');
    const [level, setLevel] = useState<AuditLevel | ''>('');
    const [source, setSource] = useState<AuditSource | ''>('');
    const [entity, setEntity] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const q = useDebounced(query.trim(), 350);

    const [data, setData] = useState<AuditPage | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [entities, setEntities] = useState<{ entity: string; count: number }[]>([]);
    const [open, setOpen] = useState<AuditLog | null>(null);
    const [exporting, setExporting] = useState(false);

    const filters: AuditFilters = useMemo(() => ({ days: Number(days), level, source, entity, q }), [days, level, source, entity, q]);

    const load = useCallback(async () => {
        setStatus('loading');
        try {
            setData(await auditService.list({ ...filters, page, pageSize: PAGE_SIZE }));
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    }, [filters, page]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [filters]);
    useEffect(() => { auditService.facets().then((f) => setEntities(f.entities)).catch(() => {}); }, []);

    const exportCsv = async () => {
        setExporting(true);
        try {
            const all = await auditService.list({ ...filters, page: 1, pageSize: 2000 });
            downloadCsv(
                `registros-${new Date().toISOString().slice(0, 10)}.csv`,
                ['Quando', 'Nível', 'Origem', 'Ação', 'Onde', 'Registro', 'Resumo', 'Quem', 'Perfil', 'Rota', 'Status', 'IP', 'Código'],
                all.items.map((l) => [dateTime(l.createdAt), LEVEL[l.level]?.label ?? l.level, SOURCE[l.source]?.label ?? l.source, ACTION[l.action] ?? l.action,
                    entityName(l.entity), l.entityId ?? '', l.summary, l.actorName ?? '', l.actorRole ?? '', [l.method, l.path].filter(Boolean).join(' '), l.status ?? '', l.ip ?? '', l.id]),
            );
        } finally {
            setExporting(false);
        }
    };

    const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
    const counts = data?.counts ?? {};
    const totalAll = (counts.info ?? 0) + (counts.warning ?? 0) + (counts.error ?? 0);

    return (
        <CrmPage
            eyebrow="Gestão"
            title="Registros"
            description="Tudo o que muda no sistema, no banco de dados e nos repositórios, e os erros da API e do site. Filtre, pesquise e abra cada item para ver o antes e o depois."
            wide
            actions={
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={load} className={crmBtn.icon} aria-label="Atualizar"><RefreshCw className="h-4 w-4" /></button>
                    <button type="button" onClick={exportCsv} disabled={exporting || !data?.total} className={crmBtn.secondary}>
                        <Download className="h-4 w-4" aria-hidden="true" /> {exporting ? 'Exportando…' : 'Exportar (CSV)'}
                    </button>
                </div>
            }
        >
            <div className="flex flex-col gap-4">
                {/* Nível, com a contagem de cada um nos filtros atuais */}
                <div role="radiogroup" aria-label="Nível" className="grid grid-cols-2 gap-px border border-brand-border bg-brand-border sm:grid-cols-4">
                    {LEVEL_FILTERS.map((f) => {
                        const n = f.value ? counts[f.value] ?? 0 : totalAll;
                        const Icon = f.value === 'error' ? XCircle : f.value === 'warning' ? AlertTriangle : null;
                        return (
                            <button key={f.label} type="button" role="radio" aria-checked={level === f.value} onClick={() => setLevel(f.value)}
                                className={`flex min-h-11 items-center justify-between gap-2 px-4 py-2.5 text-left text-sm ${level === f.value ? 'bg-brand-surface font-medium text-brand-text shadow-[inset_0_-2px_0_rgb(255,94,0)]' : 'bg-brand-background text-brand-muted hover:text-brand-text'}`}>
                                <span className="flex items-center gap-2">{Icon && <Icon className={`h-4 w-4 ${f.value === 'error' ? 'text-red-500' : 'text-brand-neon'}`} aria-hidden="true" />}{f.label}</span>
                                <span className="font-mono text-xs">{data ? n.toLocaleString('pt-BR') : '·'}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
                    <Field label="Pesquisar" htmlFor="audit-q">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" aria-hidden="true" />
                            <input id="audit-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome, painel, cliente, rota, código…" className={`${crmInput} pl-9`} />
                        </div>
                    </Field>
                    <Field label="Período" htmlFor="audit-days">
                        <CustomSelect id="audit-days" value={days} onChange={setDays} options={PERIODS} />
                    </Field>
                    <Field label="Origem" htmlFor="audit-source">
                        <CustomSelect id="audit-source" value={source} onChange={(v) => setSource(v as AuditSource | '')}
                            options={[{ value: '', label: 'Todas' }, ...(Object.keys(SOURCE) as AuditSource[]).map((s) => ({ value: s, label: SOURCE[s].label }))]} />
                    </Field>
                    <Field label="Onde" htmlFor="audit-entity">
                        <CustomSelect id="audit-entity" value={entity} onChange={setEntity}
                            options={[{ value: '', label: 'Todos' }, ...entities.map((e) => ({ value: e.entity, label: entityName(e.entity), hint: e.count.toLocaleString('pt-BR') }))]} />
                    </Field>
                </div>

                {status === 'error' && (
                    <EmptyState title="Não foi possível carregar os registros" text="Confira a conexão e tente de novo." action={<button type="button" onClick={load} className={crmBtn.secondary}>Tentar de novo</button>} />
                )}

                {status === 'loading' && !data && <div className="flex flex-col gap-px">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16" />)}</div>}

                {data && status !== 'error' && (
                    data.items.length === 0 ? (
                        <EmptyState title="Nada encontrado" text="Mude o período, a origem ou a pesquisa." />
                    ) : (
                        <div className={`transition-opacity ${status === 'loading' ? 'opacity-60' : ''}`}>
                            <p className="mb-2 text-xs text-brand-muted"><span className="font-mono text-brand-text">{data.total.toLocaleString('pt-BR')}</span> {data.total === 1 ? 'registro' : 'registros'}</p>
                            <ul className="divide-y divide-brand-border border border-brand-border bg-brand-surface">
                                {data.items.map((l) => {
                                    const S = SOURCE[l.source]?.icon ?? Server;
                                    return (
                                        <li key={l.id}>
                                            <button type="button" onClick={() => setOpen(l)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-brand-background md:items-center">
                                                <S className="mt-0.5 h-4 w-4 shrink-0 text-brand-muted md:mt-0" strokeWidth={1.75} aria-hidden="true" />
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex flex-wrap items-center gap-2">
                                                        {l.level !== 'info' && <Badge tone={LEVEL[l.level].tone}>{LEVEL[l.level].label}</Badge>}
                                                        <span className="min-w-0 truncate text-sm text-brand-text" title={l.summary}>{l.summary}</span>
                                                    </span>
                                                    <span className="mt-1 block truncate text-xs text-brand-muted">
                                                        {[SOURCE[l.source]?.label, entityName(l.entity), l.actorName, l.status ? `HTTP ${l.status}` : null].filter((v) => v && v !== '—').join(' · ')}
                                                    </span>
                                                </span>
                                                <span className="hidden shrink-0 font-mono text-xs text-brand-muted sm:block">{dateTime(l.createdAt)}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                            {pages > 1 && (
                                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                                    <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className={crmBtn.secondary}>Anteriores</button>
                                    <span className="font-mono text-xs text-brand-muted">{page} / {pages}</span>
                                    <button type="button" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} className={crmBtn.secondary}>Próximos</button>
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>

            <Detail log={open} onClose={() => setOpen(null)} />
        </CrmPage>
    );
}
