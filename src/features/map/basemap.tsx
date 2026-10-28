import { TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './map-custom.css';

/*
 * Mapa base compartilhado (site, gestão e formulário de painel).
 *
 * Com chave de um provedor (VITE_MAP_TILES_DARK / VITE_MAP_TILES_LIGHT), usa um mapa
 * base desenhado para fundo escuro/claro, em alta resolução (@2x). Exemplo (Stadia Maps):
 *   VITE_MAP_TILES_DARK=https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=SUA_CHAVE
 *   VITE_MAP_TILES_LIGHT=https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=SUA_CHAVE
 *
 * Sem chave, cai no OpenStreetMap com um filtro escuro ajustado (melhor que o invert
 * puro de antes, que deixava o mapa lavado e com ruas ilegíveis).
 */

const env = import.meta.env as Record<string, string | undefined>;
const CUSTOM = { dark: env.VITE_MAP_TILES_DARK?.trim(), light: env.VITE_MAP_TILES_LIGHT?.trim() };
const CUSTOM_ATTRIBUTION = env.VITE_MAP_TILES_ATTRIBUTION?.trim()
    || '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function BaseTiles({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
    const custom = CUSTOM[theme];
    if (custom) {
        return <TileLayer key={`custom-${theme}`} url={custom} attribution={CUSTOM_ATTRIBUTION} maxZoom={20} keepBuffer={4} noWrap />;
    }
    return (
        <TileLayer
            key={`osm-${theme}`}
            url={OSM}
            attribution={OSM_ATTRIBUTION}
            maxZoom={19}
            keepBuffer={4}
            noWrap
            className={theme === 'dark' ? 't3-tiles-dark' : 't3-tiles-light'}
        />
    );
}
