/**
 * Converte "Texto Com Iniciais Maiúsculas Em Tudo" (comum no conteúdo cadastrado no painel)
 * para frase normal. Siglas (T3, SOLUTION) e textos que já estão em frase normal ficam como estão.
 */
export function sentenceCase(text?: string | null): string {
    if (!text) return '';
    const words = text.split(/\s+/).filter(Boolean);
    const capitalized = words.filter((w) => /^[A-ZÀ-Ý][a-zà-ÿ]/.test(w)).length;
    if (words.length < 4 || capitalized / words.length < 0.6) return text;

    let start = true;
    return words
        .map((word) => {
            const out = start || /^[A-Z0-9]{2,}/.test(word) ? word : word.toLowerCase();
            start = /[.!?]$/.test(word) && !word.endsWith('...');
            return out;
        })
        .join(' ');
}
