import type { ReactNode } from 'react';

interface Props {
    titulo: string;
    texto?: string;
    carregando?: boolean;
    children?: ReactNode;
}

/** Tela cheia de aviso: carregando, erro de acesso, reunião cheia, saída e fim da reunião. */
export function TelaMensagem({ titulo, texto, carregando, children }: Props) {
    return (
        <div className="min-h-screen w-full bg-ink-950 text-ink-100 font-sans flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                {carregando && <div className="mx-auto mb-6 w-8 h-8 border-4 border-brand-neon border-t-transparent rounded-full animate-spin" role="status" aria-label="Carregando" />}
                <h1 className="text-2xl font-semibold text-white">{titulo}</h1>
                {texto && <p className="mt-3 text-sm text-ink-300 leading-relaxed">{texto}</p>}
                {children && <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">{children}</div>}
            </div>
        </div>
    );
}

export const botaoPrimario = 'px-6 py-3.5 bg-brand-neon hover:bg-brand-neonHover text-ink-950 text-xs font-black uppercase tracking-widest transition-colors';
export const botaoSecundario = 'px-6 py-3.5 bg-ink-800 hover:bg-ink-700 text-white text-xs font-black uppercase tracking-widest transition-colors';
