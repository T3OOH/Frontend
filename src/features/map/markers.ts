import L from 'leaflet';

/** Centro padrão: Goiânia. */
export const GOIANIA: [number, number] = [-16.6869, -49.2648];

/** Limita o mapa ao Brasil (com folga), para o usuário não se perder arrastando. */
export const BRAZIL_BOUNDS: L.LatLngBoundsLiteral = [[-36, -76], [8, -28]];

export type MarkerTone = 'brand' | 'light' | 'mid' | 'dim';
const TONES: Record<MarkerTone, string> = { brand: '#FF5E00', light: '#ECECEE', mid: '#B4B4B9', dim: '#6E6E73' };

/**
 * Pino da T3: placa quadrada com a logo e uma ponta que marca o local exato.
 * `tone` colore a borda (situação do painel ou "no orçamento"); `active` aumenta o pino
 * e engrossa a borda laranja (a placa segue preta para a logo aparecer). Quadrado para seguir os cantos retos da interface.
 */
export function brandMarker(tone: MarkerTone = 'brand', active = false) {
    const box = active ? 44 : 34;
    const tip = active ? 9 : 7;
    const color = TONES[tone];
    return L.divIcon({
        className: 't3-marker',
        html: `
            <div class="t3-pin${active ? ' t3-pin--active' : ''}" style="width:${box}px">
                <div class="t3-pin__plate" style="width:${box}px;height:${box}px;background:#0B0B0C;border-color:${active ? '#FF5E00' : color};border-width:${active ? 3 : 2}px">
                    <img src="/t3-marker.webp" alt="" draggable="false" />
                </div>
                <span class="t3-pin__tip" style="border-width:${tip}px ${tip}px 0;border-top-color:${active ? '#FF5E00' : color}"></span>
            </div>`,
        iconSize: [box, box + tip],
        // A ponta encosta exatamente na coordenada
        iconAnchor: [box / 2, box + tip],
        popupAnchor: [0, -(box + tip) - 2],
    });
}
