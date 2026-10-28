import { memo, useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { LedScreen, LedScene } from './LedScreen';

/**
 * Fundo realista: foto real de Goiânia com
 *  - trânsito animado correndo sobre os rastros de luz da própria foto;
 *  - telões de LED encaixados nos prédios, exibindo anúncios e a logo da T3;
 *  - zoom e deslocamento acompanhando a rolagem da página.
 *
 * Tudo é posicionado em coordenadas da foto (1620 × 971) e convertido para a tela
 * com a mesma regra do object-cover, então os telões e as luzes ficam "presos" à cena
 * em qualquer tamanho de janela.
 */

const PHOTO = { src: '/cidade-t3-noite.webp', w: 1620, h: 971 };

// Curvas da avenida na foto (pontos de controle de Bézier cúbica, em pixels da foto)
type Curve = [number, number, number, number, number, number, number, number];
const ROADS: { curve: Curve; color: string; trail: string; lanes: number; speed: number; until?: number }[] = [
    // Avenida da esquerda (faróis claros); termina antes das copas das árvores
    { curve: [20, 975, 140, 830, 250, 700, 410, 588], color: '#FFE7BD', trail: '255,205,140', lanes: 2, speed: 0.11, until: 0.4 },
    { curve: [-30, 905, 110, 780, 220, 660, 380, 575], color: '#FFF3DD', trail: '255,222,170', lanes: 2, speed: 0.09, until: 0.38 },
    // Avenida da direita (lanternas vermelhas e laranja), da fila de carros até o canto inferior
    { curve: [1060, 672, 1300, 720, 1470, 800, 1560, 975], color: '#FF4A1C', trail: '255,70,26', lanes: 3, speed: 0.1 },
    { curve: [1100, 660, 1380, 690, 1560, 780, 1635, 900], color: '#FF7A2A', trail: '255,110,30', lanes: 3, speed: 0.12 },
];

const ROOF_SCENES: LedScene[] = [
    { type: 'logo', hold: 4400 },
    { type: 'ad', lines: ['SUA MARCA', 'AQUI'], bg: '#FF5E00', fg: '#0B0B0C', hold: 3000 },
    { type: 'ad', lines: ['PLANO', 'ANUAL -30%'], bg: '#F4F1EC', fg: '#0B0B0C', stripe: '#FF5E00', hold: 3000 },
];
const FACADE_SCENES: LedScene[] = [
    { type: 'ad', lines: ['MÍDIA', 'OOH'], bg: '#0B0B0C', fg: '#FF5E00', hold: 3000 },
    { type: 'logo', hold: 4200 },
    { type: 'bars', hold: 2600 },
];

function bezier(c: Curve, t: number) {
    const u = 1 - t;
    const x = u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6];
    const y = u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7];
    return [x, y] as const;
}

interface Cover { scale: number; x: number; y: number }

function coverFor(w: number, h: number): Cover {
    const scale = Math.max(w / PHOTO.w, h / PHOTO.h);
    return { scale, x: (w - PHOTO.w * scale) / 2, y: (h - PHOTO.h * scale) / 2 };
}

interface PhotoCityProps {
    /** Opacidade do véu escuro (0 = foto pura, 1 = preto). */
    veil?: number;
    /** "fixed" para fundo da página inteira; "absolute" para preencher uma seção. */
    position?: 'fixed' | 'absolute';
}

export const PhotoCity = memo(function PhotoCity({ veil = 0.55, position = 'fixed' }: PhotoCityProps) {
    const boxRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cover, setCover] = useState<Cover>({ scale: 1, x: 0, y: 0 });

    // Rolagem: aproximação lenta da câmera (zoom) e leve subida
    const { scrollY } = useScroll();
    const scale = useTransform(scrollY, [0, 1600], [1.04, 1.22]);
    const y = useTransform(scrollY, [0, 1600], [0, -60]);

    useEffect(() => {
        const box = boxRef.current;
        const canvas = canvasRef.current;
        if (!box || !canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let W = 0, H = 0, c = coverFor(1, 1);
        const resize = () => {
            const r = box.getBoundingClientRect();
            W = r.width; H = r.height;
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            c = coverFor(W, H);
            setCover(c);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(box);

        // Carros: cada um percorre a curva com fase e velocidade próprias
        const cars = ROADS.flatMap((road, r) =>
            Array.from({ length: road.lanes * 3 }, (_, i) => ({
                road: r,
                phase: (i * 0.37 + r * 0.13) % 1,
                speed: road.speed * (0.8 + ((i * 7) % 5) * 0.1),
            }))
        );

        let last = 0, raf = 0, boost = 0, lastScroll = scrollY.get();
        const draw = (dt: number) => {
            const s = scrollY.get();
            boost = boost * 0.92 + Math.min(Math.abs(s - lastScroll), 140) * 0.06;
            lastScroll = s;

            ctx.clearRect(0, 0, W, H);
            ctx.globalCompositeOperation = 'lighter';
            for (const car of cars) {
                const road = ROADS[car.road];
                const until = road.until ?? 1;
                car.phase = (car.phase + dt * car.speed * (1 + boost)) % 1;
                const head = car.phase * until;
                const length = 0.06 + boost * 0.01;
                const toScreen = (t: number) => {
                    const [px, py] = bezier(road.curve, Math.max(0, t));
                    return [c.x + px * c.scale, c.y + py * c.scale] as const;
                };
                // Rastro: polilinha que esmaece em direção à cauda
                const steps = 12;
                ctx.lineCap = 'round';
                for (let k = 0; k < steps; k++) {
                    const t0 = head - (k / steps) * length;
                    const t1 = head - ((k + 1) / steps) * length;
                    if (t1 < 0) break;
                    const [x0, y0] = toScreen(t0);
                    const [x1, y1] = toScreen(t1);
                    ctx.strokeStyle = `rgba(${road.trail},${(1 - k / steps) * 0.8})`;
                    ctx.lineWidth = Math.max(1.2, 2.4 * c.scale);
                    ctx.beginPath();
                    ctx.moveTo(x0, y0);
                    ctx.lineTo(x1, y1);
                    ctx.stroke();
                }
                // Farol/lanterna com halo suave
                const [hx, hy] = toScreen(head);
                const r = Math.max(4, 9 * c.scale);
                const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, r);
                halo.addColorStop(0, road.color);
                halo.addColorStop(0.35, `rgba(${road.trail},0.55)`);
                halo.addColorStop(1, `rgba(${road.trail},0)`);
                ctx.fillStyle = halo;
                ctx.fillRect(hx - r, hy - r, r * 2, r * 2);
            }
            ctx.globalCompositeOperation = 'source-over';
        };

        const loop = (now: number) => {
            raf = requestAnimationFrame(loop);
            if (now - last < 33) return;
            const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
            last = now;
            draw(dt);
        };
        const start = () => { if (!reduceMotion && !raf && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };
        const stop = () => { cancelAnimationFrame(raf); raf = 0; };
        const onVisibility = () => (document.hidden ? stop() : start());
        document.addEventListener('visibilitychange', onVisibility);
        start();

        return () => {
            stop();
            ro.disconnect();
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [scrollY]);

    // Converte um retângulo da foto para estilo absoluto na tela
    const place = (x: number, yy: number, w: number, h: number) => ({
        left: cover.x + x * cover.scale,
        top: cover.y + yy * cover.scale,
        width: w * cover.scale,
        height: h * cover.scale,
    });

    return (
        <div
            ref={boxRef}
            aria-hidden="true"
            className={`pointer-events-none inset-0 -z-10 overflow-hidden bg-ink-950 ${position === 'fixed' ? 'fixed h-[100dvh]' : 'absolute'}`}
        >
            <motion.div style={{ scale, y }} className="absolute inset-0 origin-[50%_62%]">
                <img
                    src={PHOTO.src}
                    alt=""
                    className="absolute max-w-none select-none"
                    style={place(0, 0, PHOTO.w, PHOTO.h)}
                    fetchPriority="high"
                />

                {/* Véus de leitura: só a foto escurece; telões e faróis emitem luz própria */}
                <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(11,11,12,${Math.min(1, veil + 0.3)}) 0%, rgba(11,11,12,${veil}) 45%, rgba(11,11,12,${veil * 0.35}) 100%)` }} />

                {/* Telão no topo da arena, à direita */}
                <div className="absolute" style={place(1360, 300, 180, 102)}>
                    <div className="h-full w-full bg-[#1d1d20] p-[3%] shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
                        <LedScreen scenes={ROOF_SCENES} cols={64} rows={36} offset={600} className="block h-full w-full bg-[#121113]" />
                    </div>
                    <div className="mx-auto flex w-1/2 justify-between">
                        <span className="h-6 w-[3px] bg-[#2a2a2e]" /><span className="h-6 w-[3px] bg-[#2a2a2e]" />
                    </div>
                </div>

                {/* Fachada de LED no prédio de vidro da direita */}
                <div
                    className="absolute origin-left [transform:perspective(600px)_rotateY(-14deg)]"
                    style={place(1112, 424, 138, 106)}
                >
                    <LedScreen scenes={FACADE_SCENES} cols={56} rows={42} offset={2200} className="block h-full w-full opacity-90 mix-blend-screen" />
                </div>

                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            </motion.div>

            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 to-transparent" />
        </div>
    );
});
