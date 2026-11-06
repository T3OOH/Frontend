import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPlayback } from '@/lib/playback';
import { Crosshair, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { panelsService, PanelData, PanelStatus } from '@/services/panels.service';
import { useToast } from '@/contexts/ToastContext';
import { parseImpacts, formatImpacts } from '@/lib/impacts';
import { Badge, ConfirmSheet, CrmPage, EmptyState, Skeleton } from '@/components/app/ui';
import { crmBtn, crmInput, formatBRL } from '@/components/app/tokens';
import { estiloFoco, thumb } from '@/lib/imagens';
type Filter = 'ALL' | PanelStatus;

const STATUS: Record<PanelStatus, { label: string; tone: 'accent' | 'neutral' | 'muted' | 'danger' }> = {
    AVAILABLE: { label: 'Disponível', tone: 'accent' },
    OCCUPIED: { label: 'Ocupado', tone: 'neutral' },
    RESERVED: { label: 'Reservado', tone: 'neutral' },
    MAINTENANCE: { label: 'Manutenção', tone: 'muted' },
};

export function Panels() {
    const toast = useToast();
    const [panels, setPanels] = useState<PanelData[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('ALL');
    const [toDelete, setToDelete] = useState<PanelData | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = async () => {
        try {
            setStatus('loading');
            setPanels(await panelsService.getAllPanels());
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => { load(); }, []);

    const counts = useMemo(() => {
        const c: Record<Filter, number> = { ALL: panels.length, AVAILABLE: 0, OCCUPIED: 0, RESERVED: 0, MAINTENANCE: 0 };
        panels.forEach((p) => { c[p.status] = (c[p.status] ?? 0) + 1; });
        return c;
    }, [panels]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return panels.filter((p) =>
            (filter === 'ALL' || p.status === filter) &&
            (!q || [p.name, p.city, p.state, p.address].some((v) => v?.toLowerCase().includes(q))),
        );
    }, [panels, query, filter]);

    const onDelete = async () => {
        if (!toDelete) return;
        try {
            setDeleting(true);
            await panelsService.deletePanel(toDelete.id);
            setPanels((prev) => prev.filter((p) => p.id !== toDelete.id));
            toast.success('Painel excluído.');
            setToDelete(null);
        } catch (error) {
            toast.error((error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Não foi possível excluir o painel. Ele pode estar em pedidos ou negócios.');
        } finally {
            setDeleting(false);
        }
    };

    // Foco das fotos em lote. "Focar fotos": as que ainda não têm foco (painéis antigos ou cadastrados
    // pelo app). "Refazer foco automático": todas as de foco automático, de novo (mantém pino e recorte).
    // Foco ajustado à mão nunca é trocado.
    const precisa = (p: PanelData, url: string, refazer: boolean) => {
        const f = p.imageFocus?.[url];
        return !f || (refazer && f.fonte === 'auto');
    };
    const contar = (refazer: boolean) => panels.reduce((n, p) => n + (p.images ?? []).filter((u) => precisa(p, u, refazer)).length, 0);
    const semFoco = useMemo(() => contar(false), [panels]); // eslint-disable-line react-hooks/exhaustive-deps
    const automaticas = useMemo(() => contar(true) - contar(false), [panels]); // eslint-disable-line react-hooks/exhaustive-deps
    const [focando, setFocando] = useState<{ feitas: number; total: number } | null>(null);
    const focarFotos = async (refazer: boolean) => {
        const { detectarFoco } = await import('@/lib/focoFoto');
        const total = contar(refazer);
        let feitas = 0, achadas = 0, falhas = 0;
        setFocando({ feitas, total });
        for (const panel of panels) {
            const faltam = (panel.images ?? []).filter((u) => precisa(panel, u, refazer));
            if (!faltam.length) continue;
            const focos = { ...(panel.imageFocus ?? {}) };
            let mudou = false;
            for (const url of faltam) {
                const antes = panel.imageFocus?.[url];
                const foco = await detectarFoco(url, antes?.pino).catch(() => null);
                if (foco) {
                    focos[url] = { ...foco, ...(antes?.corte ? { corte: antes.corte } : {}) };
                    achadas++;
                    mudou = true;
                }
                setFocando({ feitas: ++feitas, total });
            }
            if (!mudou) continue;
            try {
                // Só imageFocus: a API mantém as fotos quando "images" não vem
                await panelsService.updatePanel(panel.id, { imageFocus: focos });
                setPanels((prev) => prev.map((p) => (p.id === panel.id ? { ...p, imageFocus: focos } : p)));
            } catch {
                falhas++;
            }
        }
        setFocando(null);
        if (falhas) toast.error(`Foco salvo em parte: ${falhas} painel(is) não puderam ser atualizados.`);
        else toast.success(achadas ? `Foco ajustado em ${achadas} de ${total} foto(s). Confira no cadastro e clique na foto para corrigir.` : 'Nenhum telão reconhecido nas fotos. Marque o foco no cadastro de cada painel.');
    };

    const tabs: Filter[] = ['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'];

    return (
        <CrmPage
            eyebrow="Inventário"
            title="Painéis"
            description="Pontos da rede, situação de cada tela e o preço base mensal usado no site e nas propostas."
            actions={
                <>
                    {focando ? (
                        <button type="button" disabled className={crmBtn.secondary}>
                            <Crosshair className="h-4 w-4 animate-spin" aria-hidden="true" /> Analisando {focando.feitas} de {focando.total}…
                        </button>
                    ) : semFoco > 0 ? (
                        <button type="button" onClick={() => focarFotos(false)} className={crmBtn.secondary} title="Reconhece o telão, os veículos e as pessoas e centraliza o corte das fotos nos cards do site">
                            <Crosshair className="h-4 w-4" aria-hidden="true" /> Focar fotos ({semFoco})
                        </button>
                    ) : automaticas > 0 && (
                        <button type="button" onClick={() => focarFotos(true)} className={crmBtn.ghost} title="Analisa de novo as fotos com foco automático (mantém pinos, recortes e focos ajustados à mão)">
                            <Crosshair className="h-4 w-4" aria-hidden="true" /> Refazer foco automático ({automaticas})
                        </button>
                    )}
                    <Link to="/dashboard/paineis/novo" className={crmBtn.primary}><Plus className="h-4 w-4" aria-hidden="true" /> Novo painel</Link>
                </>
            }
        >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1 lg:max-w-md">
                    <label htmlFor="panel-search" className="sr-only">Buscar painéis</label>
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" aria-hidden="true" />
                    <input id="panel-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome, cidade ou endereço" className={`${crmInput} pl-10`} />
                </div>
                <div role="tablist" aria-label="Filtrar por situação" className="flex gap-px overflow-x-auto border border-brand-border bg-brand-border">
                    {tabs.filter((t) => t === 'ALL' || counts[t] > 0 || t === 'AVAILABLE').map((t) => (
                        <button key={t} role="tab" aria-selected={filter === t} onClick={() => setFilter(t)}
                            className={`flex shrink-0 items-center gap-2 px-3.5 py-2 text-sm ${filter === t ? 'bg-brand-surface text-brand-text' : 'bg-brand-background text-brand-muted hover:text-brand-text'}`}>
                            {t === 'ALL' ? 'Todos' : STATUS[t].label} <span className="font-mono text-xs text-brand-muted">{counts[t]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {status === 'loading' && <div className="flex flex-col gap-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>}
            {status === 'error' && <EmptyState title="Não foi possível carregar os painéis" action={<button type="button" onClick={load} className={crmBtn.secondary}>Tentar de novo</button>} />}
            {status === 'ready' && visible.length === 0 && (
                panels.length === 0
                    ? <EmptyState title="Nenhum painel cadastrado" text="Cadastre o primeiro ponto da rede para ele aparecer no site e no mapa." action={<Link to="/dashboard/paineis/novo" className={crmBtn.primary}><Plus className="h-4 w-4" aria-hidden="true" /> Novo painel</Link>} />
                    : <EmptyState title="Nenhum painel encontrado" text="Ajuste a busca ou o filtro." action={<button type="button" onClick={() => { setQuery(''); setFilter('ALL'); }} className={crmBtn.secondary}>Limpar filtros</button>} />
            )}

            {status === 'ready' && visible.length > 0 && (
                <div className="border border-brand-border bg-brand-surface">
                    <div className="hidden grid-cols-[2.4fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-brand-border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-brand-muted md:grid">
                        <span>Painel</span><span>Situação</span><span>Impactos/dia</span><span>Formato</span><span>Preço base</span><span className="w-[88px]" />
                    </div>
                    <ul className="divide-y divide-brand-border">
                        {visible.map((panel) => {
                            const s = STATUS[panel.status] ?? STATUS.MAINTENANCE;
                            const impacts = parseImpacts(panel.impacts);
                            return (
                                <li key={panel.id} className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 px-5 py-3.5 md:grid-cols-[2.4fr_1fr_1fr_1fr_1fr_auto]">
                                    <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
                                        <img src={thumb(panel.images?.[0], 160)} style={estiloFoco(panel.imageFocus, panel.images?.[0])} alt="" loading="lazy" className="h-12 w-16 shrink-0 bg-brand-background object-cover" />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-brand-text">{panel.name}</p>
                                            <p className="truncate text-xs text-brand-muted">{[panel.city, panel.state].filter(Boolean).join(' - ') || 'Sem cidade'}</p>
                                        </div>
                                    </div>
                                    <span><Badge tone={s.tone}>{s.label}</Badge></span>
                                    <span className="font-mono text-sm text-brand-text">{impacts ? formatImpacts(impacts) : '—'}</span>
                                    <span className="text-sm text-brand-muted">{[panel.size, panel.px, formatPlayback(panel.playbackSeconds)].filter(Boolean).join(' · ') || '—'}</span>
                                    <span className="font-mono text-sm text-brand-text">{Number(panel.price) > 0 ? formatBRL(Number(panel.price)) : '—'}</span>
                                    <div className="col-span-2 flex justify-end gap-1 md:col-span-1">
                                        <Link to={`/dashboard/paineis/editar/${panel.id}`} className={crmBtn.ghost} aria-label={`Editar ${panel.name}`}><Pencil className="h-4 w-4" strokeWidth={1.75} /> <span className="md:sr-only">Editar</span></Link>
                                        <button type="button" onClick={() => setToDelete(panel)} className={crmBtn.ghost} aria-label={`Excluir ${panel.name}`}><Trash2 className="h-4 w-4" strokeWidth={1.75} /> <span className="md:sr-only">Excluir</span></button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            <ConfirmSheet
                open={Boolean(toDelete)}
                title={`Excluir ${toDelete?.name ?? 'painel'}?`}
                text="O ponto sai do site, do mapa e das propostas. Prefira mudar para Manutenção se for algo temporário."
                busy={deleting}
                onConfirm={onDelete}
                onClose={() => setToDelete(null)}
            />
        </CrmPage>
    );
}
