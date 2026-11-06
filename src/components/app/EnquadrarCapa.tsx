import { PointerEvent, useEffect, useRef, useState } from 'react';
import { Sheet } from '@/components/app/ui';
import { crmBtn } from '@/components/app/tokens';
import { type Corte, estiloFoco } from '@/lib/imagens';

const MIN = 5;
const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Prévias com o formato dos cards do site onde a capa aparece. */
const PREVIAS = [
    { nome: 'Card do mapa', className: 'h-[104px] w-[86px]' },
    { nome: 'Catálogo', className: 'aspect-[4/3] w-36' },
    { nome: 'Lista e mapa', className: 'aspect-[16/9] w-44' },
];

/**
 * Enquadrar capa: a foto aparece inteira e o usuário arrasta para desenhar o retângulo que os
 * cards do site devem mostrar (zoom e centro no retângulo). Prévia ao vivo nos formatos de card.
 */
export function EnquadrarCapa({ src, corte, aberto, onFechar, onAplicar }: {
    src: string;
    corte: Corte | undefined;
    aberto: boolean;
    onFechar: () => void;
    onAplicar: (corte: Corte | undefined) => void;
}) {
    const img = useRef<HTMLImageElement>(null);
    const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
    const [ret, setRet] = useState<Corte | undefined>(corte);
    const inicio = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => { if (aberto) setRet(corte); }, [aberto, corte]);

    /** Retângulo da foto dentro da caixa (object-fit: contain deixa faixas vazias). */
    const area = () => {
        const el = img.current;
        if (!el || !natural) return null;
        const box = el.getBoundingClientRect();
        const escala = Math.min(box.width / natural.w, box.height / natural.h);
        const w = natural.w * escala, h = natural.h * escala;
        return { left: box.left + (box.width - w) / 2, top: box.top + (box.height - h) / 2, w, h, box };
    };
    const ponto = (e: PointerEvent) => {
        const a = area();
        if (!a) return null;
        return { x: limitar(((e.clientX - a.left) / a.w) * 100, 0, 100), y: limitar(((e.clientY - a.top) / a.h) * 100, 0, 100) };
    };

    const descer = (e: PointerEvent<HTMLDivElement>) => {
        const p = ponto(e);
        if (!p) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        inicio.current = p;
        setRet({ x: p.x, y: p.y, w: 0, h: 0 });
    };
    const mover = (e: PointerEvent<HTMLDivElement>) => {
        const i = inicio.current;
        const p = i && ponto(e);
        if (!i || !p) return;
        setRet({ x: Math.min(i.x, p.x), y: Math.min(i.y, p.y), w: Math.abs(p.x - i.x), h: Math.abs(p.y - i.y) });
    };
    const soltar = () => {
        inicio.current = null;
        setRet((r) => {
            if (!r || (r.w < MIN && r.h < MIN)) return corte; // clique sem arrastar: mantém o que havia
            const w = limitar(r.w, MIN, 100), h = limitar(r.h, MIN, 100);
            return { x: r1(limitar(r.x, 0, 100 - w)), y: r1(limitar(r.y, 0, 100 - h)), w: r1(w), h: r1(h) };
        });
    };

    // Retângulo em % da caixa (convertendo da foto para a caixa)
    const a = natural ? area() : null;
    const caixa = ret && a ? {
        left: `${((a.left - a.box.left + (ret.x / 100) * a.w) / a.box.width) * 100}%`,
        top: `${((a.top - a.box.top + (ret.y / 100) * a.h) / a.box.height) * 100}%`,
        width: `${((ret.w / 100) * a.w / a.box.width) * 100}%`,
        height: `${((ret.h / 100) * a.h / a.box.height) * 100}%`,
    } : null;
    const valido = !!ret && ret.w >= MIN && ret.h >= MIN;
    const focos = valido ? { [src]: { x: ret.x + ret.w / 2, y: ret.y + ret.h / 2, corte: ret } } : null;

    return (
        <Sheet
            open={aberto}
            onClose={onFechar}
            eyebrow="Capa do painel"
            title="Enquadrar a capa nos cards"
            size="lg"
            footer={
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {corte && (
                        <button type="button" className={`${crmBtn.ghost} mr-auto`} onClick={() => { onAplicar(undefined); onFechar(); }}>
                            Tirar o recorte
                        </button>
                    )}
                    <button type="button" className={crmBtn.secondary} onClick={onFechar}>Cancelar</button>
                    <button type="button" className={crmBtn.primary} disabled={!valido} onClick={() => { onAplicar(ret); onFechar(); }}>
                        Usar este recorte
                    </button>
                </div>
            }
        >
            <p className="mb-3 text-sm text-brand-muted">
                Arraste sobre a foto para marcar o que deve aparecer nos cards do site (o telão e a rua). A prévia mostra como fica.
            </p>
            <div
                className="relative h-[min(42vh,440px)] touch-none select-none bg-black"
                onPointerDown={descer}
                onPointerMove={mover}
                onPointerUp={soltar}
                onPointerCancel={soltar}
            >
                <img
                    ref={img}
                    src={src}
                    alt="Capa do painel para enquadrar"
                    draggable={false}
                    onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                    className="pointer-events-none h-full w-full cursor-crosshair object-contain"
                />
                {caixa && (
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute border-2 border-brand-neon shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                        style={caixa}
                    />
                )}
                <span className="pointer-events-none absolute right-0 top-0 bg-black/70 px-2 py-1 text-xs text-white">
                    {valido ? 'Recorte da capa' : 'Arraste para desenhar o recorte'}
                </span>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-4">
                {PREVIAS.map((p) => (
                    <figure key={p.nome} className="flex flex-col gap-1.5">
                        <div className={`relative overflow-hidden border border-brand-border bg-black ${p.className}`}>
                            <img src={src} alt="" draggable={false} style={estiloFoco(focos, src, 'recorte')} className="h-full w-full object-cover" />
                        </div>
                        <figcaption className="text-[11px] text-brand-muted">{p.nome}</figcaption>
                    </figure>
                ))}
            </div>
        </Sheet>
    );
}
