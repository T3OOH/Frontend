import { memo, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Vídeo de fundo: Goiânia em golden hour, com a logo da T3 nos telões (1280×720, 10 s,
 * H.264 com índice no início). Toca uma vez e para no último quadro.
 * O pôster é um quadro do próprio vídeo: aparece enquanto ele carrega e no lugar dele
 * quando o vídeo não deve tocar.
 */
const BACKGROUND_VIDEO = {
    mp4: '/video/t3-cidade.mp4',
    poster: '/video/t3-cidade-poster.webp',
};

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
}

export const PhotoCity = memo(function PhotoCity({ veil = 0.55, position = 'fixed' }: PhotoCityProps) {
    // Perfil → Aparência: "imagem parada" ou "menos movimento" também desligam o vídeo
    const { preferences } = useTheme();
    const [deviceStill] = useState(deviceWantsStill);
    const playVideo = !deviceStill && preferences.background === 'video' && preferences.motion === 'full';
    const [videoReady, setVideoReady] = useState(false);

    // Rolagem: aproximação lenta da câmera (zoom) e leve subida
    const { scrollY } = useScroll();
    const scale = useTransform(scrollY, [0, 1600], [1.04, 1.22]);
    const y = useTransform(scrollY, [0, 1600], [0, -60]);

    const media = 'absolute inset-0 h-full w-full origin-[50%_62%] object-cover object-[80%_50%] md:object-center';

    return (
        <div
            aria-hidden="true"
            className={`pointer-events-none inset-0 -z-10 overflow-hidden bg-ink-950 ${position === 'fixed' ? 'fixed h-[100dvh]' : 'absolute'}`}
        >
            {/* Quadro do vídeo: base enquanto carrega e fundo fixo quando o vídeo não toca */}
            <motion.img
                src={BACKGROUND_VIDEO.poster}
                alt=""
                style={{ scale, y }}
                className={`${media} select-none`}
                fetchPriority="high"
            />

            {playVideo && (
                <motion.video
                    style={{ scale, y }}
                    // Entra suave sobre o pôster; sem "loop": no fim fica parado no último quadro
                    className={`${media} transition-opacity duration-1000 ease-out ${videoReady ? 'opacity-100' : 'opacity-0'}`}
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    poster={BACKGROUND_VIDEO.poster}
                    onPlaying={() => setVideoReady(true)}
                >
                    <source src={BACKGROUND_VIDEO.mp4} type="video/mp4" />
                </motion.video>
            )}

            {/* Véu de leitura: textos legíveis sobre a cidade */}
            <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(11,11,12,${Math.min(1, veil + 0.3)}) 0%, rgba(11,11,12,${veil}) 45%, rgba(11,11,12,${veil * 0.35}) 100%)` }} />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 to-transparent" />
        </div>
    );
});
