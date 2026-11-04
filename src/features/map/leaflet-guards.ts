import L from 'leaflet';

/**
 * Corrige um erro do Leaflet 1.9 ("Cannot read properties of undefined (reading '_leaflet_pos')").
 *
 * Toda animação de zoom (flyTo, fitBounds, setView animado, pinça no celular) agenda o fim dela
 * com um setTimeout de 250 ms que o `map.remove()` não cancela. Se o mapa sai da tela nesse
 * intervalo (troca de página, modal ou aba fechada), o fim chega com o mapa já destruído e quebra.
 * Aqui o fim atrasado é ignorado quando o mapa não existe mais.
 */
type MapInternals = L.Map & { _mapPane?: HTMLElement; _onZoomTransitionEnd: () => void; _guarded?: boolean };

const proto = L.Map.prototype as unknown as MapInternals;

if (!proto._guarded) {
    const onZoomTransitionEnd = proto._onZoomTransitionEnd;
    proto._onZoomTransitionEnd = function (this: MapInternals) {
        if (!this._mapPane) return;
        onZoomTransitionEnd.call(this);
    };
    proto._guarded = true;
}
