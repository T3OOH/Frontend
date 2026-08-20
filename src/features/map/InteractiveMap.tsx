import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map-custom.css'; 
import { Activity, Maximize } from 'lucide-react';

interface Panel {
    id: string;
    name: string;
    lat: number | string;
    lng: number | string;
    status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
    impacts: string;
    size: string;
    px: string;
    images?: string[];
}

interface InteractiveMapProps {
    panels: Panel[];
    selectedPanelId?: string | null;
}

const worldBounds: L.LatLngBoundsLiteral = [
    [-90, -180],
    [90, 180]
];

// Ícone do Mapa Padrão
const customMarker = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="background-color: rgba(17, 17, 19, 0.9); backdrop-filter: blur(4px); border: 2px solid rgba(255, 94, 0, 0.4); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 94, 0, 0.2); overflow: hidden; transition: all 0.3s ease;">
          <img src="/t3d 2.png" alt="T3" style="width: 20px; height: 20px; object-fit: contain; opacity: 0.9;" />
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
});

// Ícone do Mapa para o painel SELECIONADO
const selectedMarker = L.divIcon({
    className: 'custom-marker-selected',
    html: `
      <div style="background-color: #111113; border: 2px solid #FF5E00; border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(255, 94, 0, 0.6), inset 0 0 10px rgba(255, 94, 0, 0.2); z-index: 1000;">
          <img src="/t3d 2.png" alt="T3" style="width: 26px; height: 26px; object-fit: contain;" />
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
});

// Filtro blindado anti-NaN
const parseSafeCoord = (value: any, fallback: number): number => {
    if (value === null || value === undefined || value === '') return fallback;
    const parsed = parseFloat(String(value).replace(',', '.'));
    if (isNaN(parsed) || parsed === 0) return fallback; 
    return parsed;
};

// Componente que dá o Zoom e Centraliza no Ponto
function MapController({ selectedPanelId, panels }: { selectedPanelId?: string | null, panels: Panel[] }) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 400); 
        return () => clearTimeout(timer);
    }, [map, selectedPanelId]);

    useEffect(() => {
        if (!selectedPanelId || !map) return;

        const panel = panels.find(p => p.id === selectedPanelId);
        if (!panel) return;

        const safeLat = parseSafeCoord(panel.lat, -16.6868911); 
        const safeLng = parseSafeCoord(panel.lng, -49.2647943);

        const timer = setTimeout(() => {
            map.flyTo([safeLat, safeLng], 16, { 
                animate: true, 
                duration: 1.3,
                easeLinearity: 0.25 
            });
        }, 50);

        return () => clearTimeout(timer);
    }, [selectedPanelId, panels, map]);

    return null;
}

export function InteractiveMap({ panels, selectedPanelId }: InteractiveMapProps) {
    const markerRefs = useRef<Record<string, L.Marker | null>>({});

    // Abre o popup do Leaflet (Imagem 2) automaticamente
    useEffect(() => {
        if (selectedPanelId && markerRefs.current[selectedPanelId]) {
            const marker = markerRefs.current[selectedPanelId];
            if (marker && !marker.isPopupOpen()) {
                marker.openPopup();
            }
        }
    }, [selectedPanelId]);

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return { text: 'Disponível', dot: 'bg-[#25D366]', color: 'text-[#25D366]' };
            case 'OCCUPIED':
                return { text: 'Ocupado', dot: 'bg-red-500', color: 'text-red-500' };
            case 'MAINTENANCE':
                return { text: 'Manutenção', dot: 'bg-yellow-500', color: 'text-yellow-500' };
            default:
                return { text: 'Desconhecido', dot: 'bg-brand-muted', color: 'text-brand-muted' };
        }
    };

    const defaultCenter: [number, number] = [-16.6869, -49.2648];

    return (
        <MapContainer
            center={defaultCenter}
            zoom={13}
            minZoom={3} 
            maxBounds={worldBounds} 
            maxBoundsViscosity={1.0} 
            className="w-full h-full outline-none z-0"
            zoomControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            />

            <MapController selectedPanelId={selectedPanelId} panels={panels} />

            {panels.map((panel) => {
                const safeLat = parseSafeCoord(panel.lat, -16.6868911);
                const safeLng = parseSafeCoord(panel.lng, -49.2647943);

                const statusInfo = getStatusDisplay(panel.status);
                const isSelected = panel.id === selectedPanelId;

                return (
                    <Marker
                        key={panel.id}
                        position={[safeLat, safeLng]}
                        icon={isSelected ? selectedMarker : customMarker}
                        zIndexOffset={isSelected ? 1000 : 0}
                        ref={(r) => {
                            // Salva a referência deste pino
                            if (r) markerRefs.current[panel.id] = r;
                        }}
                    >
                        <Popup className="custom-popup" closeButton={true}>
                            <div className="flex flex-col relative w-full">

                                <div className="relative h-36 w-full shrink-0">
                                    <img
                                        src={panel.images?.[0] || '/placeholder.jpg'}
                                        alt={panel.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-[#111113]/40 to-transparent" />
                                </div>

                                <div className="px-5 pb-5 pt-0 flex flex-col gap-3 relative z-10 -mt-6">
                                    <div>
                                        <h3 className="font-extrabold text-white text-base leading-tight mb-2 drop-shadow-md pr-6">
                                            {panel.name}
                                        </h3>
                                        <div className="flex items-center gap-2 bg-[#0A0A0B]/80 border border-white/5 px-2.5 py-1.5 rounded-lg w-fit backdrop-blur-sm">
                                            <span className={`w-2 h-2 rounded-full ${statusInfo.dot} shadow-[0_0_8px_currentColor] animate-pulse`} />
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${statusInfo.color}`}>
                                                {statusInfo.text}
                                            </span>
                                        </div>
                                    </div>

                                    <hr className="border-white/5" />

                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-brand-muted uppercase tracking-widest mb-0.5 flex items-center gap-1 font-bold">
                                                <Activity className="w-3 h-3 text-[#FF5E00]" />
                                                Impacto/dia
                                            </span>
                                            <span className="text-sm font-black text-white">{panel.impacts || '0'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-brand-muted uppercase tracking-widest mb-0.5 flex items-center gap-1 font-bold">
                                                <Maximize className="w-3 h-3 text-[#FF5E00]" />
                                                Formato
                                            </span>
                                            <span className="text-sm font-black text-white">{panel.size || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}