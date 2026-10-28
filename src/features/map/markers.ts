import L from 'leaflet';

/** Centro padrão: Goiânia. */
export const GOIANIA: [number, number] = [-16.6869, -49.2648];

/** Limita o mapa ao Brasil (com folga), para o usuário não se perder arrastando. */
export const BRAZIL_BOUNDS: L.LatLngBoundsLiteral = [[-36, -76], [8, -28]];

export type MarkerTone = 'brand' | 'light' | 'mid' | 'dim';
const TONES: Record<MarkerTone, string> = { brand: '#FF5E00', light: '#ECECEE', mid: '#B4B4B9', dim: '#6E6E73' };

/**
 * Pino da T3: o próprio logo "t3" em 3D, grande, com um ponto embaixo marcando o local exato.
 * - `tone`: cor do ponto (situação do painel). Fora de "brand", o logo fica em cinza.
 * - `active`: painel selecionado; logo maior e anel laranja pulsando no ponto.
 * - `badge`: selo de "no orçamento".
 */
export function brandMarker(tone: MarkerTone = 'brand', active = false, badge = false) {
    const logo = active ? 58 : 44;
    const dot = active ? 12 : 10;
    const height = logo + dot + 2;
    const color = TONES[tone];
    const muted = tone === 'mid' || tone === 'dim';
    return L.divIcon({
        className: 't3-marker',
        html: `
            <div class="t3-pin${active ? ' t3-pin--active' : ''}${muted ? ' t3-pin--muted' : ''}" style="width:${logo}px;height:${height}px">
                <img class="t3-pin__logo" src="/t3-marker.webp" alt="" draggable="false" style="width:${logo}px;height:${logo}px" />
                ${badge ? '<span class="t3-pin__badge" aria-hidden="true">✓</span>' : ''}
                <span class="t3-pin__dot" style="width:${dot}px;height:${dot}px;background:${color}"></span>
            </div>`,
        iconSize: [logo, height],
        // O centro do ponto encosta exatamente na coordenada
        iconAnchor: [logo / 2, height - dot / 2],
        popupAnchor: [0, -height + 4],
    });
}
