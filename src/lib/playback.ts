/**
 * Tempo de reprodução de cada inserção do anúncio no painel, em segundos.
 * 15 → "15 s"; 90 → "1 min 30 s"; vazio → null (a tela mostra "—").
 */
export function formatPlayback(seconds?: number | null): string | null {
    if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return null;
    const s = Math.round(seconds);
    if (s < 60) return `${s} s`;
    const min = Math.floor(s / 60);
    const rest = s % 60;
    return rest ? `${min} min ${rest} s` : `${min} min`;
}

/** Valor do campo do formulário → número para a API (null quando vazio). Inválido vira NaN. */
export function parsePlaybackInput(value: string): number | null {
    const v = value.trim();
    if (!v) return null;
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 3600 ? n : Number.NaN;
}
