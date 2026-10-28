import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Circle, MessageSquare, Pencil, PhoneCall, Plus, Trash2, Users, ListTodo } from 'lucide-react';
import { agendaService, Task } from '@/services/agenda.service';
import { crmService } from '@/services/crm.service';
import { useToast } from '@/contexts/ToastContext';
import { toDateKey, dateKeyToISO } from '@/lib/date';
import { ConfirmSheet, CrmPage, EmptyState, Field, Panel, Sheet, Skeleton } from '@/components/app/ui';
import { crmBtn, crmInput } from '@/components/app/tokens';

const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const TYPES = [
    { id: 'meeting', label: 'Reunião', icon: Users },
    { id: 'call', label: 'Ligação', icon: PhoneCall },
    { id: 'message', label: 'Mensagem', icon: MessageSquare },
    { id: 'task', label: 'Tarefa', icon: ListTodo },
] as const;
type TaskType = typeof TYPES[number]['id'];

const EMPTY_FORM = { title: '', client: '', time: '09:00', type: 'meeting' as TaskType, date: '' };
const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fullDate = (d: Date) => capFirst(new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(d));
const monthLabel = (d: Date) => capFirst(new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d));
const errorMessage = (error: unknown, fallback: string) =>
    (error as { response?: { data?: { error?: string } } }).response?.data?.error || fallback;

export function CrmAgenda() {
    const { addToast } = useToast();
    const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [selected, setSelected] = useState(() => new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [clientNames, setClientNames] = useState<string[]>([]);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Task | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [toDelete, setToDelete] = useState<Task | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = async () => {
        try {
            setStatus('loading');
            setTasks(await agendaService.getTasks());
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => {
        load();
        // Sugestões do campo "cliente"; a agenda funciona sem elas
        crmService.getClients().then((c) => setClientNames(c.map((x) => x.name))).catch(() => {});
    }, []);

    const selectedKey = toDateKey(selected);
    const todayKey = toDateKey(new Date());

    const countByDay = useMemo(() => {
        const map = new Map<string, number>();
        tasks.forEach((t) => {
            if (t.status === 'completed') return;
            const key = t.date.slice(0, 10);
            map.set(key, (map.get(key) ?? 0) + 1);
        });
        return map;
    }, [tasks]);

    const dayTasks = useMemo(
        () => tasks.filter((t) => t.date.startsWith(selectedKey)).sort((a, b) => a.time.localeCompare(b.time)),
        [tasks, selectedKey],
    );
    const pending = dayTasks.filter((t) => t.status !== 'completed').length;

    const year = month.getFullYear();
    const m = month.getMonth();
    const blanks = new Date(year, m, 1).getDay();
    const days = new Date(year, m + 1, 0).getDate();

    const goToday = () => { const d = new Date(); setSelected(d); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); };

    const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM, date: selectedKey }); setFormOpen(true); };
    const openEdit = (task: Task) => {
        setEditing(task);
        setForm({ title: task.title, client: task.client, time: task.time, type: (task.type as TaskType) || 'task', date: task.date.slice(0, 10) });
        setFormOpen(true);
    };

    const onSave = async (e: FormEvent) => {
        e.preventDefault();
        if (saving) return;
        const payload = { title: form.title.trim(), client: form.client.trim(), time: form.time, type: form.type, date: dateKeyToISO(form.date) };
        try {
            setSaving(true);
            if (editing) {
                const updated = await agendaService.updateTask(editing.id, payload);
                setTasks((prev) => prev.map((t) => (t.id === editing.id ? updated : t)));
                addToast('Compromisso atualizado.', 'success');
            } else {
                const created = await agendaService.createTask(payload);
                setTasks((prev) => [...prev, created]);
                addToast('Compromisso marcado.', 'success');
            }
            setFormOpen(false);
        } catch (error) {
            addToast(errorMessage(error, 'Não foi possível salvar o compromisso.'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggle = async (task: Task) => {
        const next = task.status === 'completed' ? 'pending' : 'completed';
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
        try {
            await agendaService.toggleTaskStatus(task.id, next);
        } catch {
            setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
            addToast('Não foi possível atualizar a tarefa.', 'error');
        }
    };

    const onDelete = async () => {
        if (!toDelete) return;
        try {
            setDeleting(true);
            await agendaService.deleteTask(toDelete.id);
            setTasks((prev) => prev.filter((t) => t.id !== toDelete.id));
            setToDelete(null);
            setFormOpen(false);
            addToast('Compromisso excluído.', 'success');
        } catch (error) {
            addToast(errorMessage(error, 'Não foi possível excluir.'), 'error');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <CrmPage
            eyebrow="Ferramentas"
            title="Agenda"
            description="Compromissos e follow-ups da equipe comercial."
            actions={<button type="button" onClick={openCreate} className={crmBtn.primary}><Plus className="h-4 w-4" aria-hidden="true" /> Novo compromisso</button>}
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
                {/* ============================ CALENDÁRIO ============================ */}
                <Panel
                    title={monthLabel(month)}
                    action={
                        <div className="flex items-center">
                            <button type="button" onClick={() => setMonth(new Date(year, m - 1, 1))} className={crmBtn.icon} aria-label="Mês anterior"><ChevronLeft className="h-4 w-4" /></button>
                            <button type="button" onClick={goToday} className="px-2 text-xs text-brand-muted hover:text-brand-text">Hoje</button>
                            <button type="button" onClick={() => setMonth(new Date(year, m + 1, 1))} className={crmBtn.icon} aria-label="Próximo mês"><ChevronRight className="h-4 w-4" /></button>
                        </div>
                    }
                    bodyClassName="p-3"
                    className="self-start"
                >
                    <div className="grid grid-cols-7 text-center">
                        {WEEK.map((d) => <span key={d} className="pb-2 font-mono text-[11px] uppercase text-brand-muted">{d}</span>)}
                        {Array.from({ length: blanks }, (_, i) => <span key={`b${i}`} />)}
                        {Array.from({ length: days }, (_, i) => {
                            const date = new Date(year, m, i + 1);
                            const key = toDateKey(date);
                            const isSelected = key === selectedKey;
                            const isToday = key === todayKey;
                            const count = countByDay.get(key) ?? 0;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setSelected(date)}
                                    aria-pressed={isSelected}
                                    aria-label={`${fullDate(date)}${count ? `, ${count} pendente${count > 1 ? 's' : ''}` : ''}`}
                                    className={`relative flex h-10 items-center justify-center font-mono text-sm transition-colors ${isSelected ? 'bg-brand-neon text-ink-950' : isToday ? 'text-brand-neon ring-1 ring-inset ring-brand-neon' : 'text-brand-text hover:bg-brand-background'}`}
                                >
                                    {i + 1}
                                    {count > 0 && <span className={`absolute bottom-1 h-1 w-1 ${isSelected ? 'bg-ink-950' : 'bg-brand-neon'}`} aria-hidden="true" />}
                                </button>
                            );
                        })}
                    </div>
                </Panel>

                {/* ============================ DIA ============================ */}
                <Panel
                    title={fullDate(selected)}
                    action={<span className="text-sm text-brand-muted">{pending} {pending === 1 ? 'pendente' : 'pendentes'}</span>}
                >
                    {status === 'loading' && <div className="flex flex-col gap-2 p-5">{[0, 1].map((i) => <Skeleton key={i} className="h-14" />)}</div>}
                    {status === 'error' && <div className="p-5"><EmptyState title="Não foi possível carregar a agenda" action={<button type="button" onClick={load} className={crmBtn.secondary}>Tentar de novo</button>} /></div>}
                    {status === 'ready' && dayTasks.length === 0 && (
                        <div className="p-5">
                            <p className="text-sm text-brand-muted">Nenhum compromisso neste dia.</p>
                            <button type="button" onClick={openCreate} className={`mt-4 ${crmBtn.secondary}`}><Plus className="h-4 w-4" aria-hidden="true" /> Marcar neste dia</button>
                        </div>
                    )}
                    {status === 'ready' && dayTasks.length > 0 && (
                        <ul className="divide-y divide-brand-border">
                            {dayTasks.map((task) => {
                                const done = task.status === 'completed';
                                const type = TYPES.find((t) => t.id === task.type) ?? TYPES[3];
                                return (
                                    <li key={task.id} className="flex items-center gap-4 px-5 py-4">
                                        <button type="button" onClick={() => toggle(task)} aria-pressed={done} aria-label={done ? `Reabrir ${task.title}` : `Concluir ${task.title}`} className="shrink-0 text-brand-muted hover:text-brand-neon">
                                            {done ? <Check className="h-5 w-5 text-brand-neon" /> : <Circle className="h-5 w-5" strokeWidth={1.5} />}
                                        </button>
                                        <span className={`w-12 shrink-0 font-mono text-sm ${done ? 'text-brand-muted line-through' : 'text-brand-text'}`}>{task.time}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className={`truncate text-sm ${done ? 'text-brand-muted line-through' : 'text-brand-text'}`}>{task.title}</p>
                                            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-brand-muted">
                                                <type.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" /> {type.label}{task.client ? ` · ${task.client}` : ''}
                                            </p>
                                        </div>
                                        <button type="button" onClick={() => openEdit(task)} className={crmBtn.icon} aria-label={`Editar ${task.title}`}><Pencil className="h-4 w-4" strokeWidth={1.75} /></button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Panel>
            </div>

            {/* ============================ FORMULÁRIO ============================ */}
            <Sheet
                open={formOpen}
                onClose={() => setFormOpen(false)}
                eyebrow="Agenda"
                title={editing ? 'Editar compromisso' : 'Novo compromisso'}
                footer={<>
                    {editing && <button type="button" onClick={() => setToDelete(editing)} className={`${crmBtn.ghost} sm:mr-auto`}><Trash2 className="h-4 w-4" aria-hidden="true" /> Excluir</button>}
                    <button type="button" onClick={() => setFormOpen(false)} className={crmBtn.secondary}>Cancelar</button>
                    <button type="submit" form="task-form" disabled={saving} className={crmBtn.primary}>{saving ? 'Salvando…' : editing ? 'Salvar' : 'Marcar'}</button>
                </>}
            >
                <form id="task-form" onSubmit={onSave} className="grid grid-cols-2 gap-4">
                    <Field label="O que fazer" htmlFor="t-title" className="col-span-2">
                        <input id="t-title" required maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={crmInput} placeholder="Ex.: Apresentar proposta do pacote anual" />
                    </Field>
                    <Field label="Cliente" htmlFor="t-client" className="col-span-2" hint="Opcional.">
                        <input id="t-client" list="agenda-clients" maxLength={160} value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className={crmInput} />
                        <datalist id="agenda-clients">{clientNames.map((n) => <option key={n} value={n} />)}</datalist>
                    </Field>
                    <Field label="Dia" htmlFor="t-date">
                        <input id="t-date" required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={crmInput} />
                    </Field>
                    <Field label="Horário" htmlFor="t-time">
                        <input id="t-time" required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={`${crmInput} font-mono`} />
                    </Field>
                    <fieldset className="col-span-2">
                        <legend className="mb-1.5 text-sm text-brand-text">Tipo</legend>
                        <div className="grid grid-cols-2 gap-px border border-brand-border bg-brand-border sm:grid-cols-4">
                            {TYPES.map((t) => (
                                <label key={t.id} className={`flex cursor-pointer items-center justify-center gap-2 px-3 py-2.5 text-sm ${form.type === t.id ? 'bg-brand-surface text-brand-text shadow-[inset_0_-2px_0_rgb(255,94,0)]' : 'bg-brand-background text-brand-muted'}`}>
                                    <input type="radio" name="t-type" value={t.id} checked={form.type === t.id} onChange={() => setForm({ ...form, type: t.id })} className="sr-only" />
                                    <t.icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> {t.label}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                </form>
            </Sheet>

            <ConfirmSheet
                open={Boolean(toDelete)}
                title="Excluir compromisso?"
                text={`"${toDelete?.title ?? ''}" sai da agenda de toda a equipe.`}
                busy={deleting}
                onConfirm={onDelete}
                onClose={() => setToDelete(null)}
            />
        </CrmPage>
    );
}
