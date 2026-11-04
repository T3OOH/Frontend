import type { CalculatedPanel } from '@/components/crm/ProposalDocument';
import { pdfImage, pdfImages, registerPdfFonts } from '@/lib/pdf/assets';

/** Imagens já convertidas para o PDF (data URL); null = foto que não carregou. */
export interface ProposalAssets {
    logo: string | null;
    photos: Record<string, (string | null)[]>;
}

/** Baixa e converte o logo e TODAS as fotos dos painéis antes de montar o PDF. */
export async function loadProposalAssets(panels: CalculatedPanel[]): Promise<ProposalAssets> {
    registerPdfFonts();
    const lists = panels.map((p) => (p.images ?? []).filter(Boolean));
    const [logo, converted] = await Promise.all([
        pdfImage('/t3-logo.webp', { maxSize: 160, type: 'image/png' }),
        pdfImages(lists.flat(), { maxSize: 1600 }),
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
