import { ComponentType, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, CornerDownLeft, FileText, MonitorPlay, Search, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { crmService } from '@/services/crm.service';
import { panelsService } from '@/services/panels.service';
import { formatBRL } from './tokens';

type Icon = ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' }>;

export interface PaletteLink { to: string; label: string; icon: Icon }

interface Item { id: string; group: string; label: string; hint?: string; to: string; icon: Icon; text: string }

/** Busca sem acento e sem diferença de maiúsculas. */
const norm = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const MAX_PER_GROUP = 6;

/**
 * Busca rápida das áreas internas (Ctrl+K ou Cmd+K): páginas, clientes, negócios e painéis.
 * Os dados só são buscados na primeira abertura.
 */
export function CommandPalette({ open, onClose, links }: { open: boolean; onClose: () => void; links: PaletteLink[] }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { theme } = useTheme();
    const isManagement = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const [records, setRecords] = useState<Item[] | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (!open) return;
        setQuery('');
        setActive(0);
        requestAnimationFrame(() => inputRef.current?.focus());
        if (records) return;
        // Cada fonte é opcional: se uma falhar, as outras continuam na busca
        Promise.allSettled([crmService.getClients(), crmService.getDeals(), panelsService.getAllPanels()]).then(([c, d, p]) => {
            const clients = c.status === 'fulfilled' ? c.value : [];
            const deals = d.status === 'fulfilled' ? d.value : [];
            const panels = p.status === 'fulfilled' ? p.value : [];
            setRecords([
                ...clients.map((x) => ({
                    id: `c-${x.id}`, group: 'Clientes', label: x.name, hint: x.company || x.email || undefined, icon: UserRound,
                    to: `/crm/clientes?clientId=${x.id}`, text: norm([x.name, x.company, x.email, x.city, x.phone, x.whatsapp, x.document].filter(Boolean).join(' ')),
                })),
                ...deals.map((x) => ({
                    id: `d-${x.id}`, group: 'Negócios', label: x.title, hint: [x.client?.name, formatBRL(x.expectedValue)].filter(Boolean).join(' · '), icon: Briefcase,
                    to: `/crm/clientes?dealId=${x.id}`, text: norm([x.title, x.client?.name].filter(Boolean).join(' ')),
                })),
                ...panels.map((x) => ({
                    id: `p-${x.id}`, group: 'Painéis', label: x.name, hint: [x.city, x.state].filter(Boolean).join(' - '), icon: MonitorPlay,
                    to: isManagement ? `/dashboard/paineis/editar/${x.id}` : `/servicos?panelId=${x.id}`,
                    text: norm([x.name, x.city, x.state, x.address].filter(Boolean).join(' ')),
                })),
            ]);
        });
    }, [open, records, isManagement]);

    const pages: Item[] = useMemo(() => links.map((l) => ({ id: `n-${l.to}`, group: 'Ir para', label: l.label, icon: l.icon ?? FileText, to: l.to, text: norm(l.label) })), [links]);

    const results = useMemo(() => {
        const q = norm(query.trim());
        const words = q.split(/\s+/).filter(Boolean);
        const match = (i: Item) => words.every((w) => i.text.includes(w));
        if (!words.length) return pages;
        const found = [...pages, ...(records ?? [])].filter(match);
        // Limite por grupo para a lista não virar um paredão
        const count: Record<string, number> = {};
        return found.filter((i) => (count[i.group] = (count[i.group] ?? 0) + 1) <= MAX_PER_GROUP);
    }, [query, pages, records]);

    useEffect(() => { setActive(0); }, [query]);
    useEffect(() => {
        listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [active]);

    const go = (item?: Item) => {
        if (!item) return;
        onClose();
        navigate(item.to);
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
        else if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
        else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };

    const loading = Boolean(query.trim()) && !records;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                    className={`fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 px-4 pt-[12vh] ${theme === 'light' ? 'dashboard-light' : ''}`}
                    onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
                >
                    <motion.div
                        initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        role="dialog" aria-modal="true" aria-label="Busca rápida"
                        className="flex max-h-[70vh] w-full max-w-xl flex-col border border-brand-border bg-brand-surface text-brand-text shadow-2xl"
                    >
                        <div className="flex items-center gap-3 border-b border-brand-border px-4">
                            <Search className="h-4 w-4 shrink-0 text-brand-muted" aria-hidden="true" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder="Buscar páginas, clientes, negócios e painéis"
                                className="h-14 min-w-0 flex-1 bg-transparent text-base text-brand-text placeholder:text-brand-muted/70 focus:outline-none"
                                role="combobox"
                                aria-expanded="true"
                                aria-controls="palette-results"
                                aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
                            />
                            <kbd className="hidden border border-brand-border px-1.5 py-0.5 font-mono text-[10px] text-brand-muted sm:block">Esc</kbd>
                        </div>

                        <ul id="palette-results" ref={listRef} role="listbox" className="flex-1 overflow-y-auto py-2">
                            {results.map((item, i) => {
                                const Icon = item.icon;
                                const groupStart = i === 0 || results[i - 1].group !== item.group;
                                return (
                                    <li key={item.id} role="presentation">
                                        {groupStart && <p className="px-4 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-muted">{item.group}</p>}
                                        <button
                                            type="button"
                                            id={`palette-${item.id}`}
                                            role="option"
                                            aria-selected={i === active}
                                            data-index={i}
                                            onMouseMove={() => setActive(i)}
                                            onClick={() => go(item)}
                                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${i === active ? 'bg-brand-background shadow-[inset_2px_0_0_rgb(255,94,0)]' : ''}`}
                                        >
                                            <Icon className="h-4 w-4 shrink-0 text-brand-muted" strokeWidth={1.75} aria-hidden="true" />
                                            <span className="min-w-0 flex-1 truncate">{item.label}{item.hint && <span className="ml-2 text-xs text-brand-muted">{item.hint}</span>}</span>
                                            {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-brand-muted" aria-hidden="true" />}
                                        </button>
                                    </li>
                                );
                            })}
                            {!results.length && (
                                <li className="px-4 py-6 text-center text-sm text-brand-muted">{loading ? 'Carregando…' : 'Nada encontrado.'}</li>
                            )}
                        </ul>

                        <div className="hidden items-center gap-4 border-t border-brand-border px-4 py-2.5 font-mono text-[10px] text-brand-muted sm:flex">
                            <span>↑ ↓ navegar</span><span>Enter abrir</span><span className="ml-auto">Ctrl K</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
