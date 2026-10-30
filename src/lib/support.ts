import { readSession } from './session';

/** WhatsApp do suporte técnico (recebe os erros do site). */
export const SUPPORT_WHATSAPP = '5562981877023';

export interface SupportIssue {
    /** O que a pessoa viu ou o erro técnico. */
    message: string;
    /** Código do registro (Gestão > Registros), quando o erro foi gravado. */
    code?: string | null;
    /** Página onde aconteceu (padrão: a atual). */
    page?: string;
}

/** Link do WhatsApp do suporte com o erro já escrito. */
export function supportUrl(issue: SupportIssue) {
    const user = readSession()?.user;
    const page = issue.page ?? (typeof window !== 'undefined' ? window.location.href : '');
    const lines = [
        'Olá! Preciso de suporte no site da T3 OOH.',
        '',
        `Erro: ${issue.message.slice(0, 400)}`,
        issue.code ? `Código: ${issue.code}` : null,
        `Página: ${page}`,
        `Quando: ${new Date().toLocaleString('pt-BR')}`,
        user ? `Usuário: ${user.name ?? ''}${user.email ? ` (${user.email})` : ''}` : null,
    ].filter((l) => l !== null);
    return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function openSupport(issue: SupportIssue) {
    window.open(supportUrl(issue), '_blank', 'noopener,noreferrer');
}
