import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { ExternalLink, ImagePlus, Trash2 } from 'lucide-react';
import { api } from '@/lib/axios';
import { uploadImage } from '@/services/panels.service';
import { useToast } from '@/contexts/ToastContext';
import { IMAGE_ACCEPT, apiErrorMessage, validateImageFile } from '@/lib/upload';
import { ConfirmSheet, CrmPage, EmptyState, Field, Panel, Skeleton } from '@/components/app/ui';
import { crmBtn, crmInput } from '@/components/app/tokens';

interface PortfolioImage { id: string; url: string; alt: string }

export function SolutionManager() {
    const { addToast } = useToast();
    const fileInput = useRef<HTMLInputElement>(null);
    const [images, setImages] = useState<PortfolioImage[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [saving, setSaving] = useState(false);
    const [toDelete, setToDelete] = useState<PortfolioImage | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = async () => {
        try {
            setStatus('loading');
            const { data } = await api.get<PortfolioImage[]>('/solution/portfolio');
            setImages(Array.isArray(data) ? data : []);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => { load(); }, []);

    const pick = (e: ChangeEvent<HTMLInputElement>) => {
        const chosen = e.target.files?.[0];
        e.target.value = '';
        if (!chosen) return;
        const error = validateImageFile(chosen);
        if (error) { addToast(error, 'error'); return; }
        setFile(chosen);
        setPreview(URL.createObjectURL(chosen));
        const suggested = chosen.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
        setTitle(suggested.charAt(0).toUpperCase() + suggested.slice(1));
    };

    const reset = () => { setFile(null); setPreview(null); setTitle(''); };

    const onSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!file || saving) return;
        try {
            setSaving(true);
            const url = await uploadImage(file, 'solution');
            await api.post('/solution/portfolio', { url, alt: title.trim() || 'Projeto da T3 Solution' });
            addToast('Imagem publicada no portfólio.', 'success');
            reset();
            load();
        } catch (error) {
            addToast(apiErrorMessage(error, 'Não foi possível salvar a imagem.'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async () => {
        if (!toDelete) return;
        try {
            setDeleting(true);
            await api.delete(`/solution/portfolio/${toDelete.id}`);
            setImages((prev) => prev.filter((i) => i.id !== toDelete.id));
            addToast('Imagem removida do portfólio.', 'success');
            setToDelete(null);
        } catch (error) {
            addToast(apiErrorMessage(error, 'Não foi possível remover a imagem.'), 'error');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <CrmPage
            eyebrow="Conteúdo do site"
            title="T3 Solution"
            description="Fotos de projetos entregues que aparecem na seção Portfólio da página T3 Solution."
            actions={<a href="/solution" target="_blank" rel="noopener noreferrer" className={crmBtn.secondary}><ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver página</a>}
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
                <Panel title="Nova imagem" bodyClassName="p-5" className="self-start">
                    <form onSubmit={onSave} className="flex flex-col gap-4">
                        <button type="button" onClick={() => fileInput.current?.click()} className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border border-dashed border-brand-border text-sm text-brand-muted hover:border-brand-neon hover:text-brand-text">
                            {preview
                                ? <img src={preview} alt="Pré-visualização" className="absolute inset-0 h-full w-full object-cover" />
                                : <span className="flex flex-col items-center gap-2"><ImagePlus className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" /> Escolher foto</span>}
                        </button>
                        <input ref={fileInput} type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={pick} aria-label="Escolher foto" />
                        <p className="text-xs text-brand-muted">JPG, PNG ou WebP até 5 MB. Fotos na horizontal ficam melhor na página.</p>
                        {file && (
                            <>
                                <Field label="Legenda" htmlFor="sol-alt" hint="Aparece sobre a foto e ajuda quem usa leitor de tela.">
                                    <input id="sol-alt" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className={crmInput} placeholder="Ex.: Fachada de LED · Shopping Bougainville" />
                                </Field>
                                <div className="flex gap-2">
                                    <button type="button" onClick={reset} disabled={saving} className={`${crmBtn.secondary} flex-1`}>Cancelar</button>
                                    <button type="submit" disabled={saving} className={`${crmBtn.primary} flex-1`}>{saving ? 'Enviando…' : 'Publicar'}</button>
                                </div>
                            </>
                        )}
                    </form>
                </Panel>

                <Panel title={`Publicadas (${images.length})`} bodyClassName="p-5">
                    {status === 'loading' && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-[4/3]" />)}</div>}
                    {status === 'error' && <EmptyState title="Não foi possível carregar o portfólio" action={<button type="button" onClick={load} className={crmBtn.secondary}>Tentar de novo</button>} />}
                    {status === 'ready' && images.length === 0 && <EmptyState title="Portfólio vazio" text="Sem imagens, a seção Portfólio não aparece na página T3 Solution." />}
                    {status === 'ready' && images.length > 0 && (
                        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {images.map((img) => (
                                <li key={img.id} className="group relative aspect-[4/3] overflow-hidden border border-brand-border bg-brand-background">
                                    <img src={img.url} alt={img.alt} loading="lazy" className="h-full w-full object-cover" />
                                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/70 px-3 py-2">
                                        <span className="truncate text-xs text-white">{img.alt}</span>
                                        <button type="button" onClick={() => setToDelete(img)} className="shrink-0 text-white/80 hover:text-red-400" aria-label={`Remover ${img.alt}`}><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>

            <ConfirmSheet open={Boolean(toDelete)} title="Remover imagem?" text={`"${toDelete?.alt ?? ''}" sai do portfólio da página T3 Solution.`} confirmLabel="Remover" busy={deleting} onConfirm={onDelete} onClose={() => setToDelete(null)} />
        </CrmPage>
    );
}
