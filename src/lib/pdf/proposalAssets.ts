import type { CalculatedPanel } from '@/components/crm/ProposalDocument';
import { pdfImage, pdfImages, registerPdfFonts } from '@/lib/pdf/assets';

/** Imagens já convertidas para o PDF (data URL); null = foto que não carregou. */
export interface ProposalAssets {
    logo: string | null;
    photos: Record<string, (string | null)[]>;
}

/**
 * Baixa e converte o logo (versão preta, o PDF é branco) e só a foto de capa de cada painel,
 * em tamanho pequeno: o PDF é feito para imprimir e a foto aparece em miniatura.
 */
export async function loadProposalAssets(panels: CalculatedPanel[]): Promise<ProposalAssets> {
    registerPdfFonts();
    const lists = panels.map((p) => (p.images ?? []).filter(Boolean).slice(0, 1));
    const [logo, converted] = await Promise.all([
        pdfImage('/t3-logo-black.png', { maxSize: 160, type: 'image/png' }),
        pdfImages(lists.flat(), { maxSize: 600 }),
    ]);
    const photos: Record<string, (string | null)[]> = {};
    let k = 0;
    panels.forEach((p, i) => {
        photos[p.id] = converted.slice(k, k + lists[i].length);
        k += lists[i].length;
    });
    return { logo, photos };
}

/** Quantas fotos não carregaram (para avisar quem gera a proposta). */
export const missingPhotos = (assets: ProposalAssets) => Object.values(assets.photos).flat().filter((x) => !x).length;
