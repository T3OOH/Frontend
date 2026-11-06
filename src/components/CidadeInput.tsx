import { KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { api } from '@/lib/axios';
import { crmInput } from '@/components/app/tokens';

export interface Municipio { id: number; nome: string; uf: string }

interface CidadeInputProps {
    id: string;
    city: string;
    /** Muda cidade e UF juntas: escolher uma sugestão preenche a UF. */
    onChange: (value: { city: string; state?: string }) => void;
    required?: boolean;
    placeholder?: string;
}

const sem = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Campo de cidade com sugestões da lista oficial do IBGE (GET /localidades/municipios).
 * Escolher uma sugestão grava a grafia oficial e a UF. Se o texto digitado for o nome exato de
 * uma única cidade, a UF também é preenchida ao sair do campo. A API padroniza de novo ao salvar.
 */
export function CidadeInput({ id, city, onChange, required, placeholder = 'Goiânia' }: CidadeInputProps) {
    const listId = useId();
    const [options, setOptions] = useState<Municipio[]>([]);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const typed = useRef(false);

    useEffect(() => {
        // Só busca quando a pessoa digita (não ao abrir um painel já salvo)
        if (!typed.current) return;
        const termo = city.trim();
        if (termo.length < 2) { setOptions([]); return; }
        const controller = new AbortController();
        const timer = setTimeout(() => {
            api.get<Municipio[]>('/localidades/municipios', { params: { busca: termo, limite: 8 }, signal: controller.signal })
                .then((res) => { setOptions(res.data); setActive(res.data.length ? 0 : -1); setOpen(true); })
                .catch(() => { /* sem sugestões: a API valida ao salvar */ });
        }, 200);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [city]);

    const choose = (m: Municipio) => {
        typed.current = false;
        onChange({ city: m.nome, state: m.uf });
        setOpen(false);
        setOptions([]);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!open || !options.length) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % options.length); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + options.length) % options.length); }
        else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(options[active]); }
        else if (e.key === 'Escape') setOpen(false);
    };

    const onBlur = () => {
        // Clique numa sugestão dispara antes do blur (onMouseDown); aqui só fecha e completa o óbvio
        setTimeout(() => setOpen(false), 120);
        const exatas = options.filter((m) => sem(m.nome) === sem(city));
        if (exatas.length === 1) choose(exatas[0]);
    };

    return (
        <div className="relative">
            <input
                id={id}
                role="combobox"
                aria-expanded={open && options.length > 0}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
                autoComplete="off"
                required={required}
                maxLength={100}
                value={city}
                placeholder={placeholder}
                onChange={(e) => { typed.current = true; onChange({ city: e.target.value }); }}
                onFocus={() => options.length && setOpen(true)}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
                className={crmInput}
            />
            {open && options.length > 0 && (
                <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto border border-brand-border bg-brand-background shadow-lg">
                    {options.map((m, i) => (
                        <li
                            key={m.id}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={i === active}
                            onMouseDown={(e) => { e.preventDefault(); choose(m); }}
                            onMouseEnter={() => setActive(i)}
                            className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2 text-sm ${i === active ? 'bg-brand-neon/15 text-brand-text' : 'text-brand-muted'}`}
                        >
                            <span className="truncate">{m.nome}</span>
                            <span className="font-mono text-xs">{m.uf}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
