import { useState, useEffect } from 'react';
import { Save, MapPin, Activity, Link as LinkIcon, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { panelsService, uploadImage, PanelStatus } from '@/services/panels.service';
import { CustomSelect } from '@/components/CustomSelect';
import { useToast } from '@/contexts/ToastContext';

const neonMarker = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="background-color: #0f0f11; border: 2px solid #FF5E00; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(255, 94, 0, 0.6); overflow: hidden;">
          <img src="/t3d 2.png" alt="T3" style="width: 22px; height: 22px; object-fit: contain;" />
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
});

/**
 * Intercepta cliques diretos no canvas do mapa.
 */
function MapClickHandler({ setPosition }: { setPosition: (pos: [number, number]) => void }) {
    useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]); } });
    return null;
}

/**
 * Atualiza o centro visual do mapa programaticamente.
 * Implementa validação estrita para ignorar mapas ocultos (responsivos) e evitar crashes do Leaflet.
 */
function MapCenterUpdater({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();

    useEffect(() => {
        if (typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng)) {
            try {
                // Trava de segurança: só move o mapa se ele estiver visível na tela (tamanho > 0)
                const size = map.getSize();
                if (size.x > 0 && size.y > 0) {
                    map.setView([lat, lng], 15, { animate: true }); // setView é muito mais estável que flyTo
                }
            } catch (e) {
                // Previne qualquer crash interno do Leaflet
            }
        }
    }, [lat, lng, map]);

    return null;
}

export function PanelForm() {
    const { panelId } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(panelId);
    const toast = useToast();

    const [isLoading, setIsLoading] = useState(isEditing);
    const [initialData, setInitialData] = useState<any>(null);

    const [position, setPosition] = useState<[number, number]>([-16.6869, -49.2648]);

    // Estados independentes para os inputs de Lat e Lng
    const [latInput, setLatInput] = useState<string>('-16.6869');
    const [lngInput, setLngInput] = useState<string>('-49.2648');

    const [googleUrl, setGoogleUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [status, setStatus] = useState<string>('AVAILABLE');

    /**
     * Sincroniza os inputs de texto com as coordenadas reais.
     */
    useEffect(() => {
        setLatInput(position[0].toString());
        setLngInput(position[1].toString());
    }, [position]);

    const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLatInput(e.target.value);
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) setPosition([val, position[1]]);
    };

    const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLngInput(e.target.value);
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) setPosition([position[0], val]);
    };

    useEffect(() => {
        if (isEditing && panelId) {
            const fetchPanel = async () => {
                try {
                    const data = await panelsService.getPanelById(panelId);
                    setInitialData(data);
                    if (data.status) setStatus(data.status);
                    if (data.lat && data.lng) setPosition([data.lat, data.lng]);
                    if (data.images && data.images[0]) setImagePreview(data.images[0]);
                } catch (error) {
                    console.error("Erro ao buscar painel:", error);
                    toast.error("Painel não encontrado.");
                    navigate('/dashboard/paineis');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPanel();
        }
    }, [panelId, isEditing, navigate, toast]);

    const handleGoogleLinkPaste = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setGoogleUrl(url);

        if (!url.trim()) return;

        if (url.includes('maps.app.goo.gl') || url.includes('g.page')) {
            toast.error("Links encurtados não funcionam. Cole o link completo do navegador ou digite as coordenadas.");
            return;
        }

        const match = url.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);

        if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            setPosition([lat, lng]);
            toast.success("Localização atualizada no mapa!");
        } else if (url.includes('google.com/maps')) {
            toast.info("Não conseguimos encontrar as coordenadas neste formato de link.");
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const formData = new FormData(e.currentTarget);
            let uploadedUrls: string[] = initialData?.images || [];

            if (imageFile) {
                const imageUrl = await uploadImage(imageFile);
                uploadedUrls = [imageUrl];
            }

            const rawPrice = formData.get('price') as string;
            const formattedPrice = rawPrice ? Number(rawPrice.replace(',', '.')) : 0;

            const panelPayload = {
                name: formData.get('name') as string,
                lat: position[0],
                lng: position[1],
                status: status as PanelStatus,
                size: formData.get('size') as string,
                px: formData.get('px') as string,
                impacts: formData.get('impacts') as string,
                price: formattedPrice,
                city: formData.get('city') as string,
                state: (formData.get('state') as string).toUpperCase(),
                images: uploadedUrls,
            };

            if (isEditing && panelId) {
                await panelsService.updatePanel(panelId, panelPayload);
                toast.success("Painel atualizado com sucesso!");
            } else {
                await panelsService.createPanel(panelPayload);
                toast.success("Painel criado com sucesso!");
            }

            navigate('/dashboard/paineis');
        } catch (error: any) {
            console.error("Erro ao salvar no banco:", error);
            const backendMsg = error.response?.data?.message || error.response?.data?.error || "Verifique os dados.";
            toast.error(`Falha ao salvar: ${typeof backendMsg === 'string' ? backendMsg : JSON.stringify(backendMsg)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const worldBounds: L.LatLngBoundsLiteral = [[-90, -180], [90, 180]];

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
            </div>
        );
    }

    const statusOptions = [
        { value: 'AVAILABLE', label: 'Disponível' },
        { value: 'OCCUPIED', label: 'Ocupado' },
        { value: 'MAINTENANCE', label: 'Manutenção' }
    ];

    return (
        <div className="w-full h-full flex flex-col relative">

            {/* DESKTOP LAYOUT */}
            <div className="hidden lg:block max-w-[1400px] mx-auto w-full pb-12">
                <div className="flex items-center gap-4 mb-6">
                    <Link to="/dashboard/paineis">
                        <button className="p-2 hover:bg-brand-surface/80 rounded-lg transition-colors text-brand-muted hover:text-white bg-brand-surface/30 border border-brand-border/40 flex items-center justify-center">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </Link>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        {isEditing ? 'Editar Painel' : 'Novo Painel'}
                    </h1>
                </div>

                <form id="desktop-panel-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="glass-panel p-5 rounded-xl flex flex-col border border-brand-border/40 shadow-sm bg-brand-surface/10">
                            <h2 className="text-sm font-semibold text-brand-text flex items-center gap-2 mb-4">
                                <ImageIcon className="w-4 h-4 text-brand-neon" />
                                Imagem do Ponto
                            </h2>
                            <label htmlFor="dropzone-file-desktop" className="flex flex-col items-center justify-center w-full h-36 border border-brand-border border-dashed rounded-lg cursor-pointer bg-brand-black/30 hover:bg-brand-surface/50 hover:border-brand-neon transition-all relative overflow-hidden">
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Preview do Painel" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-brand-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <p className="text-sm font-medium text-white">Trocar Foto</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center">
                                        <p className="text-sm text-brand-muted"><span className="text-brand-neon font-medium">Clique</span> ou arraste a imagem</p>
                                        <p className="text-xs text-brand-muted/70 mt-1">Será convertida para WEBP (Max. 5MB)</p>
                                    </div>
                                )}
                                <input id="dropzone-file-desktop" type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                            </label>
                        </div>

                        <div className="glass-panel p-5 rounded-xl flex flex-col gap-4 border border-brand-border/40 shadow-sm bg-brand-surface/10 relative z-10">
                            <h2 className="text-sm font-semibold text-brand-text flex items-center gap-2 border-b border-brand-border/30 pb-3 mb-1">
                                <MapPin className="w-4 h-4 text-brand-neon" />
                                Logradouro do Painel
                            </h2>
                            <Input name="name" label="Nome da Localização" defaultValue={initialData?.name} placeholder="Ex: Av T7 - Setor Oeste" required />
                            <div className="grid grid-cols-2 gap-4">
                                <Input name="city" label="Cidade" defaultValue={initialData?.city || "Goiânia"} placeholder="Goiânia" required />
                                <Input name="state" label="Estado (UF)" defaultValue={initialData?.state || "GO"} placeholder="GO" maxLength={2} required />
                            </div>
                        </div>

                        <div className="glass-panel p-5 rounded-xl flex flex-col gap-4 border border-brand-border/40 shadow-sm bg-brand-surface/10 flex-1 relative z-20">
                            <h2 className="text-sm font-semibold text-brand-text flex items-center gap-2 border-b border-brand-border/30 pb-3 mb-1">
                                <Activity className="w-4 h-4 text-brand-neon" />
                                Informações do Painel
                            </h2>
                            <div className="grid grid-cols-2 gap-4 items-end">
                                <Input name="size" label="Tamanho" defaultValue={initialData?.size} placeholder="4x8m" required />
                                <Input name="px" label="Resolução" defaultValue={initialData?.px} placeholder="960x1920" required />
                                <Input name="impacts" label="Impacto Diário" defaultValue={initialData?.impacts} placeholder="400.000" required />
                                <Input name="price" type="number" step="0.01" label="Valor Mensal (R$)" defaultValue={initialData?.price} placeholder="1500.00" required />
                                <div className="col-span-2 flex flex-col justify-end gap-[6px] relative z-50 mt-1">
                                    <label className="text-sm font-medium text-brand-muted">Status</label>
                                    <CustomSelect options={statusOptions} value={status} onChange={setStatus} placeholder="Selecione..." />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7 glass-panel p-5 rounded-xl flex flex-col border border-brand-border/40 shadow-sm bg-brand-surface/10 h-full relative z-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                            <h2 className="text-sm font-semibold text-brand-text flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-brand-neon" />
                                Posicionamento no Mapa
                            </h2>
                            <div className="flex justify-end gap-3 w-full sm:w-auto">
                                <button type="button" onClick={() => navigate('/dashboard/paineis')} className="px-5 py-2 rounded-lg text-sm font-medium text-brand-muted hover:text-white border border-brand-border/60 hover:border-brand-border bg-transparent hover:bg-brand-surface/50 transition-all">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSaving} className="px-6 py-2 rounded-lg text-sm font-bold text-brand-black bg-brand-neon hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Salvar
                                </button>
                            </div>
                        </div>

                        <div className="relative mb-4 shrink-0">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <LinkIcon className="h-4 w-4 text-brand-muted" />
                            </div>
                            <input type="text" placeholder="Cole o link completo do Google Maps ou as coordenadas..." value={googleUrl} onChange={handleGoogleLinkPaste} className="w-full bg-brand-black/50 border border-brand-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-brand-text focus:border-brand-neon focus:outline-none transition-colors" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 shrink-0">
                            <Input
                                name="lat"
                                label="Latitude"
                                type="number"
                                step="any"
                                value={latInput}
                                onChange={handleLatChange}
                                placeholder="-16.6869"
                                required
                            />
                            <Input
                                name="lng"
                                label="Longitude"
                                type="number"
                                step="any"
                                value={lngInput}
                                onChange={handleLngChange}
                                placeholder="-49.2648"
                                required
                            />
                        </div>

                        {/* MAPA DESKTOP MODIFICADO: OpenStreetMap + Tailwind CSS Filters para Dark Mode */}
                        <div className="flex-1 w-full rounded-lg overflow-hidden border border-brand-border bg-[#0A0A0B] relative min-h-[400px] z-0 [&_.leaflet-layer]:filter [&_.leaflet-layer]:invert [&_.leaflet-layer]:hue-rotate-180 [&_.leaflet-layer]:brightness-95 [&_.leaflet-layer]:contrast-90">
                            <MapContainer
                                center={position}
                                zoom={14}
                                minZoom={3}
                                maxBounds={worldBounds}
                                maxBoundsViscosity={1.0}
                                className="w-full h-full outline-none absolute inset-0 z-0 bg-[#0A0A0B] [&_.leaflet-layer]:filter [&_.leaflet-layer]:invert [&_.leaflet-layer]:grayscale [&_.leaflet-layer]:brightness-10 [&_.leaflet-layer]:contrast-125"
                                zoomControl={true}
                            >
                                <TileLayer
                                    noWrap={true}
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                />
                                <Marker position={position} icon={neonMarker} />
                                <MapClickHandler setPosition={setPosition} />
                                <MapCenterUpdater lat={position[0]} lng={position[1]} />
                            </MapContainer>
                        </div>
                    </div>
                </form>
            </div>

            {/* MOBILE LAYOUT */}
            <div className="flex lg:hidden flex-col w-full relative">

                <div className="flex items-center gap-3 mb-6 shrink-0">
                    <Link to="/dashboard/paineis">
                        <button className="p-2 bg-[#111113] border border-white/5 rounded-full shadow-md active:scale-95 transition-transform text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">{isEditing ? 'Editar Painel' : 'Novo Painel'}</h1>
                        <p className="text-[11px] text-brand-muted mt-0.5">Preencha as informações do ponto</p>
                    </div>
                </div>

                <form id="mobile-panel-form" onSubmit={handleSave} className="flex flex-col gap-6">

                    <div className="bg-[#111113] border border-white/5 rounded-[20px] p-4 flex flex-col shadow-md">
                        <h2 className="text-[13px] font-bold text-white flex items-center gap-2 mb-3">
                            <ImageIcon className="w-4 h-4 text-brand-neon" /> Imagem do Ponto
                        </h2>
                        <label htmlFor="dropzone-file-mobile" className="flex flex-col items-center justify-center w-full h-40 border border-brand-border/40 border-dashed rounded-xl cursor-pointer bg-[#0A0A0B] relative overflow-hidden">
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Preview do Painel" className="w-full h-full object-cover opacity-80" />
                                    <div className="absolute bottom-2 right-2 bg-[#0A0A0B]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
                                        <p className="text-[10px] font-bold text-white uppercase tracking-wider">Trocar Foto</p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center px-4">
                                    <ImageIcon className="w-8 h-8 text-brand-border mb-2" />
                                    <p className="text-xs text-brand-muted font-medium">Toque para selecionar a imagem</p>
                                </div>
                            )}
                            <input id="dropzone-file-mobile" type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                        </label>
                    </div>

                    <div className="bg-[#111113] border border-white/5 rounded-[20px] p-4 flex flex-col shadow-md gap-4">
                        <h2 className="text-[13px] font-bold text-white flex items-center gap-2 pb-2 border-b border-white/5">
                            <MapPin className="w-4 h-4 text-brand-neon" /> Logradouro
                        </h2>
                        <Input name="name" label="Nome da Localização *" defaultValue={initialData?.name} placeholder="Ex: Av T7 - Setor Oeste" required className="bg-[#0A0A0B]" />
                        <div className="grid grid-cols-2 gap-3">
                            <Input name="city" label="Cidade *" defaultValue={initialData?.city || "Goiânia"} placeholder="Goiânia" required className="bg-[#0A0A0B]" />
                            <Input name="state" label="Estado *" defaultValue={initialData?.state || "GO"} placeholder="GO" maxLength={2} required className="bg-[#0A0A0B]" />
                        </div>
                    </div>

                    <div className="bg-[#111113] border border-white/5 rounded-[20px] p-4 flex flex-col shadow-md gap-4">
                        <h2 className="text-[13px] font-bold text-white flex items-center gap-2 pb-2 border-b border-white/5">
                            <Activity className="w-4 h-4 text-brand-neon" /> Ficha Técnica
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <Input name="size" label="Tamanho *" defaultValue={initialData?.size} placeholder="4x8m" required className="bg-[#0A0A0B]" />
                            <Input name="px" label="Resolução *" defaultValue={initialData?.px} placeholder="960x1920" required className="bg-[#0A0A0B]" />
                            <Input name="impacts" label="Impactos/Dia *" defaultValue={initialData?.impacts} placeholder="400mil" required className="bg-[#0A0A0B]" />
                            <Input name="price" type="number" step="0.01" label="Valor (R$) *" defaultValue={initialData?.price} placeholder="1500.00" required className="bg-[#0A0A0B]" />
                        </div>
                        <div className="flex flex-col gap-1.5 mt-1 relative z-50">
                            <label className="text-[11px] font-medium text-brand-muted ml-1">Status Operacional</label>
                            <CustomSelect options={statusOptions} value={status} onChange={setStatus} placeholder="Selecione..." />
                        </div>
                    </div>

                    <div className="bg-[#111113] border border-white/5 rounded-[20px] p-4 flex flex-col shadow-md">
                        <h2 className="text-[13px] font-bold text-white flex items-center gap-2 pb-3">
                            <MapPin className="w-4 h-4 text-brand-neon" /> Posicionamento no Mapa
                        </h2>

                        <div className="relative mb-4">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LinkIcon className="h-4 w-4 text-brand-muted" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cole o link completo do Google Maps ou as coordenadas..."
                                value={googleUrl}
                                onChange={handleGoogleLinkPaste}
                                className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl pl-9 pr-3 py-3 text-xs text-brand-text focus:border-brand-neon focus:outline-none transition-colors shadow-inner"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <Input
                                name="lat"
                                label="Latitude *"
                                type="number"
                                step="any"
                                value={latInput}
                                onChange={handleLatChange}
                                placeholder="-16.6869"
                                required
                                className="bg-[#0A0A0B]"
                            />
                            <Input
                                name="lng"
                                label="Longitude *"
                                type="number"
                                step="any"
                                value={lngInput}
                                onChange={handleLngChange}
                                placeholder="-49.2648"
                                required
                                className="bg-[#0A0A0B]"
                            />
                        </div>

                        {/* MAPA MOBILE MODIFICADO: OpenStreetMap + Tailwind CSS Filters para Dark Mode */}
                        <div className="w-full h-[300px] rounded-xl overflow-hidden border border-brand-border/40 bg-[#0A0A0B] relative z-0 [&_.leaflet-layer]:filter [&_.leaflet-layer]:invert [&_.leaflet-layer]:hue-rotate-180 [&_.leaflet-layer]:brightness-95 [&_.leaflet-layer]:contrast-90">
                            <MapContainer center={position} zoom={15} minZoom={3} maxBounds={worldBounds} maxBoundsViscosity={1.0} className="w-full h-full outline-none absolute inset-0" zoomControl={false}>
                                <TileLayer
                                    noWrap={true}
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                />
                                <Marker position={position} icon={neonMarker} />
                                <MapClickHandler setPosition={setPosition} />
                                <MapCenterUpdater lat={position[0]} lng={position[1]} />
                            </MapContainer>
                        </div>
                        <p className="text-[10px] text-brand-muted/70 text-center mt-3">Toque no mapa para ajustar a posição do pino.</p>
                    </div>

                </form>

                <div className="h-[200px] w-full shrink-0 pointer-events-none" aria-hidden="true" />

                <div className="fixed bottom-[72px] left-0 right-0 p-4 bg-[#0A0A0B]/95 backdrop-blur-2xl border-t border-brand-border/20 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] z-[90] pb-safe flex gap-3">
                    <Link to="/dashboard/paineis" className="w-1/3">
                        <Button
                            variant="secondary"
                            className="w-full h-14 bg-[#111113] border-white/10 text-brand-muted hover:text-white rounded-2xl text-[13px] font-bold"
                        >
                            Cancelar
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        form="mobile-panel-form"
                        disabled={isSaving}
                        className="w-2/3 h-14 bg-brand-neon hover:bg-[#FF5E00]/90 text-[#0A0A0B] font-black uppercase tracking-widest text-[13px] rounded-2xl shadow-[0_10px_25px_rgba(255,94,0,0.35)] active:scale-[0.98] transition-all border-none"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                        {isSaving ? 'Salvando...' : 'Salvar Painel'}
                    </Button>
                </div>
            </div>

        </div>
    );
}