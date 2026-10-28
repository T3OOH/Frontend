import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { BaseTiles } from '@/features/map/basemap';
import { BRAZIL_BOUNDS, GOIANIA, brandMarker } from '@/features/map/markers';
import { ArrowLeft, ImagePlus, Star, Trash2 } from 'lucide-react';
import { panelsService, uploadImage, PanelStatus } from '@/services/panels.service';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { IMAGE_ACCEPT, apiErrorMessage, validateImageFile } from '@/lib/upload';
import { CrmPage, Field, Panel, Skeleton } from '@/components/app/ui';
import { crmBtn, crmInput } from '@/components/app/tokens';

const marker = brandMarker('brand', true);

const MAX_IMAGES = 8;

const STATUS_OPTIONS: { value: PanelStatus; label: string }[] = [
    { value: 'AVAILABLE', label: 'Disponível' },
    { value: 'OCCUPIED', label: 'Ocupado' },
    { value: 'RESERVED', label: 'Reservado' },
    { value: 'MAINTENANCE', label: 'Manutenção' },
];

/** Foto já salva (url) ou escolhida agora (file + preview). */
interface Photo { url?: string; file?: File; preview: string }

const EMPTY = { name: '', status: 'AVAILABLE' as PanelStatus, address: '', city: 'Goiânia', state: 'GO', size: '', px: '', impacts: '', price: '', description: '' };

function ClickToPlace({ onPick }: { onPick: (pos: [number, number]) => void }) {
    useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) });
    return null;
}

function FollowPosition({ position }: { position: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (map.getSize().x > 0) map.setView(position, Math.max(map.getZoom(), 15), { animate: true });
    }, [position, map]);
    return null;
}

/** Lê coordenadas de um link do Google Maps (@lat,lng ou ?q=lat,lng) ou de "lat, lng" colado. */
function parseCoordinates(text: string): [number, number] | null {
    const match = text.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
    if (!match) return null;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
}

export function PanelForm() {
    const { panelId } = useParams();
    const isEditing = Boolean(panelId);
    const navigate = useNavigate();
    const toast = useToast();
    const { theme } = useTheme();
    const fileInput = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [position, setPosition] = useState<[number, number]>(GOIANIA);
    const [coordsText, setCoordsText] = useState(`${GOIANIA[0]}, ${GOIANIA[1]}`);
    const [photos, setPhotos] = useState<Photo[]>([]);

    useEffect(() => {
        if (!panelId) return;
        panelsService.getPanelById(panelId)
            .then((p) => {
                setForm({
                    name: p.name || '', status: p.status || 'AVAILABLE', address: p.address || '', city: p.city || '', state: p.state || '',
                    size: p.size || '', px: p.px || '', impacts: p.impacts || '', price: p.price != null ? String(p.price) : '', description: p.description || '',
                });
                if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
                    setPosition([p.lat, p.lng]);
                    setCoordsText(`${p.lat}, ${p.lng}`);
                }
                setPhotos((p.images || []).map((url) => ({ url, preview: url })));
            })
            .catch(() => { toast.error('Painel não encontrado.'); navigate('/dashboard/paineis'); })
            .finally(() => setLoading(false));
    }, [panelId, navigate, toast]);

    const set = (key: keyof typeof EMPTY) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const place = (pos: [number, number]) => {
        const rounded: [number, number] = [Number(pos[0].toFixed(6)), Number(pos[1].toFixed(6))];
        setPosition(rounded);
        setCoordsText(`${rounded[0]}, ${rounded[1]}`);
    };

    const onCoordsChange = (value: string) => {
        setCoordsText(value);
        const parsed = parseCoordinates(value);
        if (parsed) setPosition(parsed);
    };

    const addPhotos = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        const room = MAX_IMAGES - photos.length;
        const accepted: Photo[] = [];
        for (const file of files) {
            const error = validateImageFile(file);
            if (error) { toast.error(error); continue; }
            if (accepted.length >= room) { toast.error(`Cada painel aceita até ${MAX_IMAGES} fotos.`); break; }
            accepted.push({ file, preview: URL.createObjectURL(file) });
        }
        setPhotos((prev) => [...prev, ...accepted]);
    };

    const makeCover = (i: number) => setPhotos((prev) => [prev[i], ...prev.filter((_, j) => j !== i)]);
    const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, j) => j !== i));

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (saving) return;
        const price = form.price.trim() ? Number(form.price.replace(',', '.')) : null;
        if (price !== null && (!Number.isFinite(price) || price < 0)) { toast.error('Preço inválido.'); return; }

        setSaving(true);
        try {
            const folder = `panels/${panelId || window.crypto.randomUUID()}`;
            const images: string[] = [];
            for (const photo of photos) {
                images.push(photo.url ?? await uploadImage(photo.file!, folder));
            }
            const payload = {
                name: form.name.trim(),
                status: form.status,
                lat: position[0],
                lng: position[1],
                size: form.size.trim(),
                px: form.px.trim(),
                impacts: form.impacts.trim(),
                price,
                city: form.city.trim(),
                state: form.state.trim().toUpperCase(),
                ...(form.address.trim() && { address: form.address.trim() }),
                ...(form.description.trim() && { description: form.description.trim() }),
                images,
            };
            if (isEditing && panelId) await panelsService.updatePanel(panelId, payload);
            else await panelsService.createPanel(payload);
            toast.success(isEditing ? 'Painel atualizado.' : 'Painel cadastrado.');
            navigate('/dashboard/paineis');
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Não foi possível salvar o painel.'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <CrmPage eyebrow="Inventário" title="Editar painel"><div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-[520px]" /><Skeleton className="h-[520px]" /></div></CrmPage>;
    }

    return (
        <CrmPage
            eyebrow="Inventário"
            title={isEditing ? `Editar ${form.name || 'painel'}` : 'Novo painel'}
            description="Os dados aparecem no site, no mapa, no catálogo e nas propostas do comercial."
            actions={<Link to="/dashboard/paineis" className={crmBtn.secondary}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar</Link>}
        >
            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-6">
                    {/* ============================ FOTOS ============================ */}
                    <Panel title={`Fotos (${photos.length}/${MAX_IMAGES})`} bodyClassName="p-5">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {photos.map((photo, i) => (
                                <figure key={photo.preview} className="group relative aspect-[4/3] overflow-hidden border border-brand-border bg-brand-background">
                                    <img src={photo.preview} alt={i === 0 ? 'Capa do painel' : `Foto ${i + 1}`} className="h-full w-full object-cover" />
                                    {i === 0 && <span className="absolute left-0 top-0 bg-brand-neon px-2 py-0.5 text-[11px] font-semibold text-ink-950">Capa</span>}
                                    <div className="absolute inset-x-0 bottom-0 flex justify-end gap-px bg-black/60 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                                        {i > 0 && <button type="button" onClick={() => makeCover(i)} className="p-1.5 text-white hover:text-brand-neon" aria-label="Usar como capa" title="Usar como capa"><Star className="h-4 w-4" /></button>}
                                        <button type="button" onClick={() => removePhoto(i)} className="p-1.5 text-white hover:text-red-400" aria-label="Remover foto" title="Remover"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </figure>
                            ))}
                            {photos.length < MAX_IMAGES && (
                                <button type="button" onClick={() => fileInput.current?.click()} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 border border-dashed border-brand-border text-sm text-brand-muted hover:border-brand-neon hover:text-brand-text">
                                    <ImagePlus className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" /> Adicionar
                                </button>
                            )}
                        </div>
                        <input ref={fileInput} type="file" accept={IMAGE_ACCEPT} multiple className="sr-only" onChange={addPhotos} aria-label="Escolher fotos" />
                        <p className="mt-3 text-xs text-brand-muted">JPG, PNG ou WebP até 5 MB. A primeira foto é a capa no site.</p>
                    </Panel>

                    {/* ============================ IDENTIFICAÇÃO ============================ */}
                    <Panel title="Identificação" bodyClassName="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                        <Field label="Nome do ponto" htmlFor="pn-name" className="sm:col-span-2">
                            <input id="pn-name" required maxLength={160} value={form.name} onChange={set('name')} className={crmInput} placeholder="Ex.: Setor Bueno - Av. T-63" />
                        </Field>
                        <Field label="Situação" htmlFor="pn-status">
                            <select id="pn-status" value={form.status} onChange={set('status')} className={crmInput}>
                                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Preço base mensal (R$)" htmlFor="pn-price" hint="Sem desconto. O site aplica os descontos de prazo.">
                            <input id="pn-price" inputMode="decimal" value={form.price} onChange={set('price')} className={`${crmInput} font-mono`} placeholder="2546,00" />
                        </Field>
                        <Field label="Descrição" htmlFor="pn-desc" className="sm:col-span-2" hint="Opcional. Ponto de referência, sentido do fluxo, horário de maior movimento.">
                            <textarea id="pn-desc" rows={3} maxLength={3000} value={form.description} onChange={set('description')} className={`${crmInput} resize-y`} />
                        </Field>
                    </Panel>

                    {/* ============================ FICHA TÉCNICA ============================ */}
                    <Panel title="Ficha técnica" bodyClassName="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
                        <Field label="Formato" htmlFor="pn-size"><input id="pn-size" required maxLength={80} value={form.size} onChange={set('size')} className={crmInput} placeholder="6x3 m" /></Field>
                        <Field label="Resolução" htmlFor="pn-px"><input id="pn-px" required maxLength={80} value={form.px} onChange={set('px')} className={crmInput} placeholder="P10 · 960x480" /></Field>
                        <Field label="Impactos por dia" htmlFor="pn-impacts"><input id="pn-impacts" required maxLength={80} value={form.impacts} onChange={set('impacts')} className={crmInput} placeholder="280 mil" /></Field>
                    </Panel>
                </div>

                {/* ============================ LOCALIZAÇÃO ============================ */}
                <div className="flex flex-col gap-6">
                    <Panel title="Localização" bodyClassName="flex flex-col gap-4 p-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_96px]">
                            <Field label="Cidade" htmlFor="pn-city"><input id="pn-city" required maxLength={100} value={form.city} onChange={set('city')} className={crmInput} /></Field>
                            <Field label="UF" htmlFor="pn-state"><input id="pn-state" required maxLength={2} value={form.state} onChange={set('state')} className={`${crmInput} uppercase`} /></Field>
                        </div>
                        <Field label="Endereço" htmlFor="pn-address" hint="Opcional.">
                            <input id="pn-address" maxLength={250} value={form.address} onChange={set('address')} className={crmInput} placeholder="Av. T-63 esq. com Av. T-4" />
                        </Field>
                        <Field label="Coordenadas" htmlFor="pn-coords" hint='Clique no mapa, ou cole "latitude, longitude" ou o link completo do Google Maps.'>
                            <input id="pn-coords" value={coordsText} onChange={(e) => onCoordsChange(e.target.value)} className={`${crmInput} font-mono ${parseCoordinates(coordsText) ? '' : 'border-red-500'}`} aria-invalid={!parseCoordinates(coordsText)} />
                        </Field>
                        <div className={`relative h-[360px] border border-brand-border lg:h-[420px]`}>
                            <MapContainer center={position} zoom={15} minZoom={4} maxBounds={BRAZIL_BOUNDS} className="absolute inset-0 z-0">
                                <BaseTiles theme={theme} />
                                <Marker position={position} icon={marker} draggable eventHandlers={{ dragend: (e) => { const ll = (e.target as L.Marker).getLatLng(); place([ll.lat, ll.lng]); } }} />
                                <ClickToPlace onPick={place} />
                                <FollowPosition position={position} />
                            </MapContainer>
                        </div>
                    </Panel>

                    <div className="z-10 flex flex-col-reverse gap-2 border border-brand-border bg-brand-surface p-3 sm:flex-row sm:justify-end lg:sticky lg:bottom-4">
                        <Link to="/dashboard/paineis" className={crmBtn.secondary}>Cancelar</Link>
                        <button type="submit" disabled={saving || !parseCoordinates(coordsText)} className={crmBtn.primary}>
                            {saving ? (photos.some((p) => p.file) ? 'Enviando fotos…' : 'Salvando…') : isEditing ? 'Salvar alterações' : 'Cadastrar painel'}
                        </button>
                    </div>
                </div>
            </form>
        </CrmPage>
    );
}
