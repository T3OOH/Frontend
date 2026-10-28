import { memo, useEffect, useRef } from 'react';

/**
 * Telão de LED desenhado em canvas, ponto a ponto (dot-matrix).
 *
 * Cada cena é desenhada numa "fonte" de baixa resolução (cols × rows) e convertida em
 * LEDs individuais. A troca de cena imita a atualização de um painel real: uma faixa
 * de varredura percorre a tela linha a linha.
 *
 * Desempenho: o canvas só é redesenhado quando algo muda (transição ou letreiro em
 * movimento), pausa fora da tela e com a aba oculta, e mostra um quadro estático
 * para quem prefere menos movimento.
 */

export type LedScene =
    | { type: 'logo'; hold?: number }
    | { type: 'text'; lines: string[]; color?: string; hold?: number }
    | { type: 'ticker'; text: string; color?: string; hold?: number }
    | { type: 'bars'; hold?: number }
    /** Peça de anúncio: fundo cheio, texto e uma faixa de destaque que pisca. */
    | { type: 'ad'; lines: string[]; bg: string; fg: string; stripe?: string; hold?: number };

interface LedScreenProps {
    scenes: LedScene[];
    cols?: number;
    rows?: number;
    /** Atraso antes da primeira troca, para dessincronizar telões vizinhos. */
    offset?: number;
    className?: string;
    label?: string;
}

const ACCENT = '#FF5E00';
const OFF_LED = [28, 26, 25] as const; // LED apagado: cinza quente, nunca preto puro
const TRANSITION_MS = 900;

let logoImage: HTMLImageElement | null = null;
let logoReady: Promise<HTMLImageElement> | null = null;

export function loadLogo() {
    if (!logoReady) {
        logoReady = new Promise((resolve, reject) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => { logoImage = img; resolve(img); };
            img.onerror = reject;
            img.src = '/t3-logo.webp';
        });
    }
    return logoReady;
}

export function drawScene(ctx: CanvasRenderingContext2D, scene: LedScene, cols: number, rows: number, t: number) {
    ctx.clearRect(0, 0, cols, rows);

    if (scene.type === 'logo') {
        if (!logoImage) return;
        const scale = Math.min((cols * 0.9) / logoImage.width, (rows * 0.9) / logoImage.height);
        const w = logoImage.width * scale;
        const h = logoImage.height * scale;
        ctx.drawImage(logoImage, (cols - w) / 2, (rows - h) / 2, w, h);
        return;
    }

    if (scene.type === 'ad') {
        ctx.fillStyle = scene.bg;
        ctx.fillRect(0, 0, cols, rows);
        if (scene.stripe && Math.floor(t / 500) % 2 === 0) {
            ctx.fillStyle = scene.stripe;
            ctx.fillRect(0, rows - Math.max(2, rows * 0.12), cols, Math.max(2, rows * 0.12));
        }
        const lineHeight = (rows * 0.86) / (scene.lines.length + 0.3);
        ctx.fillStyle = scene.fg;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = `800 ${Math.floor(lineHeight * 0.8)}px Geist, Arial, sans-serif`;
        scene.lines.forEach((line, i) => {
            const y = (rows * 0.9 - lineHeight * scene.lines.length) / 2 + lineHeight * (i + 0.5);
            ctx.fillText(line, cols / 2, y, cols * 0.92);
        });
        return;
    }

    if (scene.type === 'bars') {
        // Composição de "anúncio": blocos de cor que sobem em ritmo, como um spot animado
        const n = 6;
        const bw = cols / n;
        for (let i = 0; i < n; i++) {
            const phase = (Math.sin(t / 420 + i * 0.9) + 1) / 2;
            const h = rows * (0.25 + phase * 0.65);
            ctx.fillStyle = i % 3 === 0 ? ACCENT : i % 3 === 1 ? '#F4F1EC' : '#7A2E0C';
            ctx.fillRect(i * bw + 1, rows - h, bw - 2, h);
        }
        return;
    }

    ctx.fillStyle = scene.color ?? '#F4F1EC';
    ctx.textBaseline = 'middle';

    if (scene.type === 'text') {
        const lineHeight = rows / (scene.lines.length + 0.6);
        ctx.font = `700 ${Math.floor(lineHeight * 0.82)}px Geist, Arial, sans-serif`;
        ctx.textAlign = 'center';
        scene.lines.forEach((line, i) => {
            const y = (rows - lineHeight * scene.lines.length) / 2 + lineHeight * (i + 0.5);
            ctx.fillText(line, cols / 2, y, cols * 0.94);
        });
        return;
    }

    // Letreiro: o texto corre da direita para a esquerda em loop
    // Altura legível sem cortar: ~40% da tela (ou quase toda, em letreiros baixos)
    const size = rows <= 24 ? rows * 0.58 : rows * 0.4;
    ctx.font = `700 ${Math.floor(size)}px Geist, Arial, sans-serif`;
    ctx.textAlign = 'left';
    const gap = cols * 0.35;
    const width = ctx.measureText(scene.text).width + gap;
    const x = cols - ((t / 22) % width);
    ctx.fillText(scene.text, x, rows / 2);
    ctx.fillText(scene.text, x + width, rows / 2);
}

export const LedScreen = memo(function LedScreen({
    scenes,
    cols = 96,
    rows = 54,
    offset = 0,
    className,
    label = 'Telão de LED',
}: LedScreenProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Fontes de baixa resolução: cena atual e próxima (para a transição)
        const makeSource = () => {
            const c = document.createElement('canvas');
            c.width = cols;
            c.height = rows;
            return c.getContext('2d', { willReadFrequently: true })!;
        };
        const current = makeSource();
        const next = makeSource();

        let index = 0;
        let sceneStart = performance.now() + offset;
        let transitionStart = -1;
        let raf = 0;
        let paintedIndex = -1;
        let needsPaint = true;
        let visible = true;
        let cell = 0;
        let width = 0;
        let height = 0;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = rect.width;
            height = rect.height;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            cell = Math.min(width / cols, height / rows);
        };

        const paint = (now: number) => {
            const scene = scenes[index];
            drawScene(current, scene, cols, rows, now);
            const a = current.getImageData(0, 0, cols, rows).data;

            let b: Uint8ClampedArray | null = null;
            let sweep = -1;
            if (transitionStart >= 0) {
                const progress = Math.min((now - transitionStart) / TRANSITION_MS, 1);
                drawScene(next, scenes[(index + 1) % scenes.length], cols, rows, now);
                b = next.getImageData(0, 0, cols, rows).data;
                sweep = progress * (rows + 6);
            }

            ctx.clearRect(0, 0, width, height);
            const offsetX = (width - cell * cols) / 2;
            const offsetY = (height - cell * rows) / 2;
            const radius = cell * 0.36;

            for (let y = 0; y < rows; y++) {
                // Linhas acima da varredura já mostram a cena nova; a faixa da varredura brilha mais
                const useNext = b !== null && y < sweep;
                const band = b !== null && Math.abs(y - sweep) < 2.5;
                const src = useNext ? b! : a;
                for (let x = 0; x < cols; x++) {
                    const i = (y * cols + x) * 4;
                    const alpha = src[i + 3] / 255;
                    let r = OFF_LED[0] + (src[i] - OFF_LED[0]) * alpha;
                    let g = OFF_LED[1] + (src[i + 1] - OFF_LED[1]) * alpha;
                    let bl = OFF_LED[2] + (src[i + 2] - OFF_LED[2]) * alpha;
                    if (band) { r = Math.min(255, r + 70); g = Math.min(255, g + 50); bl = Math.min(255, bl + 40); }
                    ctx.fillStyle = `rgb(${r | 0},${g | 0},${bl | 0})`;
                    ctx.beginPath();
                    ctx.arc(offsetX + x * cell + cell / 2, offsetY + y * cell + cell / 2, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        };

        const tick = (now: number) => {
            raf = 0;
            const scene = scenes[index];
            const hold = scene.hold ?? (scene.type === 'ticker' ? 6500 : 3800);

            if (transitionStart < 0 && scenes.length > 1 && now - sceneStart > hold) {
                transitionStart = now;
            }
            if (transitionStart >= 0 && now - transitionStart >= TRANSITION_MS) {
                index = (index + 1) % scenes.length;
                transitionStart = -1;
                sceneStart = now;
            }

            // Cenas estáticas (logo e texto) só são redesenhadas quando trocam ou no resize
            const animated = transitionStart >= 0 || scene.type === 'ticker' || scene.type === 'bars';
            if (animated || paintedIndex !== index || needsPaint) {
                paint(now);
                paintedIndex = transitionStart >= 0 ? -1 : index;
                needsPaint = false;
            }
            if (visible && !document.hidden) raf = requestAnimationFrame(tick);
        };

        const start = () => {
            if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
        };

        resize();
        const ro = new ResizeObserver(() => { resize(); needsPaint = true; if (reduceMotion) paint(0); });
        ro.observe(canvas);

        loadLogo()
            .catch(() => undefined)
            .then(() => {
                if (reduceMotion) {
                    // Quadro único e estático: a cena do logo (ou a primeira)
                    index = Math.max(0, scenes.findIndex((s) => s.type === 'logo'));
                    paint(0);
                    return;
                }
                start();
            });

        const io = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible && !reduceMotion) start();
        });
        io.observe(canvas);
        const onVisibility = () => { if (!reduceMotion) start(); };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            io.disconnect();
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [scenes, cols, rows, offset]);

    return <canvas ref={canvasRef} role="img" aria-label={label} className={className} />;
});
