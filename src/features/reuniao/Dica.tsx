import type { ReactNode } from 'react';

/** Tooltip simples: aparece acima do botão ao passar o mouse ou focar com o teclado. */
export function Dica({ texto, atalho, children }: { texto: string; atalho?: string; children: ReactNode }) {
    return (
        <div className="relative group">
            {children}
            <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 whitespace-nowrap bg-ink-950 border border-ink-700 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-30"
            >
                {texto}
                {atalho && <kbd className="ml-2 font-mono text-[10px] text-ink-400">{atalho}</kbd>}
            </span>
        </div>
    );
}
