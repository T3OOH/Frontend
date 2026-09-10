import { useState, useEffect } from 'react';
import { MapPin, Activity, Link as LinkIcon, Image as ImageIcon, Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { panelsService, uploadImage, PanelStatus } from '@/services/panels.service';
import { CustomSelect } from '@/components/CustomSelect';
import { useToast } from '@/contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

const neonMarker = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="background-color: #0f0f11; border: 2px solid #FF5E00; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(255, 94, 0, 0.4); overflow: hidden;">
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

function MapCenterUpdater({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        if (typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng)) {
            try {
                const size = map.getSize();
                if (size.x > 0 && size.y > 0) map.setView([lat, lng], 15, { animate: true });
            } catch (e) {
                // Ignore silent leaflet errors on mount
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

    const [currentStep, setCurrentStep] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(isEditing);
    const [initialData, setInitialData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Estados do Formulário
    const [position, setPosition] = useState<[number, number]>([-16.6869, -49.2648]);
    const [latInput, setLatInput] = useState<string>('-16.6869');
    const [lngInput, setLngInput] = useState<string>('-49.2648');
    const [googleUrl, setGoogleUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('AVAILABLE');
    
    // Demais dados (controlados por FormData nativo no onSubmit para otimização)
    const [formValues, setFormValues] = useState({
        name: '', city: 'Goiânia', state: 'GO', size: '', px: '', impacts: '', price: ''
    });

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
                    
                    setFormValues({
                        name: data.name || '',
                        city: data.city || 'Goiânia',
                        state: data.state || 'GO',
                        size: data.size || '',
                        px: data.px || '',
                        impacts: data.impacts || '',
                        price: data.price ? String(data.price) : ''
                    });
                } catch (error) {
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
            toast.error("Links encurtados não funcionam. Cole o link completo do navegador.");
            return;
        }

        const match = url.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
        if (match) {
            setPosition([parseFloat(match[1]), parseFloat(match[2])]);
            toast.success("Localização atualizada!");
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let uploadedUrls: string[] = initialData?.images || [];

            if (imageFile) {
                // AQUI ESTÁ A CORREÇÃO: Garante que o folderId aponte para a pasta raiz "panels" 
                // e crie uma subpasta com o ID do painel.
                const folderId = `panels/${panelId || window.crypto.randomUUID()}`;
                const imageUrl = await uploadImage(imageFile, folderId);
                uploadedUrls = [imageUrl];
            }

            const formattedPrice = formValues.price ? Number(formValues.price.replace(',', '.')) : 0;

            const panelPayload = {
                name: formValues.name,
                lat: position[0],
                lng: position[1],
                status: status as PanelStatus,
                size: formValues.size,
                px: formValues.px,
                impacts: formValues.impacts,
                price: formattedPrice,
                city: formValues.city,
                state: formValues.state.toUpperCase(),
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
            console.error("Erro ao salvar:", error);
            toast.error("Falha ao salvar. Verifique os campos.");
        } finally {
            setIsSaving(false);
        }
    };

    const statusOptions = [
        { value: 'AVAILABLE', label: 'Disponível' },
        { value: 'OCCUPIED', label: 'Ocupado' },
        { value: 'MAINTENANCE', label: 'Manutenção' }
    ];

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#FF5E00] animate-spin" />
            </div>
        );
    }

    const worldBounds: L.LatLngBoundsLiteral = [[-90, -180], [90, 180]];

    return (
        <div className="w-full h-full flex flex-col relative max-w-7xl mx-auto pb-12">
            
            {/* HEADER */}
            <div className="flex items-center gap-4 mb-6 shrink-0">
                <Link to="/dashboard/paineis">
                    <button className="p-2 border border-white/10 rounded-md bg-[#111113] hover:border-[#FF5E00] hover:text-[#FF5E00] transition-colors text-[#8F8F91]">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                        {isEditing ? 'Editar Ponto' : 'Cadastrar Ponto'}
                    </h1>
                    <p className="text-xs text-[#8F8F91] uppercase tracking-widest mt-0.5">Configure as informações do painel</p>
                </div>
            </div>

            {/* MAIN LAYOUT SPLIT */}
            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                
                {/* WIZARD COLUMN */}
                <div className="w-full lg:w-1/2 flex flex-col gap-6">
                    
                    {/* TABS DE NAVEGAÇÃO */}
                    <div className="flex gap-2 p-1.5 bg-[#0A0A0B] border border-white/5 rounded-md shadow-inner overflow-x-auto custom-scrollbar">
                        {[
                            { step: 1, label: 'Básico' },
                            { step: 2, label: 'Localização' },
                            { step: 3, label: 'Técnico' }
                        ].map((s) => (
                            <button
                                key={s.step}
                                onClick={() => setCurrentStep(s.step)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-sm text-[10px] uppercase font-bold tracking-widest transition-colors shrink-0 ${
                                    currentStep === s.step 
                                        ? 'bg-[#FF5E00] text-[#0A0A0B]' 
                                        : 'bg-transparent text-[#8F8F91] hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <span>{s.step}.</span> {s.label}
                            </button>
                        ))}
                    </div>

                    {/* WIZARD CONTENT */}
                    <div className="bg-[#111113] border border-white/5 rounded-md p-6 flex flex-col flex-1 shadow-xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-5 flex-1"
                            >
                                {currentStep === 1 && (
                                    <>
                                        <div className="flex flex-col gap-1.5">
                                            <h2 className="text-[13px] font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                                <ImageIcon className="w-4 h-4 text-[#FF5E00]" /> Imagem Principal
                                            </h2>
                                            <label className="flex flex-col items-center justify-center w-full h-48 border border-white/10 border-dashed rounded-md cursor-pointer bg-[#0A0A0B] hover:border-[#FF5E00]/50 transition-colors relative overflow-hidden group">
                                                {imagePreview ? (
                                                    <>
                                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-[#111113] border border-white/10 px-4 py-2 rounded-sm">Alterar Mídia</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center px-4 text-center">
                                                        <ImageIcon className="w-8 h-8 text-[#8F8F91] mb-2" />
                                                        <p className="text-[11px] text-[#8F8F91] uppercase tracking-wider"><span className="text-[#FF5E00] font-bold">Clique</span> para selecionar</p>
                                                    </div>
                                                )}
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                                            </label>
                                        </div>
                                        <div className="flex flex-col gap-1.5 mt-2">
                                            <Input name="name" label="Identificação do Painel *" value={formValues.name} onChange={e => setFormValues({...formValues, name: e.target.value})} placeholder="Ex: Av. T-7 com T-3" required className="bg-[#0A0A0B]" />
                                        </div>
                                        <div className="flex flex-col gap-1.5 mt-2 relative z-50">
                                            <label className="text-[10px] text-[#8F8F91] uppercase tracking-widest font-bold ml-1">Status Operacional</label>
                                            <CustomSelect options={statusOptions} value={status} onChange={setStatus} />
                                        </div>
                                    </>
                                )}

                                {currentStep === 2 && (
                                    <>
                                        <h2 className="text-[13px] font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                            <MapPin className="w-4 h-4 text-[#FF5E00]" /> Endereçamento
                                        </h2>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input name="city" label="Cidade *" value={formValues.city} onChange={e => setFormValues({...formValues, city: e.target.value})} required className="bg-[#0A0A0B]" />
                                            <Input name="state" label="UF *" value={formValues.state} onChange={e => setFormValues({...formValues, state: e.target.value})} maxLength={2} required className="bg-[#0A0A0B] uppercase" />
                                        </div>

                                        <div className="relative mt-2">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <LinkIcon className="h-4 w-4 text-[#8F8F91]" />
                                            </div>
                                            <input type="text" placeholder="Cole o link do Google Maps para buscar as coordenadas..." value={googleUrl} onChange={handleGoogleLinkPaste} className="w-full bg-[#0A0A0B] border border-white/10 rounded-md pl-10 pr-4 py-3 text-[13px] text-white focus:border-[#FF5E00] focus:outline-none transition-colors shadow-inner" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <Input name="lat" label="Latitude *" type="number" step="any" value={latInput} onChange={handleLatChange} required className="bg-[#0A0A0B]" />
                                            <Input name="lng" label="Longitude *" type="number" step="any" value={lngInput} onChange={handleLngChange} required className="bg-[#0A0A0B]" />
                                        </div>
                                    </>
                                )}

                                {currentStep === 3 && (
                                    <>
                                        <h2 className="text-[13px] font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                            <Activity className="w-4 h-4 text-[#FF5E00]" /> Ficha Técnica
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input name="size" label="Formato Físico *" value={formValues.size} onChange={e => setFormValues({...formValues, size: e.target.value})} placeholder="4x8m" required className="bg-[#0A0A0B]" />
                                            <Input name="px" label="Resolução (Px) *" value={formValues.px} onChange={e => setFormValues({...formValues, px: e.target.value})} placeholder="960x1920" required className="bg-[#0A0A0B]" />
                                            <Input name="impacts" label="Impactos Diários *" value={formValues.impacts} onChange={e => setFormValues({...formValues, impacts: e.target.value})} placeholder="400mil" required className="bg-[#0A0A0B]" />
                                            <Input name="price" label="Valor Base Mensal (R$) *" type="number" step="0.01" value={formValues.price} onChange={e => setFormValues({...formValues, price: e.target.value})} placeholder="1500.00" required className="bg-[#0A0A0B]" />
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* CONTROLES DE NAVEGAÇÃO DO WIZARD */}
                        <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                            <Button 
                                type="button" variant="secondary" 
                                disabled={currentStep === 1} 
                                onClick={() => setCurrentStep(c => c - 1)}
                                className="bg-[#0A0A0B] border-white/10 text-white rounded-sm text-[10px] uppercase font-bold tracking-widest px-6"
                            >
                                Voltar
                            </Button>
                            
                            {currentStep < 3 ? (
                                <Button 
                                    type="button" 
                                    onClick={() => setCurrentStep(c => c + 1)}
                                    className="bg-[#111113] border-white/10 hover:border-[#FF5E00] text-white rounded-sm text-[10px] uppercase font-bold tracking-widest px-6 flex items-center gap-2"
                                >
                                    Avançar <ArrowRight className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button 
                                    type="button" 
                                    onClick={handleSave}
                                    disabled={isSaving || !formValues.name || !formValues.size || !formValues.price}
                                    className="bg-[#25D366] border-none text-[#0A0A0B] rounded-sm text-[10px] uppercase font-black tracking-widest px-8 flex items-center gap-2 hover:bg-[#1eb858] transition-colors"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    {isSaving ? 'Salvando...' : 'Finalizar e Salvar'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* MAP PREVIEW COLUMN (SEMPRE VISÍVEL) */}
                <div className="w-full lg:w-1/2 flex flex-col h-[400px] lg:h-auto bg-[#111113] border border-white/5 rounded-md overflow-hidden shadow-xl">
                    <div className="p-4 bg-[#0A0A0B] border-b border-white/5 shrink-0 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#8F8F91]" />
                        <span className="text-[10px] uppercase font-bold text-[#8F8F91] tracking-widest">Pré-visualização do Ponto</span>
                    </div>
                    <div className="flex-1 w-full bg-black relative z-0 [&_.leaflet-layer]:filter [&_.leaflet-layer]:invert [&_.leaflet-layer]:hue-rotate-180 [&_.leaflet-layer]:brightness-95 [&_.leaflet-layer]:contrast-90">
                        <MapContainer center={position} zoom={15} minZoom={3} maxBounds={worldBounds} maxBoundsViscosity={1.0} className="w-full h-full outline-none absolute inset-0 z-0">
                            <TileLayer
                                noWrap={true}
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap'
                            />
                            <Marker position={position} icon={neonMarker} />
                            <MapClickHandler setPosition={setPosition} />
                            <MapCenterUpdater lat={position[0]} lng={position[1]} />
                        </MapContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}