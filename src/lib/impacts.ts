/** Converte textos de impacto ("700 mil", "1,2 milhão", "50k", "12000") em número. */
export const parseImpacts = (impactStr?: string | number): number => {
    if (!impactStr) return 0;
    if (typeof impactStr === 'number') return impactStr;
    const normalized = String(impactStr).toLowerCase().trim();
    const numMatch = normalized.match(/[\d.,]+/);
    if (!numMatch) return 0;
    
    let numStr = numMatch[0].replace(',', '.');
    // Milhões: "1,2 milhão", "3 milhões", "2 mi", "4m". Milhares: "700 mil", "50k".
    // (antes, qualquer "m" — inclusive de "mil" — era tratado como milhão)
    // Sem \b: o banco grava valores colados ao número, como "280mil/dia"
    if (/milh(ão|ao|ões|oes)|(?<![a-z])mi(?![a-z])|(?<![a-z])mm(?![a-z])|\d\s*m(?![a-z])/.test(normalized)) return parseFloat(numStr) * 1000000;
    if (/(?<![a-z])mil(?![a-z])|\d\s*k(?![a-z])/.test(normalized)) return parseFloat(numStr) * 1000;
    
    return parseInt(numStr.replace(/\./g, ''), 10);
};

/** Formata um número de impactos de forma curta, em pt-BR ("1,7 mi", "820 mil"). */
export function formatImpacts(value: number): string {
    if (!value) return '0';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',')} mi`;
    if (value >= 1_000) return `${Math.round(value / 1_000)} mil`;
    return String(value);
}
