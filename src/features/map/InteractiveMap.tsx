import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map-custom.css'; // 👇 SEU NOVO ARQUIVO DE ESTILOS AQUI
import { Activity, Maximize } from 'lucide-react';


interface Panel {
    id: string;
    name: string;
    lat: number;
    lng: number;
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

const defaultCenter: [number, number] = [-16.6869, -49.2648];

const worldBounds: L.LatLngBoundsLiteral = [
    [-90, -180],
    [90, 180]
];

// Ícone do Mapa com Glow Neon
const customMarker = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="background-color: #0f0f11; border: 2px solid #FF5E00; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(255, 94, 0, 0.6); overflow: hidden;">
          <img src="/t3d 2.png" alt="T3" style="width: 22px; height: 22px; object-fit: contain;" />
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18], // Metade do tamanho para centralizar a âncora do mapa
});

// Ícone do Mapa para o painel SELECIONADO (Glow Maior)
const selectedMarker = L.divIcon({
    className: 'custom-marker-selected',
    html: `
      <div style="background-color: #0f0f11; border: 3px solid #FFFFFF; border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(255, 94, 0, 1); z-index: 1000;">
          <img src="/t3d 2.png" alt="T3" style="width: 28px; height: 28px; object-fit: contain;" />
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
});

function MapController({ selectedPanelId, panels }: { selectedPanelId?: string | null, panels: Panel[] }) {
    const map = useMap();

    useEffect(() => {
        if (selectedPanelId) {
            const panel = panels.find(p => p.id === selectedPanelId);
            if (panel && panel.lat && panel.lng) {
                // Animação suave para o pino clicado
                map.flyTo([panel.lat, panel.lng], 16, { duration: 1.2, easeLinearity: 0.25 });
            }
        }
    }, [selectedPanelId, panels, map]);

    return null;
}

export function InteractiveMap({ panels, selectedPanelId }: InteractiveMapProps) {

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return { text: 'Disponível', dot: 'bg-[#25D366]', color: 'text-[#25D366]' };
            case 'OCCUPIED':
                return { text: 'Ocupado', dot: 'bg-red-500', color: 'text-red-500' };
            case 'MAINTENANCE':
                return { text: 'Manutenção', dot: 'bg-yellow-500', color: 'text-yellow-500' };
            default:
                return { text: 'Desconhecido', dot: 'bg-gray-500', color: 'text-gray-500' };
        }
    };

    const defaultCenter: [number, number] = [-16.6869, -49.2648];

    return (
        <MapContainer
            center={defaultCenter}
            zoom={13}
            minZoom={3} // Impede o usuário de tirar o zoom excessivamente
            maxBounds={worldBounds} // Trava a navegação nos limites do mapa
            maxBoundsViscosity={1.0} // Cria o efeito de "parede invisível" elástica
            className="w-full h-full outline-none z-0"
            zoomControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            />

            <MapController selectedPanelId={selectedPanelId} panels={panels} />

            {panels.map((panel) => {
                const statusInfo = getStatusDisplay(panel.status);
                const isSelected = panel.id === selectedPanelId;

                return (
                    <Marker
                        key={panel.id}
                        position={[panel.lat, panel.lng]}
                        // O pino muda se for o painel clicado na lista lateral!
                        icon={isSelected ? selectedMarker : customMarker}
                        zIndexOffset={isSelected ? 1000 : 0}
                    >
                        <Popup className="custom-popup" closeButton={true}>
                            <div className="flex flex-col relative w-[260px]">

                                {/* Gradiente escuro sobre a foto pra não atrapalhar o X nativo */}
                                <div className="relative h-32 w-full">
                                    <img
                                        src={panel.images?.[0] || '/placeholder.jpg'}
                                        alt={panel.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f11] via-transparent to-[#0f0f11]/60" />
                                </div>

                                <div className="px-5 pb-5 pt-2 flex flex-col gap-3">
                                    {/* Título e Status */}
                                    <div>
                                        <h3 className="font-extrabold text-white text-base leading-tight mb-2 drop-shadow-md">
                                            {panel.name}
                                        </h3>
                                        <div className="flex items-center gap-2 bg-brand-surface/50 border border-brand-border/30 px-2.5 py-1.5 rounded-lg w-fit">
                                            <span className={`w-2 h-2 rounded-full ${statusInfo.dot} shadow-[0_0_8px_currentColor] animate-pulse`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${statusInfo.color}`}>
                                                {statusInfo.text}
                                            </span>
                                        </div>
                                    </div>

                                    <hr className="border-brand-border/30" />

                                    {/* Grid de Informações Rápidas */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-brand-muted uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                                <Activity className="w-3 h-3 text-brand-neon" />
                                                Impacto/dia
                                            </span>
                                            <span className="text-sm font-bold text-white">{panel.impacts}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-brand-muted uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                                <Maximize className="w-3 h-3 text-brand-neon" />
                                                Formato
                                            </span>
                                            <span className="text-sm font-bold text-white">{panel.size}</span>
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