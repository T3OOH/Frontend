import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { PhotoCity } from '@/components/led/PhotoCity';


interface AuthShellProps {
    eyebrow: string;
    title: ReactNode;
    subtitle?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    /** Formulários longos (cadastro) usam um painel mais largo. */
    wide?: boolean;
}

/**
 * Layout das telas de acesso: painel sólido com o formulário à esquerda e a cidade
 * com um telão da T3 à direita (só em telas grandes).
 */
export function AuthShell({ eyebrow, title, subtitle, children, footer, wide }: AuthShellProps) {
    return (
        <div className="relative isolate min-h-[100dvh] text-ink-100">
            <PhotoCity />

            <div className="grid min-h-[100dvh] grid-cols-1 lg:grid-cols-[auto_1fr]">
                <motion.section
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    className={`flex min-h-[100dvh] w-full flex-col bg-ink-950 px-6 py-8 sm:px-10 lg:border-r lg:border-white/[0.08] ${wide ? 'lg:w-[640px]' : 'lg:w-[520px]'}`}
                >
                    <div className="flex items-center justify-between">
                        <Link to="/" aria-label="T3 OOH, página inicial" className="-m-1.5 p-1.5">
                            <img src="/t3-logo.webp" alt="" className="h-9 w-auto" />
                        </Link>
                        <Link to="/" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100">
                            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Voltar ao site
                        </Link>
                    </div>

                    <div className="flex flex-1 flex-col justify-center py-12">
                        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-400">{eyebrow}</p>
                        <h1 className="text-4xl font-light uppercase leading-[0.95] tracking-tight sm:text-5xl">{title}</h1>
                        {subtitle && <p className="mt-5 max-w-[44ch] leading-relaxed text-ink-400">{subtitle}</p>}
                        <div className="mt-10">{children}</div>
                    </div>

                    {footer && <div className="border-t border-white/[0.08] pt-6 text-sm text-ink-400">{footer}</div>}
                </motion.section>

                                {/* Lado da cidade: a própria foto, com telões e trânsito animados */}
                <div className="relative hidden items-end justify-between p-10 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-300 lg:flex">
                    <span>Rede T3 de painéis</span>
                    <span>Goiânia · GO</span>
                </div>
            </div>
        </div>
    );
}

/** Estilo dos campos nas telas de acesso. */
export const authInput = 'h-12 border-white/10 bg-ink-900 text-ink-100 placeholder:text-ink-500 focus:border-brand-neon';
