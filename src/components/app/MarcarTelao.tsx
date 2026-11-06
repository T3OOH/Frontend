import { MouseEvent, useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Sheet } from '@/components/app/ui';
import { crmBtn } from '@/components/app/tokens';
import { detectarFoco, FocoFoto, Ponto } from '@/lib/focoFoto';

/**
 * Pino do telão (só na edição de painéis): a foto aparece grande, um clique marca onde está o
 * telão e a IA procura o telão em volta do pino e recalcula o foco do corte com o movimento da
 * rua. O pino fica gravado na foto (imageFocus[url].pino) e vale nas próximas análises.
 */
export function MarcarTelao({ src, foco, aberto, onFechar, onAplicar }: {
    src: string;
    foco: FocoFoto | null | undefined;
    aberto: boolean;
    onFechar: () => void;
    onAplicar: (foco: FocoFoto | null) => void;
}) {
    const img = useRef<HTMLImageElement>(null);
    const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
    const [pino, setPino] = useState<Ponto | null>(foco?.pino ?? null);
    const [resultado, setResultado] = useState<FocoFoto | null | undefined>(foco);
    const [analisando, setAnalisando] = useState(false);

    // Abriu de novo: volta ao que está gravado na foto
    useEffect(() => {
        if (!aberto) return;
        setPino(foco?.pino ?? null);
        setResultado(foco);
    }, [aberto, foco]);

    /** Retângulo da foto dentro da caixa (object-fit: contain deixa faixas vazias). */
    const area = () => {
        const el = img.current;
        if (!el || !natural) return null;
        const box = el.getBoundingClientRect();
        const escala = Math.min(box.width / natural.w, box.height / natural.h);
        const w = natural.w * escala, h = natural.h * escala;
        return { left: box.left + (box.width - w) / 2, top: box.top + (box.height - h) / 2, w, h, box };
    };

    const marcar = (e: MouseEvent<HTMLImageElement>) => {
        const a = area();
        if (!a) return;
        const x = ((e.clientX - a.left) / a.w) * 100;
        const y = ((e.clientY - a.top) / a.h) * 100;
        if (x < 0 || x > 100 || y < 0 || y > 100) return;
        const novo = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
        setPino(novo);
        setAnalisando(true);
        detectarFoco(src, novo)
            .catch(() => ({ x: novo.x, y: novo.y, fonte: 'auto' as const, objetos: ['telão'], pino: novo }))
            .then((f) => setResultado(f))
            .finally(() => setAnalisando(false));
    };

    // Ponto da foto (%) em % da caixa da imagem, para posicionar os marcadores
    const naCaixa = (p: Ponto) => {
        const a = area();
        if (!a) return null;
        return {
            left: `${((a.left - a.box.left + (p.x / 100) * a.w) / a.box.width) * 100}%`,
            top: `${((a.top - a.box.top + (p.y / 100) * a.h) / a.box.height) * 100}%`,
        };
    };
    const posPino = pino ? naCaixa(pino) : null;
    const posFoco = resultado ? naCaixa(resultado) : null;

    return (
        <Sheet
            open={aberto}
            onClose={onFechar}
            eyebrow="Foto do painel"
            title="Marcar o telão"
            size="lg"
            footer={
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {foco?.pino && (
                        <button type="button" className={`${crmBtn.ghost} mr-auto`} onClick={() => { onAplicar(null); onFechar(); }}>
                            Tirar o pino
                        </button>
                    )}
                    <button type="button" className={crmBtn.secondary} onClick={onFechar}>Cancelar</button>
                    <button type="button" className={crmBtn.primary} disabled={!pino || analisando || !resultado} onClick={() => { onAplicar(resultado ?? null); onFechar(); }}>
                        {analisando ? 'Procurando o telão…' : 'Usar este pino'}
                    </button>
                </div>
            }
        >
            <p className="mb-3 text-sm text-brand-muted">
                Clique em cima do telão. A IA procura o telão em volta do pino e ajusta o foco do corte (ponto laranja) com o movimento da rua.
            </p>
            <div className="relative h-[min(60vh,560px)] bg-black">
                <img
                    ref={img}
                    src={src}
                    alt="Foto do painel para marcar o telão"
                    crossOrigin="anonymous"
                    onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                    onClick={marcar}
                    className="h-full w-full cursor-crosshair object-contain"
                />
                {posFoco && !analisando && (
                    <span aria-hidden="true" className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-neon/80 shadow-[0_0_0_3px_rgba(0,0,0,0.45)]" style={posFoco} />
                )}
                {posPino && (
                    <MapPin aria-hidden="true" className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-full fill-brand-neon text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)]" style={posPino} />
                )}
                <span className={`pointer-events-none absolute right-0 top-0 bg-black/70 px-2 py-1 text-xs text-white ${analisando ? 'animate-pulse' : ''}`}>
                    {analisando ? 'Procurando o telão…' : pino ? 'Pino no telão · ponto laranja = foco do corte' : 'Clique no telão'}
                </span>
            </div>
        </Sheet>
    );
}
