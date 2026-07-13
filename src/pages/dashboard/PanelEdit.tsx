import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, MonitorPlay, Activity, Link as LinkIcon, Crosshair, Image as ImageIcon, UploadCloud, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { panelsService, PanelStatus, uploadImage } from '@/services/panels.service';

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

export function PanelEdit() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // Pega o ID da URL

    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Estados do formulário
    const [panelName, setPanelName] = useState('');
    const [panelStatus, setPanelStatus] = useState('Disponível');
    const [panelSize, setPanelSize] = useState('');
    const [panelPx, setPanelPx] = useState('');
    const [panelImpacts, setPanelImpacts] = useState('');
    const [position, setPosition] = useState<[number, number]>([-16.6869, -49.2648]);

    const [googleUrl, setGoogleUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null); // Para mostrar a foto atual

    // 1. Busca os dados do painel ao carregar a tela
    useEffect(() => {
        const fetchPanelData = async () => {
            if (!id) return;
            try {
                const data = await panelsService.getPanelById(id);

                // Preenche os estados com os dados do banco
                setPanelName(data.name);
                setPanelStatus(data.status);
                setPanelSize(data.size);
                setPanelPx(data.px);
                setPanelImpacts(data.impacts);
                setPosition([data.lat, data.lng]);

                if (data.images && data.images.length > 0) {
                    setExistingImageUrl(data.images[0]);
                }
            } catch (error) {
                console.error("Erro ao buscar painel:", error);
                alert("Erro ao carregar dados do painel.");
                navigate('/dashboard/paineis');
            } finally {
                setIsLoadingInitial(false);
            }
        };

        fetchPanelData();
    }, [id, navigate]);

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

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!id) return;

        setIsSaving(true);

        try {
            let uploadedUrls: string[] = existingImageUrl ? [existingImageUrl] : [];

            // Se o usuário selecionou uma NOVA imagem, faz o upload e substitui a antiga
            if (imageFile) {
                const imageUrl = await uploadImage(imageFile);
                uploadedUrls = [imageUrl];
            }

            // Monta os dados atualizados
            const updatedPanel = {
                name: panelName,
                lat: position[0],
                lng: position[1],
                status: panelStatus,
                size: panelSize,
                px: panelPx,
                impacts: panelImpacts,
                images: uploadedUrls,
            };

            // Salva no banco usando a função de UPDATE
            await panelsService.updatePanel(id, {
                ...updatedPanel,
                status: updatedPanel.status as PanelStatus
            });
            navigate('/dashboard/paineis');
        } catch (error) {
            console.error("Erro ao atualizar no banco:", error);
            alert("Erro ao atualizar painel.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingInitial) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center pt-20">
                <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-4" />
                <p className="text-brand-muted">Carregando dados do painel...</p>
            </div>
        );
    }

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
                    <h1 className="text-3xl font-bold text-brand-text tracking-tight">Editar Painel</h1>
                    <p className="text-brand-muted">Atualize as informações, status ou localização do ponto.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">

                {/* Bloco de Imagem */}
                <div className="glass-panel p-8 rounded-xl space-y-6">
                    <h2 className="text-lg font-semibold text-brand-text flex items-center gap-2 border-b border-brand-border/50 pb-4">
                        <ImageIcon className="w-5 h-5 text-brand-neon" />
                        Foto do Local
                    </h2>

                    <div className="flex flex-col md:flex-row gap-6 items-center w-full">
                        {existingImageUrl && !imageFile && (
                            <div className="w-full md:w-1/3 h-40 rounded-lg overflow-hidden border border-brand-border shrink-0">
                                <img src={existingImageUrl} alt="Atual" className="w-full h-full object-cover" />
                            </div>
                        )}

                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-brand-border border-dashed rounded-lg cursor-pointer bg-brand-surface/30 hover:bg-brand-surface/50 hover:border-brand-neon transition-all">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-3 text-brand-muted" />
                                <p className="mb-2 text-sm text-brand-muted">
                                    <span className="font-semibold text-brand-neon">Clique para trocar a foto</span> ou arraste
                                </p>
                                <p className="text-xs text-brand-muted/70">
                                    {imageFile ? `Nova foto selecionada: ${imageFile.name}` : "SVG, PNG, JPG ou GIF (Max. 5MB)"}
                                </p>
                            </div>
                            <input
                                id="dropzone-file"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setImageFile(e.target.files[0]);
                                    }
                                }}
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
                        <Input
                            label="Nome da Localização"
                            value={panelName}
                            onChange={(e) => setPanelName(e.target.value)}
                            required
                        />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-brand-muted pl-1">Status Atual</label>
                            <select
                                value={panelStatus}
                                onChange={(e) => setPanelStatus(e.target.value)}
                                className="w-full bg-brand-surface border border-brand-border rounded-lg px-5 py-3.5 text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-neon transition-all duration-300"
                            >
                                <option value="Disponível">Disponível</option>
                                <option value="Ocupado">Ocupado</option>
                                <option value="Manutenção">Em Manutenção</option>
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
                        <Input
                            label="Tamanho (Metros)"
                            value={panelSize}
                            onChange={(e) => setPanelSize(e.target.value)}
                            required
                        />
                        <Input
                            label="Resolução (Pixels)"
                            value={panelPx}
                            onChange={(e) => setPanelPx(e.target.value)}
                            required
                        />
                        <Input
                            label="Impactos Diários"
                            value={panelImpacts}
                            onChange={(e) => setPanelImpacts(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-xl space-y-6">
                    <div className="flex items-center justify-between border-b border-brand-border/50 pb-4">
                        <h2 className="text-lg font-semibold text-brand-text flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-brand-neon" />
                            Posicionamento no Mapa
                        </h2>
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
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-brand-text mb-2">
                                    <Crosshair className="w-4 h-4 text-brand-neon" />
                                    Coordenadas Atuais
                                </div>
                                <Input label="Latitude" value={position[0].toFixed(6)} readOnly className="bg-brand-surface/30 text-brand-muted" />
                                <Input label="Longitude" value={position[1].toFixed(6)} readOnly className="bg-brand-surface/30 text-brand-muted" />
                            </div>
                        </div>

                        <div className="w-full h-[500px] lg:col-span-2 rounded-xl overflow-hidden border border-brand-border relative z-0">
                            <MapContainer
                                center={position}
                                zoom={15}
                                className="w-full h-full outline-none"
                                style={{ height: '100%', width: '100%', backgroundColor: '#000000' }}
                                zoomControl={false}
                            >
                                <TileLayer noWrap={true} url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                <Marker position={position} icon={neonMarker} />
                                <MapClickHandler setPosition={setPosition} />
                                <MapCenterUpdater position={position} />
                            </MapContainer>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="ghost" onClick={() => navigate('/dashboard/paineis')} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" size="lg" leftIcon={<Save className="w-5 h-5" />} isLoading={isSaving}>Salvar Alterações</Button>
                </div>
            </form>
        </div>
    );
}