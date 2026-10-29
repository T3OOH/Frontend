import { FormEvent, useState } from 'react';
import { Check } from 'lucide-react';
import { CustomSelect } from '@/components/CustomSelect';
import { Field } from '@/components/app/ui';
import { crmBtn, crmInput } from '@/components/app/tokens';
import {
    SOLUTION_APPLICATIONS, SOLUTION_ENVIRONMENTS, SOLUTION_PITCHES, SOLUTION_SERVICES,
    SolutionApplication, SolutionDetails, solutionSummary,
} from '@/lib/solution';

interface Props {
    value?: SolutionDetails | null;
    expectedValue: number;
    disabled?: boolean;
    onSave: (data: { solution: SolutionDetails; expectedValue: number }) => Promise<void>;
}

const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));
const str = (v?: number | null) => (v == null ? '' : String(v).replace('.', ','));

/**
 * Projeto de um negócio da T3 Solution no CRM: aplicação, ambiente, medidas (área calculada),
 * pixel pitch, serviços incluídos, observações e o valor do projeto.
 */
export function SolutionProject({ value, expectedValue, disabled, onSave }: Props) {
    const [form, setForm] = useState({
        application: value?.application ?? '',
        environment: value?.environment ?? '',
        width: str(value?.width),
        height: str(value?.height),
        pitch: value?.pitch ? String(value.pitch) : '',
        services: value?.services ?? [],
        notes: value?.notes ?? '',
        expectedValue: expectedValue ? String(expectedValue) : '',
    });
    const [saving, setSaving] = useState(false);

    const draft: SolutionDetails = {
        application: (form.application || null) as SolutionApplication | null,
        environment: (form.environment || null) as SolutionDetails['environment'],
        width: num(form.width),
        height: num(form.height),
        pitch: form.pitch ? Number(form.pitch) : null,
        services: form.services,
        notes: form.notes.trim() || null,
    };
    const summary = solutionSummary(draft);

    const toggleService = (s: (typeof SOLUTION_SERVICES)[number]['value']) =>
        setForm((f) => ({ ...f, services: f.services.includes(s) ? f.services.filter((x) => x !== s) : [...f.services, s] }));

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave({ solution: draft, expectedValue: Number(form.expectedValue.replace(',', '.')) || 0 });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-4 border border-brand-border p-4" aria-label="Projeto T3 Solution">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-brand-text">Projeto T3 Solution</p>
                {summary && <p className="font-mono text-xs text-brand-muted">{summary}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Aplicação" htmlFor="sol-application">
                    <CustomSelect id="sol-application" value={form.application} onChange={(v) => setForm({ ...form, application: v })} placeholder="Onde vai a tela" disabled={disabled}
                        options={SOLUTION_APPLICATIONS.map((a) => ({ value: a.title, label: a.title }))} />
                </Field>
                <Field label="Ambiente" htmlFor="sol-environment">
                    <CustomSelect id="sol-environment" value={form.environment} onChange={(v) => setForm({ ...form, environment: v })} placeholder="Indoor ou outdoor" disabled={disabled}
                        options={SOLUTION_ENVIRONMENTS.map((e) => ({ value: e.value, label: e.label, hint: e.hint }))} />
                </Field>
                <Field label="Largura (m)" htmlFor="sol-width">
                    <input id="sol-width" inputMode="decimal" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} disabled={disabled} className={`${crmInput} font-mono`} placeholder="4" />
                </Field>
                <Field label="Altura (m)" htmlFor="sol-height">
                    <input id="sol-height" inputMode="decimal" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} disabled={disabled} className={`${crmInput} font-mono`} placeholder="2,5" />
                </Field>
                <Field label="Pixel pitch" htmlFor="sol-pitch">
                    <CustomSelect id="sol-pitch" value={form.pitch} onChange={(v) => setForm({ ...form, pitch: v })} placeholder="P (mm)" disabled={disabled}
                        options={SOLUTION_PITCHES.map((p) => ({ value: String(p), label: `P${String(p).replace('.', ',')}`, hint: p <= 2.9 ? 'indoor' : p >= 4.8 ? 'outdoor' : undefined }))} />
                </Field>
                <Field label="Valor do projeto (R$)" htmlFor="sol-value">
                    <input id="sol-value" inputMode="decimal" value={form.expectedValue} onChange={(e) => setForm({ ...form, expectedValue: e.target.value })} disabled={disabled} className={`${crmInput} font-mono`} placeholder="0,00" />
                </Field>
            </div>

            <fieldset>
                <legend className="mb-2 text-sm text-brand-muted">Serviços incluídos</legend>
                <div className="flex flex-wrap gap-2">
                    {SOLUTION_SERVICES.map((s) => {
                        const on = form.services.includes(s.value);
                        return (
                            <button key={s.value} type="button" role="checkbox" aria-checked={on} disabled={disabled} onClick={() => toggleService(s.value)}
                                className={`inline-flex min-h-11 items-center gap-1.5 border px-3 py-2 text-sm md:min-h-9 ${on ? 'border-brand-neon/50 bg-brand-neon/10 text-brand-neon' : 'border-brand-border text-brand-muted hover:text-brand-text'}`}>
                                {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />} {s.label}
                            </button>
                        );
                    })}
                </div>
            </fieldset>

            <Field label="Observações do cliente e do projeto" htmlFor="sol-notes">
                <textarea id="sol-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={disabled} className={`${crmInput} resize-y`} placeholder="Local, restrições da arquitetura, prazo desejado…" />
            </Field>

            {!disabled && (
                <div className="flex justify-end">
                    <button type="submit" disabled={saving} className={crmBtn.primary}>{saving ? 'Salvando…' : 'Salvar projeto'}</button>
                </div>
            )}
        </form>
    );
}
