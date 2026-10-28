import L from 'leaflet';

/** Centro padrão: Goiânia. */
export const GOIANIA: [number, number] = [-16.6869, -49.2648];

/** Limita o mapa ao Brasil (com folga), para o usuário não se perder arrastando. */
export const BRAZIL_BOUNDS: L.LatLngBoundsLiteral = [[-36, -76], [8, -28]];

export type MarkerTone = 'brand' | 'light' | 'mid' | 'dim';
const TONES: Record<MarkerTone, string> = { brand: '#FF5E00', light: '#ECECEE', mid: '#B4B4B9', dim: '#6E6E73' };

/**
 * Marcador quadrado da marca. `active` aumenta o marcador e mostra o anel externo.
 * Quadrado (não alfinete redondo) para seguir os cantos retos da interface.
 */
export function brandMarker(tone: MarkerTone = 'brand', active = false) {
    const size = active ? 22 : 14;
    const color = TONES[tone];
    return L.divIcon({
        className: 't3-marker',
        html: `<span style="display:block;width:${size}px;height:${size}px;background:${color};border:2px solid #0B0B0C;box-shadow:0 0 0 ${active ? 4 : 1}px ${active ? 'rgba(255,94,0,0.35)' : color};"></span>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2 - 4],
    });
}
