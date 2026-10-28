import { memo, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { LedScreen, LedScene } from './LedScreen';

/**
 * Composição do hero: três telões de LED em perspectiva, como painéis numa avenida.
 * O principal exibe a logo T3; os laterais alternam mensagens e um "anúncio" animado.
 * A inclinação acompanha o mouse via MotionValue (fora do ciclo de render do React).
 */

// Cenas fora do componente: referências estáveis evitam reiniciar os canvases
const MAIN_SCENES: LedScene[] = [
    { type: 'logo', hold: 4200 },
    { type: 'text', lines: ['SUA MARCA', 'AQUI'] },
    { type: 'ticker', text: 'GOIÂNIA  •  ITUMBIARA  •  PAINÉIS DE LED' },
    { type: 'logo', hold: 3000 },
    { type: 'bars', hold: 3200 },
];

const LEFT_SCENES: LedScene[] = [
    { type: 'bars', hold: 3600 },
    { type: 'logo' },
    { type: 'text', lines: ['24H', 'NO AR'], color: '#FF5E00' },
];

const RIGHT_SCENES: LedScene[] = [
    { type: 'text', lines: ['MÍDIA', 'OOH'], color: '#FF5E00' },
    { type: 'logo' },
    { type: 'ticker', text: 'ANUNCIE NOS PRINCIPAIS CORREDORES DA CIDADE' },
];

function Billboard({
    scenes,
    cols,
    rows,
    offset,
    label,
    className,
    pole = true,
}: {
    scenes: LedScene[];
    cols: number;
    rows: number;
    offset: number;
    label: string;
    className?: string;
    pole?: boolean;
}) {
    return (
        <div className={className}>
            {/* Moldura metálica fina, como a estrutura de um painel real */}
            <div className="rounded-none bg-[#1F1F22] p-[6px] ring-1 ring-white/[0.06] shadow-panel">
                <div className="rounded-none bg-[#121113] overflow-hidden">
                    <LedScreen scenes={scenes} cols={cols} rows={rows} offset={offset} label={label} className="block w-full aspect-[16/9]" />
                </div>
            </div>
            {pole && (
                <div aria-hidden="true" className="mx-auto flex w-[38%] justify-between">
                    <span className="h-16 w-2.5 bg-gradient-to-b from-[#2A2A2E] to-transparent" />
                    <span className="h-16 w-2.5 bg-gradient-to-b from-[#2A2A2E] to-transparent" />
                </div>
            )}
        </div>
    );
}

export const LedWall = memo(function LedWall() {
    const ref = useRef<HTMLDivElement>(null);
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const springX = useSpring(mx, { stiffness: 100, damping: 20 });
    const springY = useSpring(my, { stiffness: 100, damping: 20 });
    const rotateY = useTransform(springX, [-0.5, 0.5], [6, -6]);
    const rotateX = useTransform(springY, [-0.5, 0.5], [-4, 4]);

    const onMove = (e: React.PointerEvent) => {
        if (e.pointerType !== 'mouse' || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
    };

    return (
        <div
            ref={ref}
            onPointerMove={onMove}
            onPointerLeave={() => { mx.set(0); my.set(0); }}
            className="relative w-full [perspective:1400px]"
        >
            <motion.div style={{ rotateX, rotateY }} className="relative [transform-style:preserve-3d]">
                {/* Telões laterais, mais ao fundo */}
                <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.35 }}
                    className="absolute left-0 top-[6%] hidden w-[38%] sm:block [transform:translateZ(-160px)_rotateY(24deg)]"
                >
                    <Billboard scenes={LEFT_SCENES} cols={64} rows={36} offset={1300} label="Telão de LED lateral" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.5 }}
                    className="absolute right-0 top-[2%] hidden w-[34%] sm:block [transform:translateZ(-220px)_rotateY(-22deg)]"
                >
                    <Billboard scenes={RIGHT_SCENES} cols={64} rows={36} offset={2600} label="Telão de LED lateral" />
                </motion.div>

                {/* Telão principal, à frente */}
                <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.15 }}
                    className="relative mx-auto w-[86%] pt-[18%] sm:w-[62%] [transform:translateZ(40px)]"
                >
                    <Billboard scenes={MAIN_SCENES} cols={112} rows={63} offset={0} label="Telão de LED com a logo da T3" />
                </motion.div>
            </motion.div>

            {/* Reflexo dos LEDs no asfalto: luz quente, difusa e discreta */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-[12%] -bottom-6 h-24 rounded-[50%] bg-[#FF5E00]/[0.07] blur-3xl" />
        </div>
    );
});
