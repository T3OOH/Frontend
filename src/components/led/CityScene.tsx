import { memo, useEffect, useRef } from 'react';
import { useScroll } from 'framer-motion';
import { drawScene, loadLogo, LedScene } from './LedScreen';

/**
 * Fundo do site: uma avenida à noite com prédios, telões de LED e trânsito.
 *
 * - Três camadas com profundidades diferentes (paralaxe): skyline distante, prédios
 *   com telões e a avenida em primeiro plano.
 * - Os telões exibem anúncios da própria T3 e a animação da logo, desenhados LED a LED.
 * - A rolagem da página move a câmera e "empurra" o trânsito: quanto mais rápido o
 *   usuário rola, mais rápido os carros passam.
 * - Um único canvas, ~30 fps, pausa com a aba oculta e quadro estático para quem
 *   prefere menos movimento.
 */

const ORANGE = '#FF5E00';
const BONE = '#F4F1EC';
const INK = '#0B0B0C';

// Programações dos telões: peças da própria T3 (nada de marcas de terceiros)
const PLAYLISTS: LedScene[][] = [
    [
        { type: 'logo', hold: 4200 },
        { type: 'ad', lines: ['SUA MARCA', 'AQUI'], bg: ORANGE, fg: INK, hold: 3200 },
        { type: 'bars', hold: 2600 },
    ],
    [
        { type: 'ad', lines: ['ANUNCIE', 'NA T3'], bg: BONE, fg: INK, stripe: ORANGE, hold: 3400 },
        { type: 'logo', hold: 3600 },
        { type: 'ad', lines: ['24H', 'NO AR'], bg: INK, fg: ORANGE, hold: 2800 },
    ],
    [
        { type: 'ticker', text: 'GOIÂNIA  •  PAINÉIS DE LED  •  T3 OOH', hold: 7000 },
        { type: 'logo', hold: 3600 },
    ],
    [
        { type: 'ad', lines: ['PLANO', 'ANUAL', '-30%'], bg: ORANGE, fg: BONE, hold: 3000 },
        { type: 'logo', hold: 4000 },
        { type: 'ad', lines: ['MÍDIA', 'OOH'], bg: BONE, fg: ORANGE, stripe: INK, hold: 2800 },
    ],
    [
        { type: 'logo', hold: 5000 },
        { type: 'ad', lines: ['VEJA O', 'MAPA'], bg: INK, fg: BONE, stripe: ORANGE, hold: 3000 },
    ],
];

interface Building { x: number; w: number; h: number; windows: { x: number; y: number; lit: string }[] }
interface Billboard { x: number; y: number; w: number; h: number; cols: number; rows: number; playlist: LedScene[]; offset: number; source: CanvasRenderingContext2D }
interface Car { lane: number; x: number; speed: number; color: string; length: number }

/** Gerador pseudoaleatório com semente: a cidade é sempre a mesma em cada tamanho de tela. */
function seeded(seed: number) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

export const CityScene = memo(function CityScene() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { scrollY } = useScroll();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let W = 0, H = 0, horizon = 0, roadTop = 0;
        let far: Building[] = [];
        let mid: Building[] = [];
        let billboards: Billboard[] = [];
        let cars: Car[] = [];
        let lamps: number[] = [];

        let scroll = scrollY.get();
        let lastScroll = scroll;
        let boost = 0;
        let traffic = 0;
        let raf = 0;
        let last = 0;

        const build = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            canvas.style.width = `${W}px`;
            canvas.style.height = `${H}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            horizon = H * 0.66;
            roadTop = H * 0.8;
            const rand = seeded(Math.round(W / 50) + 7);
            const mobile = W < 768;

            // Skyline distante (largura extra para a paralaxe horizontal)
            far = [];
            for (let x = -60; x < W + 120;) {
                const w = 30 + rand() * 70;
                const h = H * (0.12 + rand() * 0.26);
                const windows: Building['windows'] = [];
                for (let wy = 8; wy < h - 6; wy += 9) {
                    for (let wx = 5; wx < w - 5; wx += 8) {
                        if (rand() < 0.16) windows.push({ x: wx, y: wy, lit: rand() < 0.8 ? '#3B2A1C' : '#2E2E33' });
                    }
                }
                far.push({ x, w, h, windows });
                x += w + rand() * 6;
            }

            // Prédios da frente, alguns com telões
            mid = [];
            billboards = [];
            let playlistIndex = 0;
            for (let x = -40; x < W + 80;) {
                const w = (mobile ? 70 : 90) + rand() * (mobile ? 80 : 150);
                const h = H * (0.2 + rand() * 0.32);
                const windows: Building['windows'] = [];
                for (let wy = 12; wy < h - 10; wy += 13) {
                    for (let wx = 8; wx < w - 8; wx += 12) {
                        if (rand() < 0.22) windows.push({ x: wx, y: wy, lit: rand() < 0.72 ? '#6B4A2B' : '#8C8C92' });
                    }
                }
                mid.push({ x, w, h, windows });

                const wantsBoard = w > (mobile ? 90 : 130) && rand() < 0.62 && billboards.length < (mobile ? 2 : 5);
                if (wantsBoard) {
                    const bw = Math.min(w * 0.86, mobile ? 150 : 230);
                    const bh = bw * 0.5625;
                    const cols = mobile ? 40 : 56;
                    const rows = Math.round(cols * 0.5625);
                    const src = document.createElement('canvas');
                    src.width = cols;
                    src.height = rows;
                    billboards.push({
                        x: x + (w - bw) / 2,
                        y: horizon - h - bh - 14, // sobre o topo do prédio, apoiado em suportes
                        w: bw,
                        h: bh,
                        cols,
                        rows,
                        playlist: PLAYLISTS[playlistIndex++ % PLAYLISTS.length],
                        offset: rand() * 4000,
                        source: src.getContext('2d', { willReadFrequently: true })!,
                    });
                }
                x += w + 10 + rand() * 24;
            }

            // Postes de luz e carros
            lamps = [];
            for (let x = 40; x < W + 200; x += mobile ? 160 : 220) lamps.push(x);
            cars = [];
            const laneCount = 4;
            for (let lane = 0; lane < laneCount; lane++) {
                const n = mobile ? 3 : 6;
                for (let i = 0; i < n; i++) {
                    const toRight = lane < 2;
                    cars.push({
                        lane,
                        x: rand() * (W + 400),
                        speed: (toRight ? 1 : -1) * (40 + rand() * 50 + lane * 12),
                        color: toRight ? ORANGE : BONE,
                        length: 26 + rand() * 18,
                    });
                }
            }
        };

        const drawBillboard = (b: Billboard, now: number, offsetY: number) => {
            const { playlist } = b;
            const total = playlist.reduce((s, sc) => s + (sc.hold ?? 3500), 0);
            let t = (now + b.offset) % total;
            let scene = playlist[0];
            for (const sc of playlist) {
                const hold = sc.hold ?? 3500;
                if (t < hold) { scene = sc; break; }
                t -= hold;
            }
            drawScene(b.source, scene, b.cols, b.rows, now);
            const data = b.source.getImageData(0, 0, b.cols, b.rows).data;

            const y = b.y + offsetY;
            // Suportes e moldura
            ctx.fillStyle = '#1B1B1E';
            ctx.fillRect(b.x + b.w * 0.22, y + b.h, 4, 16);
            ctx.fillRect(b.x + b.w * 0.78 - 4, y + b.h, 4, 16);
            ctx.fillStyle = '#202024';
            ctx.fillRect(b.x - 4, y - 4, b.w + 8, b.h + 8);

            // Primeiro instante de cada cena: faixa de varredura de atualização
            const sweep = t < 450 ? (t / 450) * b.rows : -10;
            const cw = b.w / b.cols;
            const ch = b.h / b.rows;
            const dot = Math.max(1, Math.min(cw, ch) * 0.72);
            for (let r = 0; r < b.rows; r++) {
                const band = Math.abs(r - sweep) < 1.5;
                for (let c = 0; c < b.cols; c++) {
                    const i = (r * b.cols + c) * 4;
                    const a = data[i + 3] / 255;
                    let red = 26 + (data[i] - 26) * a;
                    let green = 24 + (data[i + 1] - 24) * a;
                    let blue = 23 + (data[i + 2] - 23) * a;
                    if (r > sweep && sweep >= 0) { red *= 0.35; green *= 0.35; blue *= 0.35; }
                    if (band) { red = Math.min(255, red + 80); green = Math.min(255, green + 60); blue = Math.min(255, blue + 50); }
                    ctx.fillStyle = `rgb(${red | 0},${green | 0},${blue | 0})`;
                    ctx.fillRect(b.x + c * cw, y + r * ch, dot, dot);
                }
            }
            // Luz do telão refletida no prédio logo abaixo
            const glow = ctx.createLinearGradient(0, y + b.h, 0, y + b.h + 90);
            glow.addColorStop(0, 'rgba(255,94,0,0.10)');
            glow.addColorStop(1, 'rgba(255,94,0,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(b.x - 10, y + b.h, b.w + 20, 90);
        };

        const frame = (now: number, dt: number) => {
            // Rolagem: câmera sobe com a página; velocidade da rolagem acelera o trânsito
            const delta = scroll - lastScroll;
            lastScroll = scroll;
            boost = boost * 0.9 + Math.min(Math.abs(delta), 120) * 0.9;
            traffic += dt * (1 + boost * 0.12);

            const cam = Math.min(scroll, H * 3);
            const farY = -cam * 0.04;
            const midY = -cam * 0.09;
            const shiftFar = (cam * 0.05) % 200;
            const shiftMid = (cam * 0.12) % 300;

            // Céu: escuro no alto, calor da cidade no horizonte
            const sky = ctx.createLinearGradient(0, 0, 0, H);
            sky.addColorStop(0, '#09090A');
            sky.addColorStop(0.55, '#100E0D');
            sky.addColorStop(0.66, '#1D130D');
            sky.addColorStop(1, '#0B0B0C');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, W, H);

            // Skyline distante
            ctx.save();
            ctx.translate(-shiftFar, farY);
            for (const b of far) {
                ctx.fillStyle = '#121214';
                ctx.fillRect(b.x, horizon - b.h, b.w, b.h + H);
                for (const w of b.windows) {
                    ctx.fillStyle = w.lit;
                    ctx.fillRect(b.x + w.x, horizon - b.h + w.y, 2, 3);
                }
            }
            ctx.restore();

            // Prédios com telões
            ctx.save();
            ctx.translate(-shiftMid * 0.4, 0);
            for (const b of mid) {
                const top = horizon - b.h + midY;
                ctx.fillStyle = '#161618';
                ctx.fillRect(b.x, top, b.w, b.h + H);
                ctx.fillStyle = '#1C1C1F';
                ctx.fillRect(b.x, top, 3, b.h + H); // aresta iluminada
                for (const w of b.windows) {
                    ctx.fillStyle = w.lit;
                    ctx.fillRect(b.x + w.x, top + w.y, 4, 5);
                }
            }
            for (const bb of billboards) drawBillboard(bb, now, midY);
            ctx.restore();

            // Avenida
            const road = ctx.createLinearGradient(0, roadTop, 0, H);
            road.addColorStop(0, '#121213');
            road.addColorStop(1, '#0B0B0C');
            ctx.fillStyle = road;
            ctx.fillRect(0, roadTop, W, H - roadTop);
            ctx.fillStyle = '#1A1A1C';
            ctx.fillRect(0, roadTop, W, 2);

            // Faixas tracejadas que correm com o trânsito
            const laneH = (H - roadTop) / 4;
            ctx.fillStyle = '#2A2A2E';
            const dash = 46;
            const offset = (traffic * 60) % (dash * 2);
            for (let x = -dash * 2 + offset; x < W; x += dash * 2) {
                ctx.fillRect(x, roadTop + laneH * 2 - 1, dash, 2);
            }

            // Postes com luz quente
            for (const lx of lamps) {
                const x = (lx - (cam * 0.3) % 220 + W + 220) % (W + 220) - 110;
                ctx.fillStyle = '#1E1E21';
                ctx.fillRect(x, roadTop - H * 0.22, 3, H * 0.22);
                ctx.fillRect(x, roadTop - H * 0.22, 26, 3);
                const lamp = ctx.createRadialGradient(x + 24, roadTop - H * 0.22 + 4, 0, x + 24, roadTop - H * 0.22 + 4, 60);
                lamp.addColorStop(0, 'rgba(255,170,90,0.35)');
                lamp.addColorStop(1, 'rgba(255,170,90,0)');
                ctx.fillStyle = lamp;
                ctx.fillRect(x - 40, roadTop - H * 0.22 - 56, 128, 120);
            }

            // Carros: só as luzes e um rastro curto, como numa foto noturna de longa exposição
            for (const car of cars) {
                const span = W + 400;
                const x = ((((car.x + car.speed * traffic) % span) + span) % span) - 200;
                const y = roadTop + laneH * car.lane + laneH * 0.55;
                const dir = Math.sign(car.speed);
                const trail = car.length * (1.2 + boost * 0.04);
                const grad = ctx.createLinearGradient(x, 0, x - dir * trail * 2.4, 0);
                grad.addColorStop(0, car.color);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.globalAlpha = car.color === ORANGE ? 0.9 : 0.75;
                ctx.fillRect(Math.min(x, x - dir * trail * 2.4), y - 1.5, trail * 2.4, 3);
                ctx.fillRect(Math.min(x, x - dir * trail * 2.4), y + 4, trail * 2.4, 2);
                ctx.globalAlpha = 1;
            }

            // Véu para leitura do conteúdo por cima
            const veil = ctx.createLinearGradient(0, 0, W, 0);
            veil.addColorStop(0, 'rgba(11,11,12,0.72)');
            veil.addColorStop(0.55, 'rgba(11,11,12,0.25)');
            veil.addColorStop(1, 'rgba(11,11,12,0.10)');
            ctx.fillStyle = veil;
            ctx.fillRect(0, 0, W, H);
        };

        const loop = (now: number) => {
            raf = requestAnimationFrame(loop);
            if (now - last < 33) return; // ~30 fps é suficiente para o fundo
            const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
            last = now;
            frame(now, dt);
        };

        const start = () => {
            if (reduceMotion || raf || document.hidden) return;
            last = 0;
            raf = requestAnimationFrame(loop);
        };
        const stop = () => { cancelAnimationFrame(raf); raf = 0; };

        build();
        const drawStatic = () => frame(0, 0);

        const unsubscribe = scrollY.on('change', (v) => {
            scroll = v;
            if (reduceMotion) requestAnimationFrame(drawStatic);
        });
        const onResize = () => { build(); if (reduceMotion) drawStatic(); };
        const onVisibility = () => (document.hidden ? stop() : start());
        window.addEventListener('resize', onResize);
        document.addEventListener('visibilitychange', onVisibility);

        loadLogo().catch(() => undefined).then(() => { drawStatic(); start(); });

        return () => {
            stop();
            unsubscribe();
            window.removeEventListener('resize', onResize);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [scrollY]);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-10 h-[100dvh] w-full"
        />
    );
});
