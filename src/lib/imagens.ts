import type { CSSProperties } from 'react';
/**
 * Miniaturas das fotos dos painéis pelo Supabase (Image Transformation): a foto original
 * (até ~700 KB em JPG) vira um WebP na largura pedida (~15 KB para 480 px). Só vale para
 * arquivos públicos do Storage do Supabase; qualquer outra URL volta como veio.
 */
const OBJECT_PUBLIC = '/storage/v1/object/public/';
const RENDER_PUBLIC = '/storage/v1/render/image/public/';
export const PLACEHOLDER = '/placeholder.svg';

const transformavel = (url: string) => /^https:\/\/[a-z0-9]+\.supabase\.co\//.test(url) && url.includes(OBJECT_PUBLIC);

/**
 * URL da foto com no máximo `largura` px de largura (proporção mantida). `resize=contain` é
 * obrigatório: só com `width`, o Supabase mantém a altura original e corta as laterais
 * (uma foto 1080x1280 virava uma tira 480x1280 do meio).
 */
export function thumb(url: string | null | undefined, largura: number, qualidade = 70): string {
    if (!url) return PLACEHOLDER;
    if (!transformavel(url)) return url;
    const [base] = url.split('?');
    return `${base.replace(OBJECT_PUBLIC, RENDER_PUBLIC)}?width=${Math.round(largura)}&resize=contain&quality=${qualidade}`;
}

/**
 * Atributos `src`/`srcSet` para uma foto exibida com `larguraCss` px de largura: 1x e 2x
 * (telas de celular). Use junto de `sizes` quando a largura varia com a tela.
 */
export function thumbProps(url: string | null | undefined, larguraCss: number) {
    if (!url || !transformavel(url)) return { src: url || PLACEHOLDER };
    return { src: thumb(url, larguraCss), srcSet: `${thumb(url, larguraCss)} 1x, ${thumb(url, larguraCss * 2)} 2x` };
}

/** Recorte da capa (retângulo em % da foto), desenhado no cadastro em "Enquadrar capa". */
export interface Corte { x: number; y: number; w: number; h: number }

/** Focos das fotos de um painel (url da foto → ponto de foco e recorte em %), gravados no cadastro. */
export type FocosFotos = Record<string, { x: number; y: number; corte?: Corte }> | null | undefined;

const r2 = (v: number) => Math.round(v * 100) / 100;

/**
 * Estilo do <img> (object-fit: cover) para enquadrar a foto.
 * - 'ponto' (padrão): só centraliza no foco, ou no centro do recorte. Serve para qualquer <img>.
 * - 'recorte': mostra o retângulo escolhido, com zoom (propriedades CSS scale/translate, que somam
 *   com o hover de escala dos cards). Só em <img> dentro de moldura com overflow-hidden.
 */
export function estiloFoco(focos: FocosFotos, url: string | undefined | null, modo: 'ponto' | 'recorte' = 'ponto'): CSSProperties | undefined {
    const f = url ? focos?.[url] : undefined;
    if (!f) return undefined;
    const c = f.corte;
    if (!c) return { objectPosition: `${f.x}% ${f.y}%` };
    const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    if (modo === 'ponto') return { objectPosition: `${r2(cx)}% ${r2(cy)}%` };
    // Zoom para o retângulo ocupar o card, sem deixar borda vazia ao levar o centro dele para o meio
    const s = Math.min(6, Math.max(1, 100 / Math.max(c.w, c.h), 50 / Math.max(1, Math.min(cx, 100 - cx)), 50 / Math.max(1, Math.min(cy, 100 - cy))));
    return {
        objectPosition: `${r2(cx)}% ${r2(cy)}%`,
        transformOrigin: 'center',
        scale: String(r2(s)),
        translate: `${r2(s * (50 - cx))}% ${r2(s * (50 - cy))}%`,
    };
}
