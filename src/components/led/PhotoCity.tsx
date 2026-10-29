import { memo, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Vídeos de fundo (1280×720, 10 s, H.264 com índice no início). Tocam em loop: perto do fim,
 * uma segunda cópia começa do início e as duas se cruzam em fade, então a volta ao começo não
 * aparece como corte. O pôster é um quadro do próprio vídeo: aparece enquanto ele carrega e no
 * lugar dele quando o vídeo não deve tocar.
 */
export const BACKGROUND_VIDEOS = {
    /** Goiânia em golden hour, com a logo da T3 nos telões (site da T3 OOH). */
    cidade: { mp4: '/video/t3-cidade.mp4', poster: '/video/t3-cidade-poster.webp', position: 'object-[80%_50%] md:object-center' },
    /** Casa com piscina e o telão de LED da T3 Solution no terraço (página da T3 Solution). */
    solution: { mp4: '/video/t3-solution-casa.mp4', poster: '/video/t3-solution-casa-poster.webp', position: 'object-[64%_55%]' },
};
export type BackgroundVideo = (typeof BACKGROUND_VIDEOS)[keyof typeof BACKGROUND_VIDEOS];

/** Duração do cruzamento entre o fim do vídeo e o começo da próxima volta. */
const CROSSFADE_S = 1.2;

/**
 * Economia de dados, conexão 2G ou "reduzir movimento" do sistema: fica a imagem parada.
 * (3G não entra: a estimativa do navegador marca muita conexão boa como 3G.)
 */
const deviceWantsStill = () => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        Boolean(connection?.saveData) ||
        /(^|-)2g$/.test(connection?.effectiveType ?? '');
};

interface PhotoCityProps {
    /** Opacidade do véu escuro (0 = imagem pura, 1 = preto). */
    veil?: number;
    /** "fixed" para fundo da página inteira; "absolute" para preencher uma seção. */
    position?: 'fixed' | 'absolute';
    /** Vídeo do fundo (padrão: a cidade). */
    video?: BackgroundVideo;
}

export const PhotoCity = memo(function PhotoCity({ veil = 0.55, position = 'fixed', video = BACKGROUND_VIDEOS.cidade }: PhotoCityProps) {
    // Perfil → Aparência: "imagem parada" ou "menos movimento" também desligam o vídeo
    const { preferences } = useTheme();
    const [deviceStill] = useState(deviceWantsStill);
    const playVideo = !deviceStill && preferences.background === 'video' && preferences.motion === 'full';
    const [videoReady, setVideoReady] = useState(false);
    // Duas cópias do vídeo se revezam; "front" é a que está visível
    const videos = useRef<(HTMLVideoElement | null)[]>([null, null]);
    const [front, setFront] = useState(0);
    const swapping = useRef(false);

    /** A cópia visível perto do fim: a outra começa do início e as duas se cruzam em fade. */
    const onTime = (i: number) => {
        const current = videos.current[i];
        const next = videos.current[1 - i];
        if (i !== front || !current || !next || swapping.current || !current.duration) return;
        if (current.duration - current.currentTime > CROSSFADE_S) return;
        swapping.current = true;
        next.currentTime = 0;
        next.play()
            .then(() => setFront(1 - i))
            // Navegador recusou a segunda cópia: volta a mesma ao início (sem fade, mas sem parar)
            .catch(() => { current.currentTime = 0; current.play().catch(() => {}); })
            .finally(() => { swapping.current = false; });
    };

    // Rolagem: aproximação lenta da câmera (zoom) e leve subida
    const { scrollY } = useScroll();
    const scale = useTransform(scrollY, [0, 1600], [1.04, 1.22]);
    const y = useTransform(scrollY, [0, 1600], [0, -60]);

    const media = `absolute inset-0 h-full w-full origin-[50%_62%] object-cover ${video.position}`;

    return (
        <div
            aria-hidden="true"
            className={`pointer-events-none inset-0 -z-10 overflow-hidden bg-ink-950 ${position === 'fixed' ? 'fixed h-[100dvh]' : 'absolute'}`}
        >
            {/* Quadro do vídeo: base enquanto carrega e fundo fixo quando o vídeo não toca */}
            <motion.img
                src={video.poster}
                alt=""
                style={{ scale, y }}
                className={`${media} select-none`}
                fetchPriority="high"
            />

            {playVideo && [0, 1].map((i) => (
                <motion.video
                    key={i}
                    ref={(el: HTMLVideoElement | null) => { videos.current[i] = el; }}
                    style={{ scale, y, transitionDuration: `${CROSSFADE_S}s` }}
                    // Entra suave sobre o pôster; depois as duas cópias se alternam em fade
                    className={`${media} transition-opacity ease-in-out ${videoReady && front === i ? 'opacity-100' : 'opacity-0'}`}
                    autoPlay={i === 0}
                    muted
                    playsInline
                    preload={i === 0 ? 'auto' : 'metadata'}
                    poster={video.poster}
                    onPlaying={() => { if (i === 0) setVideoReady(true); }}
                    onTimeUpdate={() => onTime(i)}
                    // A cópia que saiu termina escondida e volta ao início para a próxima vez
                    onEnded={(e) => { if (front !== i) e.currentTarget.currentTime = 0; }}
                >
                    <source src={video.mp4} type="video/mp4" />
                </motion.video>
            ))}

            {/* Véu de leitura: textos legíveis sobre a cidade */}
            <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(11,11,12,${Math.min(1, veil + 0.3)}) 0%, rgba(11,11,12,${veil}) 45%, rgba(11,11,12,${veil * 0.35}) 100%)` }} />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 to-transparent" />
        </div>
    );
});
