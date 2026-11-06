import { MouseEvent, useRef, useState } from 'react';
import type { FocoFoto } from '@/lib/focoFoto';

/**
 * Miniatura de foto do painel no cadastro: mostra a foto inteira (sem corte), o ponto de foco
 * (marcador laranja) e o que o reconhecimento achou. Clicar na foto move o foco (ajuste manual).
 */
export function FotoComFoco({ src, alt, foco, analisando, onFoco }: {
    src: string;
    alt: string;
    foco: FocoFoto | null | undefined;
    analisando: boolean;
    onFoco: (foco: FocoFoto) => void;
}) {
    const img = useRef<HTMLImageElement>(null);
    const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

    /** Retângulo da foto dentro da caixa (object-fit: contain deixa faixas vazias). */
    const area = () => {
        const el = img.current;
        if (!el || !natural) return null;
        const box = el.getBoundingClientRect();
        const escala = Math.min(box.width / natural.w, box.height / natural.h);
        const w = natural.w * escala;
        const h = natural.h * escala;
        return { left: box.left + (box.width - w) / 2, top: box.top + (box.height - h) / 2, w, h, box };
    };

    const clicar = (e: MouseEvent<HTMLImageElement>) => {
        const a = area();
        if (!a) return;
        const x = ((e.clientX - a.left) / a.w) * 100;
        const y = ((e.clientY - a.top) / a.h) * 100;
        if (x < 0 || x > 100 || y < 0 || y > 100) return;
        onFoco({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, fonte: 'manual', objetos: foco?.objetos });
    };

    // Posição do marcador em % da caixa (convertendo da foto para a caixa)
    let marcador: { left: string; top: string } | null = null;
    const a = foco && natural ? area() : null;
    if (foco && a) {
        marcador = {
            left: `${((a.left - a.box.left + (foco.x / 100) * a.w) / a.box.width) * 100}%`,
            top: `${((a.top - a.box.top + (foco.y / 100) * a.h) / a.box.height) * 100}%`,
        };
    }

    const legenda = analisando ? 'Reconhecendo…'
        : foco?.fonte === 'manual' ? 'Foco ajustado à mão'
        : foco?.objetos?.length ? `Foco: ${foco.objetos.slice(0, 3).join(', ')}`
        : foco === null ? 'Nada reconhecido: clique para marcar' : '';

    return (
        <>
            <img
                ref={img}
                src={src}
                alt={alt}
                onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                onClick={clicar}
                title="Clique no telão para ajustar o foco do corte"
                className="h-full w-full cursor-crosshair bg-black object-contain"
            />
            {marcador && (
                <span aria-hidden="true" className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-neon/80 shadow-[0_0_0_3px_rgba(0,0,0,0.45)]" style={marcador} />
            )}
            {legenda && (
                <span className={`pointer-events-none absolute right-0 top-0 max-w-[75%] truncate px-2 py-0.5 text-[10px] font-medium ${analisando ? 'animate-pulse bg-black/70 text-white' : 'bg-black/70 text-white'}`}>{legenda}</span>
            )}
        </>
    );
}
