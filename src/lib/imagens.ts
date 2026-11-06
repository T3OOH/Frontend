/**
 * Miniaturas das fotos dos painéis pelo Supabase (Image Transformation): a foto original
 * (até ~700 KB em JPG) vira um WebP na largura pedida (~15 KB para 480 px). Só vale para
 * arquivos públicos do Storage do Supabase; qualquer outra URL volta como veio.
 */
const OBJECT_PUBLIC = '/storage/v1/object/public/';
const RENDER_PUBLIC = '/storage/v1/render/image/public/';
export const PLACEHOLDER = '/placeholder.svg';

const transformavel = (url: string) => /^https:\/\/[a-z0-9]+\.supabase\.co\//.test(url) && url.includes(OBJECT_PUBLIC);

/** URL da foto com no máximo `largura` px de largura (proporção mantida). */
export function thumb(url: string | null | undefined, largura: number, qualidade = 70): string {
    if (!url) return PLACEHOLDER;
    if (!transformavel(url)) return url;
    const [base] = url.split('?');
    return `${base.replace(OBJECT_PUBLIC, RENDER_PUBLIC)}?width=${Math.round(largura)}&quality=${qualidade}`;
}

/**
 * Atributos `src`/`srcSet` para uma foto exibida com `larguraCss` px de largura: 1x e 2x
 * (telas de celular). Use junto de `sizes` quando a largura varia com a tela.
 */
export function thumbProps(url: string | null | undefined, larguraCss: number) {
    if (!url || !transformavel(url)) return { src: url || PLACEHOLDER };
    return { src: thumb(url, larguraCss), srcSet: `${thumb(url, larguraCss)} 1x, ${thumb(url, larguraCss * 2)} 2x` };
}
