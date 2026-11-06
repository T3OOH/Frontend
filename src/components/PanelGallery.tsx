import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { estiloFoco, FocosFotos } from '@/lib/imagens';

interface PanelGalleryProps {
    images: string[];
    /** Ponto de foco de cada foto (corte centrado no telão). */
    focos?: FocosFotos;
    name: string;
}

/**
 * Fotos do painel nos detalhes do catálogo: setas, miniaturas, contador, teclado (← →)
 * e arrastar para o lado no celular. Com uma foto só, mostra só a foto.
 */
export function PanelGallery({ images, focos, name }: PanelGalleryProps) {
    const photos = images.filter(Boolean);
    const list = photos.length ? photos : ['/placeholder.svg'];
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const many = list.length > 1;

    const go = (step: number) => {
        setDirection(step);
        setIndex((i) => (i + step + list.length) % list.length);
    };

    // Teclado: setas trocam a foto enquanto os detalhes estão abertos
    useEffect(() => {
        if (!many) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [many, list.length]);

    return (
        <div className="flex h-full flex-col bg-ink-900">
            <div className="relative min-h-0 flex-1 overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.img
                        key={list[index]}
                        src={list[index]}
                        style={estiloFoco(focos, list[index])}
                        alt={`${name}, foto ${index + 1} de ${list.length}`}
                        custom={direction}
                        initial={{ opacity: 0, x: direction * 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -40 }}
                        transition={{ duration: 0.25 }}
                        drag={many ? 'x' : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.4}
                        onDragEnd={(_, info) => {
                            if (info.offset.x < -60) go(1);
                            else if (info.offset.x > 60) go(-1);
                        }}
                        className="absolute inset-0 h-full w-full cursor-grab select-none object-cover active:cursor-grabbing"
                        draggable={false}
                    />
                </AnimatePresence>

                {many && (
                    <>
                        <button type="button" onClick={() => go(-1)} aria-label="Foto anterior"
                            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-ink-950/70 text-ink-100 backdrop-blur transition-colors hover:bg-brand-neon hover:text-ink-950">
                            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
                        </button>
                        <button type="button" onClick={() => go(1)} aria-label="Próxima foto"
                            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-ink-950/70 text-ink-100 backdrop-blur transition-colors hover:bg-brand-neon hover:text-ink-950">
                            <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
                        </button>
                        <span className="absolute bottom-3 left-3 bg-ink-950/70 px-2.5 py-1 font-mono text-xs text-ink-100 backdrop-blur" aria-live="polite">
                            {index + 1} / {list.length}
                        </span>
                    </>
                )}
            </div>

            {many && (
                <div className="flex shrink-0 gap-2 overflow-x-auto p-2" role="tablist" aria-label="Fotos do painel">
                    {list.map((src, i) => (
                        <button
                            key={src + i}
                            type="button"
                            role="tab"
                            aria-selected={i === index}
                            aria-label={`Ver foto ${i + 1}`}
                            onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                            className={`h-14 w-20 shrink-0 overflow-hidden border-2 transition-opacity ${i === index ? 'border-brand-neon opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        >
                            <img src={src} style={estiloFoco(focos, src)} alt="" loading="lazy" className="h-full w-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
