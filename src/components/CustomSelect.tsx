import { KeyboardEvent, ReactNode, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
    /** Texto menor ao lado do rótulo (ex.: cidade, quantidade). */
    hint?: string;
    disabled?: boolean;
}

export interface CustomSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    /** Liga o <label htmlFor> da página ao campo. */
    id?: string;
    placeholder?: string;
    icon?: ReactNode;
    disabled?: boolean;
    /** Validação nativa do formulário (campo vazio bloqueia o envio). */
    required?: boolean;
    name?: string;
    /** "app": Gestão e CRM (segue o tema claro/escuro). "site": páginas públicas (escuras). */
    tone?: 'app' | 'site';
    /** Classes extras do botão (altura, largura etc.). */
    className?: string;
    maxHeight?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
}

const TONES = {
    app: {
        trigger: 'border-brand-border bg-brand-background px-3.5 py-2.5 text-brand-text',
        open: 'border-brand-neon',
        hover: 'hover:border-brand-muted',
        placeholder: 'text-brand-muted/70',
        icon: 'text-brand-muted',
        menu: 'border-brand-border bg-brand-surface',
        option: 'text-brand-text',
        active: 'bg-brand-background',
        hint: 'text-brand-muted',
    },
    site: {
        trigger: 'border-white/15 bg-ink-900 px-4 py-3.5 text-ink-100',
        open: 'border-brand-neon',
        hover: 'hover:border-white/30',
        placeholder: 'text-ink-500',
        icon: 'text-ink-400',
        menu: 'border-white/15 bg-ink-900',
        option: 'text-ink-100',
        active: 'bg-white/[0.06]',
        hint: 'text-ink-500',
    },
} as const;

/**
 * Seleção no padrão da interface (substitui o <select> nativo).
 * Acessível como combobox/listbox: setas, Enter/Espaço, Esc, Home/End e busca por letra.
 * A lista abre em portal (não é cortada por modais e painéis com rolagem) e vira para cima
 * quando falta espaço embaixo.
 */
export function CustomSelect({
    options,
    value,
    onChange,
    id,
    placeholder = 'Selecione…',
    icon,
    disabled = false,
    required,
    name,
    tone = 'app',
    className = '',
    maxHeight = 'max-h-64',
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
}: CustomSelectProps) {
    const t = TONES[tone];
    const autoId = useId();
    const buttonId = id ?? `select-${autoId}`;
    const listId = `${buttonId}-lista`;
    const buttonRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxH: number } | null>(null);
    const typed = useRef({ text: '', at: 0 });

    const selectedIndex = options.findIndex((o) => o.value === value);
    const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;
    const enabledIndexes = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);

    // Posição da lista: abaixo do botão, ou acima quando não cabe
    const place = useCallback(() => {
        const r = buttonRef.current?.getBoundingClientRect();
        if (!r) return;
        const below = window.innerHeight - r.bottom - 12;
        const above = r.top - 12;
        const up = below < 220 && above > below;
        // Botões estreitos (celular, colunas) ganham uma lista de pelo menos 220 px, sem sair da tela
        const width = Math.min(Math.max(r.width, 220), window.innerWidth - 16);
        const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
        setPos({ left, width, ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }), maxH: Math.max(160, Math.min(320, up ? above : below)) });
    }, []);

    useLayoutEffect(() => {
        if (!open) return;
        place();
        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true);
        return () => {
            window.removeEventListener('resize', place);
            window.removeEventListener('scroll', place, true);
        };
    }, [open, place]);

    // Fecha ao clicar fora
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node;
            if (!buttonRef.current?.contains(target) && !listRef.current?.contains(target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('touchstart', onDown);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('touchstart', onDown);
        };
    }, [open]);

    // Mantém a opção ativa visível
    useEffect(() => {
        if (open && active >= 0) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [open, active]);

    const openList = (start?: number) => {
        if (disabled) return;
        setActive(start ?? (selectedIndex >= 0 ? selectedIndex : enabledIndexes[0] ?? -1));
        setOpen(true);
    };
    const close = (focus = true) => {
        setOpen(false);
        if (focus) buttonRef.current?.focus();
    };
    const choose = (i: number) => {
        const opt = options[i];
        if (!opt || opt.disabled) return;
        if (opt.value !== value) onChange(opt.value);
        close();
    };
    const move = (delta: number) => {
        if (!enabledIndexes.length) return;
        const pos = enabledIndexes.indexOf(active);
        const next = pos < 0 ? 0 : Math.min(enabledIndexes.length - 1, Math.max(0, pos + delta));
        setActive(enabledIndexes[next]);
    };

    // Digitar letras pula para a primeira opção que começa com elas
    const typeAhead = (key: string) => {
        const now = Date.now();
        typed.current = { text: (now - typed.current.at > 700 ? '' : typed.current.text) + key.toLowerCase(), at: now };
        const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        const found = options.findIndex((o) => !o.disabled && norm(o.label).startsWith(norm(typed.current.text)));
        if (found >= 0) {
            if (open) setActive(found);
            else if (options[found].value !== value) onChange(options[found].value);
        }
    };

    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!open) openList(); else move(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (!open) openList(); else move(-1);
                break;
            case 'Home':
                if (open) { e.preventDefault(); setActive(enabledIndexes[0] ?? -1); }
                break;
            case 'End':
                if (open) { e.preventDefault(); setActive(enabledIndexes[enabledIndexes.length - 1] ?? -1); }
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (open && active >= 0) choose(active); else openList();
                break;
            case 'Escape':
                if (open) { e.preventDefault(); close(); }
                break;
            case 'Tab':
                if (open) close(false);
                break;
            default:
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeAhead(e.key);
        }
    };

    // Dentro da Gestão/CRM no tema claro, a lista precisa herdar as variáveis do tema
    const portalTarget = typeof document !== 'undefined' ? (buttonRef.current?.closest('.dashboard-light') as HTMLElement | null) ?? document.body : null;

    return (
        <div className={`relative w-full text-sm ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
            <button
                ref={buttonRef}
                id={buttonId}
                type="button"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
                aria-label={ariaLabel}
                aria-describedby={ariaDescribedBy}
                aria-required={required || undefined}
                disabled={disabled}
                onClick={() => (open ? close() : openList())}
                onKeyDown={onKeyDown}
                className={`flex w-full items-center justify-between gap-3 border text-left transition-colors focus:outline-none focus-visible:border-brand-neon disabled:pointer-events-none ${t.trigger} ${open ? t.open : t.hover} ${className}`}
            >
                <span className="flex min-w-0 items-center gap-2.5">
                    {icon && <span className={`shrink-0 ${open ? 'text-brand-neon' : t.icon}`}>{icon}</span>}
                    <span className={`truncate ${selected ? '' : t.placeholder}`}>{selected ? selected.label : placeholder}</span>
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-brand-neon' : t.icon}`} strokeWidth={1.75} aria-hidden="true" />
            </button>

            {/* Validação nativa: um campo invisível sobre o botão recebe o "required" */}
            {required && (
                <input
                    tabIndex={-1}
                    aria-hidden="true"
                    required
                    name={name}
                    value={value}
                    onChange={() => {}}
                    onFocus={() => buttonRef.current?.focus()}
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                />
            )}
            {!required && name && <input type="hidden" name={name} value={value} />}

            {portalTarget && createPortal(
                <AnimatePresence>
                    {open && pos && (
                        <motion.ul
                            ref={listRef}
                            id={listId}
                            role="listbox"
                            aria-labelledby={buttonId}
                            initial={{ opacity: 0, y: pos.top != null ? -4 : 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12, ease: 'easeOut' }}
                            style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxH }}
                            className={`custom-scrollbar z-[10050] overflow-y-auto overscroll-contain border p-1 text-sm shadow-[0_16px_40px_rgba(0,0,0,0.35)] ${maxHeight} ${t.menu}`}
                        >
                            {options.length === 0 && <li className={`px-3 py-2.5 ${t.hint}`}>Nenhuma opção</li>}
                            {options.map((opt, i) => {
                                const isSelected = opt.value === value;
                                return (
                                    <li
                                        key={`${opt.value}-${i}`}
                                        id={`${listId}-${i}`}
                                        data-index={i}
                                        role="option"
                                        aria-selected={isSelected}
                                        aria-disabled={opt.disabled || undefined}
                                        onMouseEnter={() => !opt.disabled && setActive(i)}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => choose(i)}
                                        className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-2 md:min-h-9 ${opt.disabled ? 'cursor-not-allowed opacity-40' : ''} ${i === active ? t.active : ''} ${isSelected ? 'text-brand-neon' : t.option}`}
                                    >
                                        <span className="min-w-0 truncate">
                                            {opt.label}
                                            {opt.hint && <span className={`ml-2 text-xs ${t.hint}`}>{opt.hint}</span>}
                                        </span>
                                        {isSelected && <Check className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />}
                                    </li>
                                );
                            })}
                        </motion.ul>
                    )}
                </AnimatePresence>,
                portalTarget,
            )}
        </div>
    );
}
