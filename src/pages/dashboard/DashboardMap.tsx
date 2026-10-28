import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BaseTiles } from '@/features/map/basemap';
import { BRAZIL_BOUNDS, GOIANIA, MarkerTone, brandMarker } from '@/features/map/markers';
import { panelsService, PanelData, PanelStatus } from '@/services/panels.service';
import { useTheme } from '@/contexts/ThemeContext';
import { parseImpacts, formatImpacts } from '@/lib/impacts';
import { CrmPage, EmptyState, Skeleton, Stat } from '@/components/app/ui';
import { crmBtn } from '@/components/app/tokens';

const COLORS: Record<PanelStatus, string> = { AVAILABLE: '#FF5E00', OCCUPIED: '#ECECEE', RESERVED: '#B4B4B9', MAINTENANCE: '#6E6E73' };
const LABEL: Record<PanelStatus, string> = { AVAILABLE: 'Disponível', OCCUPIED: 'Ocupado', RESERVED: 'Reservado', MAINTENANCE: 'Manutenção' };

const TONE: Record<PanelStatus, MarkerTone> = { AVAILABLE: 'brand', OCCUPIED: 'light', RESERVED: 'mid', MAINTENANCE: 'dim' };
const icon = (status: PanelStatus, active: boolean) => brandMarker(TONE[status], active);

/** Enquadra todos os pontos ao carregar e voa até o painel escolhido na lista. */
function Camera({ panels, focus }: { panels: PanelData[]; focus: PanelData | null }) {
    const map = useMap();
    useEffect(() => {
        if (!panels.length) return;
        map.fitBounds(L.latLngBounds(panels.map((p) => [p.lat, p.lng] as [number, number])), { padding: [40, 40], maxZoom: 14 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [panels.length]);
    useEffect(() => { if (focus) map.flyTo([focus.lat, focus.lng], 16, { duration: 0.6 }); }, [focus, map]);
    return null;
}

export function DashboardMap() {
    const { theme } = useTheme();
    const [panels, setPanels] = useState<PanelData[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [hidden, setHidden] = useState<Set<PanelStatus>>(new Set());
    const [focusId, setFocusId] = useState<string | null>(null);

    const load = async () => {
        try {
            setStatus('loading');
            // Todos os painéis (o endpoint de marcadores do site só traz os disponíveis)
            const all = await panelsService.getAllPanels();
            setPanels(all.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)));
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => { load(); }, []);

    const shown = useMemo(() => panels.filter((p) => !hidden.has(p.status)), [panels, hidden]);
    const count = (s: PanelStatus) => panels.filter((p) => p.status === s).length;
    const impacts = panels.filter((p) => p.status === 'AVAILABLE').reduce((sum, p) => sum + parseImpacts(p.impacts), 0);
    const cities = new Set(panels.map((p) => p.city).filter(Boolean)).size;
    const focus = panels.find((p) => p.id === focusId) ?? null;

    const toggle = (s: PanelStatus) => setHidden((prev) => { const next = new Set(prev); if (next.has(s)) next.delete(s); else next.add(s); return next; });

    return (
        <CrmPage wide eyebrow="Inventário" title="Mapa da rede" description="Todos os pontos, de qualquer situação. Clique na lista para ir até o painel.">
            <div className="grid grid-cols-2 gap-px border border-brand-border bg-brand-border lg:grid-cols-4 [&>*]:border-0">
                <Stat label="Painéis" value={panels.length} hint={`${cities} ${cities === 1 ? 'cidade' : 'cidades'}`} />
                <Stat label="Disponíveis" value={count('AVAILABLE')} accent />
                <Stat label="Ocupados ou reservados" value={count('OCCUPIED') + count('RESERVED')} />
                <Stat label="Impactos/dia disponíveis" value={impacts ? formatImpacts(impacts) : '—'} />
            </div>

            {status === 'error' && <EmptyState title="Não foi possível carregar o mapa" action={<button type="button" onClick={load} className={crmBtn.secondary}>Tentar de novo</button>} />}

            {status !== 'error' && (
                <div className="grid grid-cols-1 gap-px border border-brand-border bg-brand-border lg:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="flex max-h-[640px] flex-col bg-brand-surface">
                        <div className="flex flex-wrap gap-2 border-b border-brand-border p-3">
                            {(Object.keys(LABEL) as PanelStatus[]).map((s) => (
                                <button key={s} type="button" onClick={() => toggle(s)} aria-pressed={!hidden.has(s)}
                                    className={`flex min-h-[40px] items-center gap-2 border px-2.5 py-1 text-xs md:min-h-0 ${hidden.has(s) ? 'border-brand-border text-brand-muted line-through' : 'border-brand-border text-brand-text'}`}>
                                    <span className="h-2.5 w-2.5" style={{ background: COLORS[s] }} aria-hidden="true" /> {LABEL[s]} <span className="font-mono text-brand-muted">{count(s)}</span>
                                </button>
                            ))}
                        </div>
                        {status === 'loading' ? (
                            <div className="flex flex-col gap-2 p-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
                        ) : (
                            <ul className="custom-scrollbar flex-1 divide-y divide-brand-border overflow-y-auto">
                                {shown.map((p) => (
                                    <li key={p.id}>
                                        <button type="button" onClick={() => setFocusId(p.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-background ${focusId === p.id ? 'bg-brand-background' : ''}`}>
                                            <span className="h-2.5 w-2.5 shrink-0" style={{ background: COLORS[p.status] }} aria-hidden="true" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm text-brand-text">{p.name}</span>
                                                <span className="block truncate text-xs text-brand-muted">{LABEL[p.status]} · {[p.city, p.state].filter(Boolean).join(' - ')}</span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                                {shown.length === 0 && <li className="p-4 text-sm text-brand-muted">Nenhum painel com esses filtros.</li>}
                            </ul>
                        )}
                    </aside>

                    <div className={`relative h-[480px] bg-brand-background lg:h-[640px]`}>
                        {status === 'loading' ? <Skeleton className="absolute inset-0" /> : (
                            <MapContainer center={GOIANIA} zoom={12} minZoom={4} maxBounds={BRAZIL_BOUNDS} className="absolute inset-0 z-0">
                                <BaseTiles theme={theme} />
                                <Camera panels={panels} focus={focus} />
                                {shown.map((p) => (
                                    <Marker key={p.id} position={[p.lat, p.lng]} icon={icon(p.status, p.id === focusId)} eventHandlers={{ click: () => setFocusId(p.id) }}>
                                        <Popup>
                                            <strong>{p.name}</strong><br />
                                            {LABEL[p.status]} · {p.impacts || 'sem impactos'}<br />
                                            <Link to={`/dashboard/paineis/editar/${p.id}`}>Editar painel</Link>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        )}
                    </div>
                </div>
            )}
        </CrmPage>
    );
}
