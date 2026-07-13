import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Maximize } from 'lucide-react';
import { useEffect } from 'react';

// 1. Criar o Hook de controle do mapa
function MapController({ selectedPanelId, panels }: { selectedPanelId: string | null, panels: any[] }) {
    const map = useMap();

    useEffect(() => {
        if (selectedPanelId) {
            const panel = panels.find(p => p.id === selectedPanelId);
            if (panel) {
                // Voa para o pino com um zoom mais próximo (16)
                map.flyTo([panel.lat, panel.lng], 16, {
                    duration: 1.5
                });
            }
        }
    }, [selectedPanelId, panels, map]);

    return null;
}

const createCustomIcon = () => {
    return L.divIcon({
        className: 'custom-marker',
        html: `
        <div style="background-color: #1C1C1E; border: 2px solid #FF5E00; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(255, 94, 0, 0.4); transition: transform 0.2s;">
            <div style="background-color: #FF5E00; width: 10px; height: 10px; border-radius: 50%;"></div>
        </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
    });
};

const neonMarker = createCustomIcon();

interface InteractiveMapProps {
    panels: any[];
    selectedPanelId?: string | null; // Adicionado aqui
}

export function InteractiveMap({ panels = [], selectedPanelId }: InteractiveMapProps) {
    const centerPosition: [number, number] = [-16.6869, -49.2648];

    const worldBounds: LatLngBoundsExpression = [
        [-90, -180],
        [90, 180]
    ];

    return (
        <div className="w-full h-full bg-brand-black relative z-0">
            <MapContainer
                center={centerPosition}
                zoom={13}
                minZoom={4}
                maxBounds={worldBounds}
                maxBoundsViscosity={1.0}
                scrollWheelZoom={true}
                className="w-full h-full outline-none"
                style={{ height: '100%', width: '100%', backgroundColor: '#000000' }}
                zoomControl={false}
            >
                <TileLayer
                    noWrap={true}
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* 2. Adicionar o Controller aqui dentro do MapContainer */}
                <MapController selectedPanelId={selectedPanelId || null} panels={panels} />

                {panels.map((panel) => (
                    <Marker
                        key={panel.id}
                        position={[panel.lat, panel.lng]}
                        icon={neonMarker}
                    >
                        <Popup className="premium-popup">
                            <div className="p-2 min-w-[200px]">
                                {panel.images && panel.images.length > 0 && (
                                    <div className="w-full h-24 mb-3 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                                        <img src={panel.images[0]} alt={panel.name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <h4 className="font-bold text-gray-900 text-sm mb-2 leading-tight">{panel.name}</h4>
                                <div className="flex flex-col gap-1.5 text-xs text-gray-600">
                                    <span className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${panel.status?.toLowerCase() === 'disponível' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className="font-medium">{panel.status || 'Disponível'}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Navigation className="w-3.5 h-3.5 text-brand-neon" />
                                        Impactos: <span className="font-medium">{panel.impacts}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5 border-t border-gray-200 pt-1.5 mt-0.5">
                                        <Maximize className="w-3.5 h-3.5 text-gray-400" />
                                        Tamanho: {panel.size} ({panel.px})
                                    </span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
            
        </div>
    );
}