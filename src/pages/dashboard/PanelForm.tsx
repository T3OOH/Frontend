import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, MonitorPlay, Activity, Link as LinkIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { panelsService, uploadImage } from '@/services/panels.service';
import { PanelStatus } from '@/services/panels.service';

const createCustomIcon = () => {
    return L.divIcon({
        className: 'custom-marker',
        html: `
      <div style="background-color: #1C1C1E; border: 2px solid #FF5E00; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(255, 94, 0, 0.4); transition: transform 0.2s;">
        <div style="background-color: #FF5E00; width: 10px; height: 10px; border-radius: 50%;"></div>
      </div>
    `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
};

const neonMarker = createCustomIcon();

function MapClickHandler({ setPosition }: { setPosition: (pos: [number, number]) => void }) {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
}

function MapCenterUpdater({ position }: { position: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 15, { duration: 1.5 });
        }
    }, [position, map]);
    return null;
}

export function PanelForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [isLoading, setIsLoading] = useState(isEditing);
    const [initialData, setInitialData] = useState<any>(null);

    const [position, setPosition] = useState<[number, number]>([-16.6869, -49.2648]);
    const [googleUrl, setGoogleUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Busca os dados se estiver editando
    useEffect(() => {
        if (isEditing && id) {
            const fetchPanel = async () => {
                try {
                    const data = await panelsService.getPanelById(id);
                    setInitialData(data);
                    
                    if (data.lat && data.lng) {
                        setPosition([data.lat, data.lng]);
                    }
                    
                    if (data.images && data.images[0]) {
                        setImagePreview(data.images[0]);
                    }
                } catch (error) {
                    console.error("Erro ao buscar painel:", error);
                    alert("Painel não encontrado.");
                    navigate('/dashboard/paineis');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPanel();
        }
    }, [id, isEditing, navigate]);

    const handleGoogleLinkPaste = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setGoogleUrl(url);

        const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match) {
            const newLat = parseFloat(match[1]);
            const newLng = parseFloat(match[2]);
            setPosition([newLat, newLng]);
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

            // Se o usuário selecionou uma nova imagem, faz o upload
            if (imageFile) {
                const imageUrl = await uploadImage(imageFile);
                uploadedUrls = [imageUrl]; // Substitui a antiga
            }

            const panelPayload = {
                name: formData.get('name') as string,
                lat: position[0],
                lng: position[1],
                status: formData.get('status') as PanelStatus,
                size: formData.get('size') as string,
                px: formData.get('px') as string,
                impacts: formData.get('impacts') as string,
                city: formData.get('city') as string,
                state: (formData.get('state') as string).toUpperCase(),
                images: uploadedUrls,
            };

            if (isEditing && id) {
                await panelsService.updatePanel(id, panelPayload);
            } else {
                await panelsService.createPanel(panelPayload);
            }
            
            navigate('/dashboard/paineis');
        } catch (error) {
            console.error("Erro ao salvar no banco:", error);
            alert("Erro ao salvar painel. Verifique os dados e tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center h-[calc(100vh-5rem)]">
                <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] max-w-7xl mx-auto w-full">
            
            {/* Cabeçalho */}
            <div className="flex items-center gap-4 flex-shrink-0 mb-3">
                <Link
                    to="/dashboard/paineis"
                    className="p-2 bg-brand-surface border border-brand-border rounded-lg text-brand-muted hover:text-brand-text hover:border-brand-neon transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-brand-text tracking-tight leading-tight">
                        {isEditing ? 'Editar Painel' : 'Novo Painel'}
                    </h1>
                    <p className="text-xs text-brand-muted">
                        {isEditing ? 'Atualize as informações e a localização deste ponto.' : 'Cadastre um novo ponto de mídia OOH no seu circuito.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
                
                {/* =========================================
                    COLUNA ESQUERDA: DADOS DO PAINEL
                    ========================================= */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-3 h-full overflow-hidden">
                    
                    {/* Bloco 1: Foto */}
                    <div className="glass-panel p-4 rounded-xl flex flex-col flex-shrink-0 border border-brand-border/40">
                        <h2 className="text-xs font-semibold text-brand-text flex items-center gap-2 mb-2">
                            <ImageIcon className="w-4 h-4 text-brand-neon" />
                            Foto do Local
                        </h2>
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-20 border-2 border-brand-border border-dashed rounded-lg cursor-pointer bg-brand-surface/30 hover:bg-brand-surface/50 hover:border-brand-neon transition-all relative overflow-hidden">
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Preview do Painel" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-brand-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                                        <p className="text-xs font-medium text-white">Trocar foto</p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <p className="mb-0.5 text-xs text-brand-muted">
                                        <span className="font-semibold text-brand-neon">Clique para enviar</span> ou arraste
                                    </p>
                                    <p className="text-[10px] text-brand-muted/70">SVG, PNG, JPG (Max. 5MB)</p>
                                </div>
                            )}
                            <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                        </label>
                    </div>

                    {/* Bloco 2: Dados Principais */}
                    <div className="glass-panel p-4 rounded-xl flex flex-col gap-3 flex-shrink-0 border border-brand-border/40">
                        <h2 className="text-xs font-semibold text-brand-text flex items-center gap-2 border-b border-brand-border/50 pb-2">
                            <MonitorPlay className="w-4 h-4 text-brand-neon" />
                            Dados do Painel
                        </h2>
                        <Input name="name" label="Nome da Localização" defaultValue={initialData?.name} placeholder="Ex: Avenida T7 - Setor Oeste" required />
                        
                        <div className="grid grid-cols-2 gap-3">
                            <Input name="city" label="Cidade" defaultValue={initialData?.city || "Goiânia"} placeholder="Ex: Goiânia" required />
                            <Input name="state" label="Estado (UF)" defaultValue={initialData?.state || "GO"} placeholder="Ex: GO" maxLength={2} required />
                        </div>
                        
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-brand-muted pl-1">Status Operacional</label>
                            <select 
                                name="status" 
                                defaultValue={initialData?.status || "AVAILABLE"} 
                                className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-neon transition-all"
                            >
                                <option value="AVAILABLE">🟢 Disponível</option>
                                <option value="OCCUPIED">🔴 Ocupado</option>
                                <option value="MAINTENANCE">🟡 Em Manutenção</option>
                            </select>
                        </div>
                    </div>

                    {/* Bloco 3: Especificações */}
                    <div className="glass-panel p-4 rounded-xl flex flex-col gap-3 flex-shrink-0 border border-brand-border/40">
                        <h2 className="text-xs font-semibold text-brand-text flex items-center gap-2 border-b border-brand-border/50 pb-2">
                            <Activity className="w-4 h-4 text-brand-neon" />
                            Especificações e Impacto
                        </h2>
                        <div className="grid grid-cols-3 gap-3">
                            <Input name="size" label="Tamanho" defaultValue={initialData?.size} placeholder="4x8m" required />
                            <Input name="px" label="Resolução" defaultValue={initialData?.px} placeholder="960x1920" required />
                            <Input name="impacts" label="Impactos/dia" defaultValue={initialData?.impacts} placeholder="400.000" required />
                        </div>
                    </div>
                </div>

                {/* =========================================
                    COLUNA DIREITA: MAPA COM AÇÕES NO TOPO
                    ========================================= */}
                <div className="lg:col-span-7 flex flex-col h-full min-h-0 glass-panel rounded-xl overflow-hidden border border-brand-border/40">
                    
                    {/* Header do Mapa (Com Botões) */}
                    <div className="p-4 border-b border-brand-border/50 bg-brand-surface/30 flex-shrink-0">
                        
                        <div className="flex items-center justify-between mb-3 gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-brand-text flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-brand-neon" />
                                    Posicionamento Geográfico
                                </h2>
                                <span className="text-[10px] text-brand-muted mt-0.5 block">
                                    Clique no mapa para alterar ou cole o link do Maps abaixo
                                </span>
                            </div>

                            {/* Botões Finais de Ação */}
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/dashboard/paineis')} disabled={isSaving}>
                                    Cancelar
                                </Button>
                                <Button type="submit" size="sm" leftIcon={<Save className="w-4 h-4" />} isLoading={isSaving} className="px-4">
                                    {isEditing ? 'Atualizar' : 'Salvar'}
                                </Button>
                            </div>
                        </div>

                        {/* Controles do Mapa */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-brand-muted pl-1 uppercase tracking-wider">Importar Link</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LinkIcon className="h-3 w-3 text-brand-muted" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Cole o link do Google Maps..."
                                        value={googleUrl}
                                        onChange={handleGoogleLinkPaste}
                                        className="w-full bg-brand-black/50 border border-brand-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-brand-text focus:border-brand-neon focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-1/2">
                                    <label className="text-[10px] font-medium text-brand-muted pl-1 uppercase tracking-wider">Lat</label>
                                    <input value={position[0].toFixed(5)} readOnly className="w-full bg-brand-black/50 border border-brand-border rounded-lg px-2 py-1.5 text-sm text-brand-muted focus:outline-none" />
                                </div>
                                <div className="w-1/2">
                                    <label className="text-[10px] font-medium text-brand-muted pl-1 uppercase tracking-wider">Lng</label>
                                    <input value={position[1].toFixed(5)} readOnly className="w-full bg-brand-black/50 border border-brand-border rounded-lg px-2 py-1.5 text-sm text-brand-muted focus:outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Área do Mapa Renderizado */}
                    <div className="flex-1 relative bg-[#000000]">
                        <MapContainer
                            center={position}
                            zoom={14}
                            className="w-full h-full outline-none absolute inset-0"
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={true}
                        >
                            <TileLayer
                                noWrap={true}
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
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