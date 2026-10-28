import { ReactNode } from 'react';
import { LedScreen, LedScene } from '@/components/led/LedScreen';

const DEFAULT_SCENES: LedScene[] = [
    { type: 'ticker', text: 'SEU ANÚNCIO NOS TELÕES DA T3  •  PLANO ANUAL COM ATÉ 30% DE DESCONTO', hold: 12000 },
    { type: 'logo', hold: 2600 },
];

interface CtaBandProps {
    title: ReactNode;
    /** Botões e links da chamada (use `btnDark` e bordas escuras sobre o laranja). */
    children: ReactNode;
    scenes?: LedScene[];
}

/** Chamada final das páginas públicas: letreiro de LED sobre a faixa laranja. */
export function CtaBand({ title, children, scenes = DEFAULT_SCENES }: CtaBandProps) {
    return (
        <section className="bg-brand-neon text-ink-950">
            <div className="bg-ink-950 p-2">
                <LedScreen scenes={scenes} cols={240} rows={18} label="Letreiro de LED" className="block h-14 w-full md:h-20" />
            </div>
            <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-end gap-10 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[1fr_auto]">
                <h2 className="text-5xl font-semibold uppercase leading-[0.9] tracking-tighter md:text-8xl">{title}</h2>
                <div className="flex flex-wrap gap-3">{children}</div>
            </div>
        </section>
    );
}

/** Botão secundário sobre a faixa laranja. */
export const btnOnOrange = 'inline-flex items-center border border-ink-950/40 px-6 py-4 text-sm font-semibold text-ink-950 transition-colors hover:border-ink-950 active:translate-y-px';
