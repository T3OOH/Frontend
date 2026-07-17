import { useState, useEffect } from 'react';
import { Save, MapPin, Activity, Link as LinkIcon, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/Input';
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

function MapClickHandler({ setPosition }: { setPosition: (pos: [number, number]) => void }) {
    useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]); } });
    return null;
}

function MapCenterUpdater({ position }: { position: [number, number] }) {
    const map = useMap();
    useEffect(() => { if (position) map.flyTo(position, 15, { duration: 1.5 }); }, [position, map]);
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
    const [googleUrl, setGoogleUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [status, setStatus] = useState<string>('AVAILABLE');

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
        const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match) setPosition([parseFloat(match[1]), parseFloat(match[2])]);
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

            // O formatação do preço acontece estritamente aqui dentro
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
        <div className="max-w-[1400px] mx-auto w-full pb-12">
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

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="glass-panel p-5 rounded-xl flex flex-col border border-brand-border/40 shadow-sm bg-brand-surface/10">
                        <h2 className="text-sm font-semibold text-brand-text flex items-center gap-2 mb-4">
                            <ImageIcon className="w-4 h-4 text-brand-neon" />
                            Imagem do Ponto
                        </h2>
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-36 border border-brand-border border-dashed rounded-lg cursor-pointer bg-brand-black/30 hover:bg-brand-surface/50 hover:border-brand-neon transition-all relative overflow-hidden">
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
                            <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
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
                        <input type="text" placeholder="Cole o link do Google Maps aqui..." value={googleUrl} onChange={handleGoogleLinkPaste} className="w-full bg-brand-black/50 border border-brand-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-brand-text focus:border-brand-neon focus:outline-none transition-colors" />
                    </div>

                    <div className="flex-1 w-full rounded-lg overflow-hidden border border-brand-border bg-black relative min-h-[400px] z-0">
                        <MapContainer center={position} zoom={14} minZoom={3} maxBounds={worldBounds} maxBoundsViscosity={1.0} className="w-full h-full outline-none absolute inset-0" zoomControl={true}>
                            <TileLayer noWrap={true} url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            <Marker position={position} icon={neonMarker} />
                            <MapClickHandler setPosition={setPosition} />
                            <MapCenterUpdater position={position} />
                        </MapContainer>
                    </div>
                </div>
            </form>
        </div>
    );
}