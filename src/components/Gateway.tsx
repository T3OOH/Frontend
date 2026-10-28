import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

type Side = 'ooh' | 'solution';

const SIDES: Record<Side, { to: string; logo: string; logoAlt: string; eyebrow: string; title: string; text: string; cta: string }> = {
    ooh: {
        to: '/',
        logo: '/t3-logo.webp',
        logoAlt: 'T3 OOH',
        eyebrow: 'Mídia OOH · Goiânia e região',
        title: 'Anuncie nos telões da cidade',
        text: 'Pontos de LED nos corredores de maior fluxo. Escolha no mapa e receba o orçamento.',
        cta: 'Entrar na T3 OOH',
    },
    solution: {
        to: '/solution',
        logo: '/t3-solution-3d.webp',
        logoAlt: 'T3 Solution',
        eyebrow: 'Painéis de LED sob medida',
        title: 'Uma tela de LED do seu tamanho',
        text: 'Projeto, fornecimento e instalação para fachadas, empresas, lojas e casas.',
        cta: 'Entrar na T3 Solution',
    },
};

const spring = { type: 'spring', stiffness: 170, damping: 26 } as const;

/**
 * Tela de entrada: escolha entre a T3 OOH e a T3 Solution.
 * O lado sob o mouse (ou com foco do teclado) se expande; no celular o primeiro toque
 * expande e o segundo entra. A escolha preenche a tela e abre o site.
 */
export function Gateway({ onDone }: { onDone: () => void }) {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState<Side | null>(null);
    const [chosen, setChosen] = useState<Side | null>(null);
    const [touch] = useState(() => window.matchMedia('(hover: none)').matches);

    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previous; };
    }, []);

    // Esc entra direto na T3 OOH (atalho para quem só quer o site)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') choose('ooh', true); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    const choose = (side: Side, direct = false) => {
        if (chosen) return;
        // Toque: o primeiro toque só expande o lado
        if (touch && !direct && hovered !== side) { setHovered(side); return; }
        setChosen(side);
        setTimeout(() => {
            navigate(SIDES[side].to, { replace: true });
            onDone();
        }, 650);
    };

    const grow = (side: Side) => {
        if (chosen) return chosen === side ? 1 : 0;
        if (!hovered) return 0.5;
        return hovered === side ? 0.68 : 0.32;
    };

    return (
        <motion.div
            className="fixed inset-0 z-[10000] flex flex-col bg-ink-950 md:flex-row"
            role="dialog"
            aria-modal="true"
            aria-label="Escolha a empresa da T3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
            onMouseLeave={() => !touch && setHovered(null)}
        >
            {(['ooh', 'solution'] as Side[]).map((side, i) => {
                const s = SIDES[side];
                const active = hovered === side || chosen === side;
                const hidden = chosen !== null && chosen !== side;
                return (
                    <motion.button
                        key={side}
                        type="button"
                        onClick={() => choose(side)}
                        onMouseEnter={() => !touch && setHovered(side)}
                        onFocus={() => setHovered(side)}
                        animate={{ flexGrow: grow(side), opacity: hidden ? 0 : 1, y: 0 }}
                        initial={{ flexGrow: 0.5, y: i === 0 ? -40 : 40, opacity: 0 }}
                        transition={spring}
                        style={{ flexBasis: 0 }}
                        aria-label={`${s.logoAlt}: ${s.title}`}
                        className={`group relative isolate flex min-h-0 min-w-0 flex-col justify-end overflow-hidden text-left focus:outline-none ${i === 0 ? 'border-b border-white/10 md:border-b-0 md:border-r' : ''}`}
                    >
                        {/* ============================ FUNDO ============================ */}
                        {side === 'ooh' ? (
                            <motion.img
                                src="/cidade-t3-noite.webp"
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 -z-10 h-full w-full object-cover object-[30%_60%]"
                                animate={{ scale: active ? 1.08 : 1.02 }}
                                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                            />
                        ) : (
                            // Avenida de Goiânia com o letreiro "T3 Solution" à direita: o enquadramento
                            // puxa para a direita para o letreiro aparecer mesmo com o lado recolhido
                            <motion.img
                                src="/solution-cidade.webp"
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 -z-10 h-full w-full object-cover object-[82%_60%]"
                                animate={{ scale: active ? 1.08 : 1.02 }}
                                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                            />
                        )}
                        <div
                            className={`absolute inset-0 -z-10 transition-opacity duration-500 ${active ? 'opacity-70' : 'opacity-90'}`}
                            style={{ background: 'linear-gradient(to top, rgba(11,11,12,0.98) 0%, rgba(11,11,12,0.7) 45%, rgba(11,11,12,0.25) 100%)' }}
                            aria-hidden="true"
                        />
                        <span className={`absolute inset-x-0 bottom-0 h-1 origin-left bg-brand-neon transition-transform duration-500 ${active ? 'scale-x-100' : 'scale-x-0'}`} aria-hidden="true" />

                        {/* ============================ CONTEÚDO ============================ */}
                        <div className="relative flex w-full flex-col gap-4 p-6 pb-8 md:p-12 md:pb-14">
                            <img src={s.logo} alt="" className={`h-auto object-contain object-left ${side === 'ooh' ? 'w-20 md:w-28' : 'w-44 md:w-64'}`} />
                            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-300">{s.eyebrow}</p>
                            <h2 className="max-w-[14ch] text-3xl font-light uppercase leading-[0.95] tracking-tight text-ink-100 md:text-5xl xl:text-6xl">{s.title}</h2>
                            <AnimatePresence initial={false}>
                                {active && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="max-w-[44ch] leading-relaxed text-ink-300">{s.text}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <span className={`mt-2 inline-flex w-fit items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors ${active ? 'bg-brand-neon text-ink-950' : 'border border-white/25 text-ink-100'}`}>
                                {touch && !active ? 'Tocar para ver' : s.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </span>
                        </div>
                    </motion.button>
                );
            })}

            <p className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.3em] text-ink-400 md:top-8">
                Escolha onde entrar
            </p>
        </motion.div>
    );
}
