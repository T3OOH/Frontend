import { Font } from '@react-pdf/renderer';

/*
 * Recursos dos PDFs gerados no navegador com @react-pdf/renderer.
 *
 * Fotos: o react-pdf só lê JPG e PNG. Parte das fotos dos painéis está em WebP e vinha
 * em branco no PDF. Aqui cada imagem é baixada (o Supabase libera CORS), decodificada
 * pelo próprio navegador (lê WebP, JPG, PNG, AVIF) e regravada em JPG reduzido, o que
 * também deixa o arquivo leve para mandar pelo WhatsApp.
 */

let fontsReady = false;

/** Registra a Geist (fonte do site) uma vez. Arquivos em public/fonts/pdf (licença OFL). */
export function registerPdfFonts() {
    if (fontsReady) return;
    Font.register({
        family: 'Geist',
        fonts: [
            { src: '/fonts/pdf/Geist-Regular.ttf', fontWeight: 400 },
            { src: '/fonts/pdf/Geist-Medium.ttf', fontWeight: 500 },
            { src: '/fonts/pdf/Geist-SemiBold.ttf', fontWeight: 600 },
            { src: '/fonts/pdf/Geist-Bold.ttf', fontWeight: 700 },
        ],
    });
    Font.register({
        family: 'GeistMono',
        fonts: [
            { src: '/fonts/pdf/GeistMono-Regular.ttf', fontWeight: 400 },
            { src: '/fonts/pdf/GeistMono-Medium.ttf', fontWeight: 500 },
        ],
    });
    // Sem hifenização automática (ela quebra palavras em português de forma estranha)
    Font.registerHyphenationCallback((word) => [word]);
    fontsReady = true;
}

interface ImageOptions {
    /** Maior lado, em pixels, depois de reduzir. */
    maxSize?: number;
    type?: 'image/jpeg' | 'image/png';
    quality?: number;
}

const cache = new Map<string, Promise<string | null>>();

async function decode(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
    if (typeof createImageBitmap === 'function') {
        try {
            return await createImageBitmap(blob);
        } catch {
            // Alguns navegadores não decodificam certos formatos por aqui: tenta pela <img>
        }
    }
    const url = URL.createObjectURL(blob);
    try {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
        await img.decode();
        return img;
    } finally {
        URL.revokeObjectURL(url);
    }
}

async function fetchImage(url: string): Promise<Blob> {
    // A 2ª tentativa ignora o cache: uma cópia guardada de uma <img> sem CORS faria o fetch falhar
    for (const cacheMode of ['default', 'reload'] as RequestCache[]) {
        try {
            const res = await fetch(url, { mode: 'cors', cache: cacheMode });
            if (res.ok) return await res.blob();
        } catch {
            /* tenta de novo */
        }
    }
    throw new Error(`Imagem indisponível: ${url}`);
}

async function convert(url: string, { maxSize = 1600, type = 'image/jpeg', quality = 0.86 }: ImageOptions): Promise<string | null> {
    try {
        const source = await decode(await fetchImage(url));
        const width = 'naturalWidth' in source ? source.naturalWidth : source.width;
        const height = 'naturalHeight' in source ? source.naturalHeight : source.height;
        if (!width || !height) return null;
        const scale = Math.min(1, maxSize / Math.max(width, height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        if (type === 'image/jpeg') {
            // JPG não tem transparência: fundo da superfície do PDF
            ctx.fillStyle = '#111113';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        if ('close' in source) source.close();
        return canvas.toDataURL(type, quality);
    } catch {
        return null;
    }
}

/** Imagem pronta para o PDF (data URL JPG/PNG) ou null se não deu para carregar. */
export function pdfImage(url: string, options: ImageOptions = {}): Promise<string | null> {
    const key = `${url}|${options.maxSize ?? ''}|${options.type ?? ''}`;
    let pending = cache.get(key);
    if (!pending) {
        pending = convert(url, options);
        cache.set(key, pending);
        // Falha não fica no cache: a próxima geração tenta de novo
        pending.then((r) => { if (!r) cache.delete(key); });
    }
    return pending;
}

/** Converte várias imagens com no máximo `limit` downloads ao mesmo tempo, mantendo a ordem. */
export async function pdfImages(urls: string[], options: ImageOptions = {}, limit = 4): Promise<(string | null)[]> {
    const out: (string | null)[] = new Array(urls.length).fill(null);
    let next = 0;
    const worker = async () => {
        while (next < urls.length) {
            const i = next++;
            out[i] = await pdfImage(urls[i], options);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, urls.length) }, worker));
    return out;
}
