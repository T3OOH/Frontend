import { useTheme } from '@/contexts/ThemeContext';

/** Peças de gráfico das áreas internas (Tráfego, Relatórios): um tom só, marcas finas, texto em cor de texto. */

/** Cor da série: laranja da marca; no tema claro um tom mais escuro (contraste ≥ 3:1 sobre branco). */
export function useMarkColor() {
    return useTheme().theme === 'light' ? '#E05200' : '#FF5E00';
}

/** Topo "redondo" do eixo: 4, 10, 20, 300, 4000... */
export function niceMax(v: number) {
    if (v <= 4) return 4;
    const p = 10 ** Math.floor(Math.log10(v));
    return Math.ceil(v / p) * p;
}

const int = (v: number) => v.toLocaleString('pt-BR');

/** Lista com barra proporcional (magnitude em um só tom). */
export function BarList({ rows, empty, format = int }: {
    rows: { label: string; hint?: string; value: number }[];
    empty: string;
    format?: (v: number) => string;
}) {
    const color = useMarkColor();
    const max = Math.max(...rows.map((r) => r.value), 1);
    if (!rows.length) return <p className="text-sm text-brand-muted">{empty}</p>;
    return (
        <ul className="flex flex-col gap-3">
            {rows.map((r) => (
                <li key={r.label}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-brand-text" title={r.label}>{r.label}{r.hint && <span className="ml-2 text-xs text-brand-muted">{r.hint}</span>}</span>
                        <span className="shrink-0 font-mono text-brand-text">{format(r.value)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 bg-brand-background">
                        <div className="h-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
                    </div>
                </li>
            ))}
        </ul>
    );
}

/** Baixa uma planilha CSV (separador ";" e BOM, para o Excel em português abrir certo). */
export function downloadCsv(filename: string, head: string[], rows: (string | number)[][]) {
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}
