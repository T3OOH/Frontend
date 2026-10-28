import { ChangeEvent, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/axios';
import { uploadImage } from '@/services/panels.service';
import { useToast } from '@/contexts/ToastContext';
import { IMAGE_ACCEPT, apiErrorMessage, validateImageFile } from '@/lib/upload';
import { CrmPage, EmptyState, Field, Panel, Skeleton } from '@/components/app/ui';
import { crmBtn, crmInput } from '@/components/app/tokens';

interface TeamMember { id: string; name: string; role: string; bio: string; image: string; _file?: File | null; _preview?: string }
interface Brand { id: string; name: string; logo: string; _file?: File | null; _preview?: string }

const parseList = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];
    if (typeof value === 'string') { try { const v = JSON.parse(value); return Array.isArray(v) ? v : []; } catch { return []; } }
    return [];
};

const move = <T,>(list: T[], from: number, to: number) => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};

export function DashboardInfo() {
    const toast = useToast();
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);

    const load = async () => {
        try {
            setStatus('loading');
            const { data } = await api.get('/institutional');
            setTeam(parseList<TeamMember>(data?.team));
            setBrands(parseList<Brand>(data?.brands));
            setDirty(false);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => { load(); }, []);

    // Avisa antes de sair da página com alterações não salvas
    useEffect(() => {
        if (!dirty) return;
        const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

    const edit = <T,>(setter: (fn: (prev: T[]) => T[]) => void) => (fn: (prev: T[]) => T[]) => { setter(fn); setDirty(true); };
    const editTeam = edit<TeamMember>(setTeam);
    const editBrands = edit<Brand>(setBrands);

    const pickFile = (e: ChangeEvent<HTMLInputElement>, apply: (file: File, preview: string) => void) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const error = validateImageFile(file);
        if (error) { toast.error(error); return; }
        apply(file, URL.createObjectURL(file));
    };

    const onSave = async () => {
        const invalid = team.find((m) => !m.name.trim() || !m.role.trim());
        if (invalid) { toast.error('Preencha nome e cargo de todas as pessoas da equipe.'); return; }
        setSaving(true);
        try {
            // Envio em sequência: uma falha para o processo antes de salvar dados parciais
            const savedTeam = [];
            for (const m of team) {
                const image = m._file ? await uploadImage(m._file, 'team') : m.image;
                savedTeam.push({ id: m.id, name: m.name.trim(), role: m.role.trim(), bio: m.bio.trim(), image });
            }
            const savedBrands = [];
            for (const b of brands) {
                const logo = b._file ? await uploadImage(b._file, 'Brands') : b.logo;
                if (b.name.trim() || logo) savedBrands.push({ id: b.id, name: b.name.trim(), logo });
            }
            await api.put('/institutional', { team: savedTeam, brands: savedBrands });
            setTeam(savedTeam);
            setBrands(savedBrands);
            setDirty(false);
            toast.success('Página Sobre atualizada.');
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Não foi possível salvar. Nada foi publicado.'));
        } finally {
            setSaving(false);
        }
    };

    const saveBar = (
        <div className="flex items-center gap-3">
            {dirty && <span className="text-sm text-brand-neon">Alterações não salvas</span>}
            <button type="button" onClick={onSave} disabled={saving || !dirty} className={crmBtn.primary}>{saving ? 'Salvando…' : 'Salvar e publicar'}</button>
        </div>
    );

    return (
        <CrmPage
            eyebrow="Conteúdo do site"
            title="Página Sobre"
            description="Equipe e marcas exibidas em /sobre. As mudanças só aparecem no site depois de salvar."
            actions={<>
                <a href="/sobre" target="_blank" rel="noopener noreferrer" className={crmBtn.secondary}><ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver página</a>
                {saveBar}
            </>}
        >
            {status === 'loading' && <div className="flex flex-col gap-4"><Skeleton className="h-64" /><Skeleton className="h-40" /></div>}
            {status === 'error' && <EmptyState title="Não foi possível carregar o conteúdo" action={<button type="button" onClick={load} className={crmBtn.secondary}>Tentar de novo</button>} />}

            {status === 'ready' && (
                <>
                    {/* ============================ EQUIPE ============================ */}
                    <Panel
                        title={`Equipe (${team.length})`}
                        action={<button type="button" onClick={() => editTeam((p) => [...p, { id: crypto.randomUUID(), name: '', role: '', bio: '', image: '' }])} className={crmBtn.ghost}><Plus className="h-4 w-4" aria-hidden="true" /> Adicionar pessoa</button>}
                    >
                        {team.length === 0 ? <p className="p-5 text-sm text-brand-muted">Sem equipe cadastrada, o site mostra os sócios com as iniciais.</p> : (
                            <ul className="divide-y divide-brand-border">
                                {team.map((m, i) => (
                                    <li key={m.id} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-[140px_minmax(0,1fr)_auto]">
                                        <label className="relative flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden border border-dashed border-brand-border text-xs text-brand-muted hover:border-brand-neon sm:w-[140px]">
                                            {m._preview || m.image ? <img src={m._preview || m.image} alt={`Foto de ${m.name || 'membro da equipe'}`} className="absolute inset-0 h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-1"><ImagePlus className="h-5 w-5" aria-hidden="true" /> Foto</span>}
                                            <input type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={(e) => pickFile(e, (file, preview) => editTeam((p) => p.map((x) => (x.id === m.id ? { ...x, _file: file, _preview: preview } : x))))} />
                                        </label>
                                        <div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-2">
                                            <Field label="Nome" htmlFor={`t-name-${m.id}`}><input id={`t-name-${m.id}`} value={m.name} onChange={(e) => editTeam((p) => p.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)))} className={crmInput} /></Field>
                                            <Field label="Cargo" htmlFor={`t-role-${m.id}`}><input id={`t-role-${m.id}`} value={m.role} onChange={(e) => editTeam((p) => p.map((x) => (x.id === m.id ? { ...x, role: e.target.value } : x)))} className={crmInput} placeholder="Sócio-fundador" /></Field>
                                            <Field label="Resumo" htmlFor={`t-bio-${m.id}`} className="sm:col-span-2" hint="Uma ou duas frases, em frase normal (sem Iniciais Maiúsculas).">
                                                <textarea id={`t-bio-${m.id}`} rows={2} maxLength={280} value={m.bio} onChange={(e) => editTeam((p) => p.map((x) => (x.id === m.id ? { ...x, bio: e.target.value } : x)))} className={`${crmInput} resize-y`} />
                                            </Field>
                                        </div>
                                        <div className="flex gap-1 sm:flex-col">
                                            <button type="button" onClick={() => editTeam((p) => move(p, i, i - 1))} disabled={i === 0} className={crmBtn.icon} aria-label="Mover para cima"><ArrowUp className="h-4 w-4" /></button>
                                            <button type="button" onClick={() => editTeam((p) => move(p, i, i + 1))} disabled={i === team.length - 1} className={crmBtn.icon} aria-label="Mover para baixo"><ArrowDown className="h-4 w-4" /></button>
                                            <button type="button" onClick={() => editTeam((p) => p.filter((x) => x.id !== m.id))} className={crmBtn.icon} aria-label={`Remover ${m.name || 'pessoa'}`}><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    {/* ============================ MARCAS ============================ */}
                    <Panel
                        title={`Marcas (${brands.length})`}
                        action={<button type="button" onClick={() => editBrands((p) => [...p, { id: crypto.randomUUID(), name: '', logo: '' }])} className={crmBtn.ghost}><Plus className="h-4 w-4" aria-hidden="true" /> Adicionar marca</button>}
                        bodyClassName="p-5"
                    >
                        {brands.length === 0 ? <p className="text-sm text-brand-muted">Sem marcas, a seção "Marcas na rede T3" não aparece no site.</p> : (
                            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                {brands.map((b) => (
                                    <li key={b.id} className="flex flex-col gap-2 border border-brand-border p-3">
                                        <label className="relative flex h-24 cursor-pointer items-center justify-center border border-dashed border-brand-border text-xs text-brand-muted hover:border-brand-neon">
                                            {b._preview || b.logo ? <img src={b._preview || b.logo} alt={b.name || 'Logo'} className="max-h-[80%] max-w-[80%] object-contain" /> : <span className="flex flex-col items-center gap-1"><ImagePlus className="h-5 w-5" aria-hidden="true" /> Logo</span>}
                                            <input type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={(e) => pickFile(e, (file, preview) => editBrands((p) => p.map((x) => (x.id === b.id ? { ...x, _file: file, _preview: preview } : x))))} />
                                        </label>
                                        <label htmlFor={`b-${b.id}`} className="sr-only">Nome da marca</label>
                                        <input id={`b-${b.id}`} value={b.name} onChange={(e) => editBrands((p) => p.map((x) => (x.id === b.id ? { ...x, name: e.target.value } : x)))} placeholder="Nome da marca" className={`${crmInput} py-2 text-center`} />
                                        <button type="button" onClick={() => editBrands((p) => p.filter((x) => x.id !== b.id))} className={`${crmBtn.ghost} justify-center`}><Trash2 className="h-4 w-4" aria-hidden="true" /> Remover</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <div className="flex justify-end">{saveBar}</div>
                </>
            )}
        </CrmPage>
    );
}
