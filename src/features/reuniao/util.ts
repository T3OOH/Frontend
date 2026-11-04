const MATIZES = [8, 28, 46, 98, 150, 172, 192, 212, 336];

/** Cor estável por pessoa (a partir do id), sem roxos. */
export function corDaPessoa(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return `hsl(${MATIZES[h % MATIZES.length]} 42% 36%)`;
}

export function iniciais(nome: string) {
    const p = nome.trim().split(/\s+/).filter(Boolean);
    if (p.length === 0) return '?';
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export const hora = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
