import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BaseTiles } from './basemap';
import { BRAZIL_BOUNDS, GOIANIA, brandMarker } from './markers';
import { parseImpacts, formatImpacts } from '@/lib/impacts';

export interface MapPanel {
    id: string;
    name: string;
    lat: number | string;
    lng: number | string;
    city?: string | null;
    state?: string | null;
    impacts?: string;
    size?: string;
    price?: number | string | null;
    images?: string[];
}

interface InteractiveMapProps {
    panels: MapPanel[];
    selectedPanelId?: string | null;
    onSelect?: (id: string) => void;
    /** Botão do popup: adiciona ou remove do orçamento. */
    onToggle?: (panel: MapPanel) => void;
    isInCart?: (id: string) => boolean;
    /** Preço mensal mostrado no popup (o site exibe o valor do plano anual). */
    priceLabel?: (panel: MapPanel) => string;
}

const toCoord = (value: number | string) => {
    const n = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
    return Number.isFinite(n) && n !== 0 ? n : null;
};

/** Enquadra os pontos na primeira carga e acompanha o painel selecionado. */
function Camera({ panels, selectedId }: { panels: MapPanel[]; selectedId?: string | null }) {
    const map = useMap();
    const framed = useRef(false);

    useEffect(() => {
        const t = setTimeout(() => map.invalidateSize(), 300);
        return () => clearTimeout(t);
    }, [map]);

    useEffect(() => {
        if (framed.current || panels.length === 0) return;
        const points = panels.map((p) => [toCoord(p.lat), toCoord(p.lng)]).filter((c): c is [number, number] => c[0] !== null && c[1] !== null);
        if (points.length) {
            map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 14 });
            framed.current = true;
        }
    }, [panels, map]);

    useEffect(() => {
        const panel = panels.find((p) => p.id === selectedId);
        const lat = panel && toCoord(panel.lat);
        const lng = panel && toCoord(panel.lng);
        if (lat && lng) map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.8 });
    }, [selectedId, panels, map]);

    return null;
}

export function InteractiveMap({ panels, selectedPanelId, onSelect, onToggle, isInCart, priceLabel }: InteractiveMapProps) {
    const markers = useRef<Record<string, L.Marker | null>>({});

    useEffect(() => {
        if (!selectedPanelId) return;
        const t = setTimeout(() => markers.current[selectedPanelId]?.openPopup(), 850);
        return () => clearTimeout(t);
    }, [selectedPanelId]);

    return (
        <MapContainer center={GOIANIA} zoom={13} minZoom={4} maxBounds={BRAZIL_BOUNDS} maxBoundsViscosity={0.8} zoomControl={false} className="h-full w-full outline-none">
            <BaseTiles theme="dark" />
            <ZoomControl position="bottomright" />
            <Camera panels={panels} selectedId={selectedPanelId} />

            {panels.map((panel) => {
                const lat = toCoord(panel.lat);
                const lng = toCoord(panel.lng);
                if (lat === null || lng === null) return null;
                const active = panel.id === selectedPanelId;
                const inCart = isInCart?.(panel.id) ?? false;
                const impacts = parseImpacts(panel.impacts);

                return (
                    <Marker
                        key={panel.id}
                        position={[lat, lng]}
                        icon={brandMarker(inCart ? 'light' : 'brand', active)}
                        zIndexOffset={active ? 1000 : inCart ? 500 : 0}
                        eventHandlers={{ click: () => onSelect?.(panel.id) }}
                        ref={(r) => { markers.current[panel.id] = r; }}
                        title={panel.name}
                        alt={panel.name}
                    >
                        <Popup closeButton>
                            <div className="flex flex-col">
                                <div className="aspect-[16/9] w-full bg-ink-850">
                                    <img src={panel.images?.[0] || '/placeholder.svg'} alt="" className="h-full w-full object-cover" />
                                </div>
                                <div className="flex flex-col gap-3 p-4">
                                    <div>
                                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">{[panel.city, panel.state].filter(Boolean).join(' · ') || 'Goiânia · GO'}</p>
                                        <p className="mt-1 text-[15px] font-medium leading-snug text-ink-100">{panel.name}</p>
                                    </div>
                                    <dl className="grid grid-cols-2 gap-3 border-t border-white/10 pt-3 font-mono text-xs">
                                        <div><dt className="text-ink-500">Impactos/dia</dt><dd className="mt-0.5 text-ink-100">{impacts ? formatImpacts(impacts) : '—'}</dd></div>
                                        <div><dt className="text-ink-500">Formato</dt><dd className="mt-0.5 truncate text-ink-100">{panel.size || '—'}</dd></div>
                                    </dl>
                                    {priceLabel && <p className="font-mono text-sm text-brand-neon">{priceLabel(panel)}</p>}
                                    {onToggle && (
                                        <button
                                            type="button"
                                            onClick={() => onToggle(panel)}
                                            className={`w-full px-4 py-2.5 text-sm font-semibold transition-colors ${inCart ? 'border border-white/25 text-ink-100 hover:border-white/60' : 'bg-brand-neon text-ink-950 hover:bg-brand-neonHover'}`}
                                        >
                                            {inCart ? 'No orçamento · remover' : 'Adicionar ao orçamento'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
