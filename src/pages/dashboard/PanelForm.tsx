import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, MonitorPlay, Activity, Link as LinkIcon, Crosshair, Image as ImageIcon, UploadCloud } from 'lucide-react';
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

    const [position, setPosition] = useState<[number, number]>([-16.6869, -49.2648]); // Centralizado em Goiânia!
    const [googleUrl, setGoogleUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [imageFile, setImageFile] = useState<File | null>(null);
    // ✨ NOVO: Estado para armazenar o preview da imagem na tela
    const [imagePreview, setImagePreview] = useState<string | null>(null);

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
            // Cria uma URL local provisória para mostrar a foto imediatamente pro usuário
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const formData = new FormData(e.currentTarget);
            let uploadedUrls: string[] = [];

            if (imageFile) {
                const imageUrl = await uploadImage(imageFile);
                uploadedUrls.push(imageUrl);
            }

            const novoPainel = {
                name: formData.get('name') as string,
                lat: position[0],
                lng: position[1],
                status: formData.get('status') === 'OCCUPIED' ? 'OCCUPIED' : 
                        formData.get('status') === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE',
                size: formData.get('size') as string,
                px: formData.get('px') as string,
                impacts: formData.get('impacts') as string,
                images: uploadedUrls,
            };

            await panelsService.createPanel({
                ...novoPainel,
                status: novoPainel.status as PanelStatus 
            });
            navigate('/dashboard/paineis');
        } catch (error) {
            console.error("Erro ao salvar no banco:", error);
            alert("Erro ao salvar painel. Verifique se a API está rodando.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">

            <div className="flex items-center gap-4">
                <Link
                    to="/dashboard/paineis"
                    className="p-2.5 bg-brand-surface border border-brand-border rounded-lg text-brand-muted hover:text-brand-text hover:border-brand-neon transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-brand-text tracking-tight">Novo Painel</h1>
                    <p className="text-brand-muted">Cadastre um novo ponto de mídia OOH no seu circuito.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">

                {/* Bloco de Imagem com Preview Premium */}
                <div className="glass-panel p-8 rounded-xl space-y-6">
                    <h2 className="text-lg font-semibold text-brand-text flex items-center gap-2 border-b border-brand-border/50 pb-4">
                        <ImageIcon className="w-5 h-5 text-brand-neon" />
                        Foto do Local
                    </h2>

                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-56 border-2 border-brand-border border-dashed rounded-lg cursor-pointer bg-brand-surface/30 hover:bg-brand-surface/50 hover:border-brand-neon transition-all relative overflow-hidden">

                            {imagePreview ? (
                                // ✨ Se tem foto, mostra a imagem em tela cheia na caixa com efeito hover para trocar
                                <>
                                    <img src={imagePreview} alt="Preview do Painel" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-brand-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                                        <UploadCloud className="w-8 h-8 mb-2 text-white" />
                                        <p className="text-sm font-medium text-white">Clique para trocar a foto</p>
                                    </div>
                                </>
                            ) : (
                                // Estado vazio padrão
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-10 h-10 mb-3 text-brand-muted" />
                                    <p className="mb-2 text-sm text-brand-muted">
                                        <span className="font-semibold text-brand-neon">Clique para enviar</span> ou arraste a foto
                                    </p>
                                    <p className="text-xs text-brand-muted/70">
                                        SVG, PNG, JPG ou WEBP (Max. 5MB)
                                    </p>
                                </div>
                            )}

                            <input
                                id="dropzone-file"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageSelect}
                            />
                        </label>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-xl space-y-6">
                    <h2 className="text-lg font-semibold text-brand-text flex items-center gap-2 border-b border-brand-border/50 pb-4">
                        <MonitorPlay className="w-5 h-5 text-brand-neon" />
                        Dados do Painel
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input name="name" label="Nome da Localização" placeholder="Ex: Avenida T7 - Setor Oeste" required />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-brand-muted pl-1">Status Inicial</label>
                            <select name="status" className="w-full bg-brand-surface border border-brand-border rounded-lg px-5 py-3.5 text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-neon transition-all duration-300">
                                <option value="disponivel">Disponível</option>
                                <option value="ocupado">Ocupado</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-xl space-y-6">
                    <h2 className="text-lg font-semibold text-brand-text flex items-center gap-2 border-b border-brand-border/50 pb-4">
                        <Activity className="w-5 h-5 text-brand-neon" />
                        Especificações e Impacto
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input name="size" label="Tamanho (Metros)" placeholder="Ex: 4x8m" required />
                        <Input name="px" label="Resolução (Pixels)" placeholder="Ex: 960x1920" required />
                        <Input name="impacts" label="Impactos Diários" placeholder="Ex: 400.000/dia" required />
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-xl space-y-6">
                    <div className="flex items-center justify-between border-b border-brand-border/50 pb-4">
                        <h2 className="text-lg font-semibold text-brand-text flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-brand-neon" />
                            Posicionamento no Mapa
                        </h2>
                        <span className="text-xs text-brand-muted bg-brand-surface px-3 py-1 rounded-full border border-brand-border">
                            Clique no mapa ou cole um link
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        <div className="space-y-6 lg:col-span-1">
                            <div className="bg-brand-surface/50 p-5 rounded-lg border border-brand-border space-y-4">
                                <Input
                                    label="Importar do Google Maps"
                                    placeholder="Cole o link..."
                                    value={googleUrl}
                                    onChange={handleGoogleLinkPaste}
                                    leftIcon={<LinkIcon className="w-4 h-4" />}
                                />
                                <p className="text-xs text-brand-muted leading-relaxed">
                                    Copie o link no Google Maps e cole acima. As coordenadas serão extraídas automaticamente.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-brand-text mb-2">
                                    <Crosshair className="w-4 h-4 text-brand-neon" />
                                    Coordenadas Exatas
                                </div>
                                <Input
                                    label="Latitude"
                                    value={position[0].toFixed(6)}
                                    readOnly
                                    className="bg-brand-surface/30 text-brand-muted"
                                />
                                <Input
                                    label="Longitude"
                                    value={position[1].toFixed(6)}
                                    readOnly
                                    className="bg-brand-surface/30 text-brand-muted"
                                />
                            </div>
                        </div>

                        <div className="w-full h-[500px] lg:col-span-2 rounded-xl overflow-hidden border border-brand-border relative z-0">
                            <MapContainer
                                center={position}
                                zoom={14}
                                className="w-full h-full outline-none"
                                style={{ height: '100%', width: '100%', backgroundColor: '#000000' }}
                                zoomControl={false}
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
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => navigate('/dashboard/paineis')}
                        disabled={isSaving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        size="lg"
                        leftIcon={<Save className="w-5 h-5" />}
                        isLoading={isSaving}
                    >
                        Salvar Painel
                    </Button>
                </div>

            </form>
        </div>
    );
}