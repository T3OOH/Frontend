/** Região de um painel: a cidade (ou o estado, se a cidade faltar). */
const regionOf = (p: { city?: string | null; state?: string | null }) => (p.city || p.state || '').trim();

const byName = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

/**
 * Ordem do catálogo e das propostas: primeiro a região com mais painéis (ex.: todos de Goiânia),
 * depois as que têm menos. Empate entre regiões vai por ordem alfabética; dentro da região,
 * pelo nome do painel. Painéis sem cidade ficam no fim.
 */
export function sortByRegion<T extends { name: string; city?: string | null; state?: string | null }>(panels: T[]): T[] {
    const count = new Map<string, number>();
    for (const p of panels) count.set(regionOf(p), (count.get(regionOf(p)) ?? 0) + 1);
    return [...panels].sort((a, b) => {
        const ra = regionOf(a);
        const rb = regionOf(b);
        if (ra !== rb) {
            if (!ra) return 1;
            if (!rb) return -1;
            return (count.get(rb)! - count.get(ra)!) || byName(ra, rb);
        }
        return byName(a.name, b.name);
    });
}
