import { ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { crmBtn, eyebrowCrm } from './tokens';

/*
 * Peças visuais das áreas internas (CRM e painel do gestor). Usam os tokens `brand-*`, que trocam entre claro e escuro
 * (classe `dashboard-light`), e seguem a linha do site: cantos retos, rótulos em
 * mono e o laranja só onde há ação ou destaque.
 */

/** Cabeçalho padrão das telas do CRM. */
export function CrmPage({ eyebrow, title, description, actions, children, wide }: {
    eyebrow: string;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    /** Telas como o funil usam a largura toda. */
    wide?: boolean;
}) {
    return (
        <div className={`mx-auto flex w-full flex-col gap-6 ${wide ? 'max-w-none' : 'max-w-7xl'}`}>
            <header className="flex flex-col gap-4 border-b border-brand-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <p className={eyebrowCrm}>{eyebrow}</p>
                    <h1 className="mt-2 text-2xl font-light uppercase tracking-tight text-brand-text md:text-3xl">{title}</h1>
                    {description && <p className="mt-2 max-w-[60ch] text-sm text-brand-muted">{description}</p>}
                </div>
                {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
            </header>
            {children}
        </div>
    );
}

/** Bloco com borda e título opcional. */
export function Panel({ title, action, children, className = '', bodyClassName = '' }: {
    title?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
}) {
    return (
        <section className={`flex flex-col border border-brand-border bg-brand-surface ${className}`}>
            {title && (
                <div className="flex items-center justify-between gap-3 border-b border-brand-border px-5 py-3.5">
                    <h2 className="text-sm font-semibold text-brand-text">{title}</h2>
                    {action}
                </div>
            )}
            <div className={bodyClassName}>{children}</div>
        </section>
    );
}

/** Número de destaque (KPIs). */
export function Stat({ label, value, hint, accent }: { label: string; value: ReactNode; hint?: string; accent?: boolean }) {
    return (
        <div className="flex flex-col justify-between gap-3 border border-brand-border bg-brand-surface p-5">
            <p className={eyebrowCrm}>{label}</p>
            <div>
                <p className={`font-mono text-2xl tracking-tight md:text-[1.75rem] ${accent ? 'text-brand-neon' : 'text-brand-text'}`}>{value}</p>
                {hint && <p className="mt-1 text-xs text-brand-muted">{hint}</p>}
            </div>
        </div>
    );
}

type Tone = 'neutral' | 'accent' | 'muted' | 'danger' | 'success';
const toneClass: Record<Tone, string> = {
    neutral: 'border-brand-border text-brand-text',
    accent: 'border-brand-neon/40 bg-brand-neon/10 text-brand-neon',
    muted: 'border-brand-border text-brand-muted',
    danger: 'border-red-500/30 bg-red-500/10 text-red-500',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
    return <span className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-medium ${toneClass[tone]}`}>{children}</span>;
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-2 border border-dashed border-brand-border p-8">
            <p className="text-base font-medium text-brand-text">{title}</p>
            {text && <p className="max-w-[52ch] text-sm text-brand-muted">{text}</p>}
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}

export function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse bg-brand-border/50 ${className}`} />;
}

export function Field({ label, htmlFor, hint, children, className = '' }: {
    label: string;
    htmlFor?: string;
    hint?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={className}>
            <label htmlFor={htmlFor} className="mb-1.5 block text-sm text-brand-text">{label}</label>
            {children}
            {hint && <p className="mt-1.5 text-xs text-brand-muted">{hint}</p>}
        </div>
    );
}

/**
 * Janela de diálogo: folha que sobe de baixo no celular e caixa central no desktop.
 * Fecha no Esc, no fundo e no X; trava a rolagem da página enquanto aberta.
 */
export function Sheet({ open, onClose, title, eyebrow, children, footer, size = 'md' }: {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    eyebrow?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}) {
    useEscapeKey(open, onClose);
    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previous; };
    }, [open]);

    const width = size === 'sm' ? 'md:max-w-sm' : size === 'lg' ? 'md:max-w-3xl' : 'md:max-w-lg';

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 md:items-center md:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={typeof title === 'string' ? title : undefined}
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 40, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`flex max-h-[92dvh] w-full flex-col border-t border-brand-border bg-brand-surface text-brand-text md:border ${width}`}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-brand-border px-5 py-4">
                            <div className="min-w-0">
                                {eyebrow && <p className={eyebrowCrm}>{eyebrow}</p>}
                                <h2 className="mt-1 truncate text-lg font-medium">{title}</h2>
                            </div>
                            <button type="button" aria-label="Fechar" onClick={onClose} className={crmBtn.icon}><X className="h-5 w-5" strokeWidth={1.75} /></button>
                        </div>
                        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-5">{children}</div>
                        {footer && <div className="flex flex-col-reverse gap-2 border-t border-brand-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">{footer}</div>}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** Confirmação para ações destrutivas. */
export function ConfirmSheet({ open, title, text, confirmLabel = 'Excluir', busy, onConfirm, onClose }: {
    open: boolean;
    title: string;
    text: string;
    confirmLabel?: string;
    busy?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}) {
    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={title}
            size="sm"
            footer={<>
                <button type="button" onClick={onClose} className={crmBtn.secondary}>Cancelar</button>
                <button type="button" onClick={onConfirm} disabled={busy} className={crmBtn.danger}>{busy ? 'Excluindo…' : confirmLabel}</button>
            </>}
        >
            <p className="text-sm leading-relaxed text-brand-muted">{text}</p>
        </Sheet>
    );
}

