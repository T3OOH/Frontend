/* Classes e utilitários do CRM (separados dos componentes para o fast refresh). */

export const crmInput =
    'w-full border border-brand-border bg-brand-background px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/70 transition-colors focus:border-brand-neon focus:outline-none disabled:opacity-60';

export const crmBtn = {
    primary: 'inline-flex items-center justify-center gap-2 bg-brand-neon px-4 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-brand-neonHover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50',
    secondary: 'inline-flex items-center justify-center gap-2 border border-brand-border bg-brand-surface px-4 py-2.5 text-sm font-medium text-brand-text transition-colors hover:border-brand-muted active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50',
    ghost: 'inline-flex items-center justify-center gap-2 px-3 py-2 text-sm text-brand-muted transition-colors hover:bg-brand-background hover:text-brand-text disabled:opacity-50',
    danger: 'inline-flex items-center justify-center gap-2 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 active:translate-y-px disabled:opacity-50',
    icon: 'inline-flex h-9 w-9 items-center justify-center text-brand-muted transition-colors hover:bg-brand-background hover:text-brand-text',
};

export const eyebrowCrm = 'font-mono text-[11px] uppercase tracking-[0.2em] text-brand-muted';

export const formatBRL = (value: number | string) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

export const formatDate = (value?: string | Date | null) =>
    value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '—';

export const initials = (name?: string) =>
    (name || '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '—';

/** Link de WhatsApp com DDI 55 quando o número veio sem ele. */
export function whatsappUrl(phone: string, text: string) {
    let digits = phone.replace(/\D/g, '');
    if (!digits.startsWith('55') && digits.length <= 11) digits = `55${digits}`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
