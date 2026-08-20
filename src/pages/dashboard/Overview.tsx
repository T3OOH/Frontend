import { useState, useEffect, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { 
    MonitorPlay, CheckCircle, XCircle, TrendingUp, BarChart2, Clock, 
    Loader2, Trophy, Upload, Trash2, Plus, Image as ImageIcon, Link as LinkIcon, Type, Hash, Crop
} from 'lucide-react';
import { panelsService, PanelData } from '@/services/panels.service';
import { crmService } from '@/services/crm.service';
import { bannerService, BannerData } from '@/services/banner.service';
import { api } from '@/lib/axios';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

// ==========================================
// FUNÇÃO UTILITÁRIA DE RECORTE (CANVAS)
// ==========================================
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<File> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Falha ao instanciar o canvas.');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas vazio.'));
                return;
            }
            const file = new File([blob], 'banner-t3-cropped.jpeg', { type: 'image/jpeg' });
            resolve(file);
        }, 'image/jpeg', 0.95);
    });
}

export function Overview() {
    const { addToast } = useToast();
    
    const [panels, setPanels] = useState<PanelData[]>([]);
    const [deals, setDeals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [banners, setBanners] = useState<BannerData[]>([]);
    const [isLoadingBanners, setIsLoadingBanners] = useState(false);
    const [isSubmittingBanner, setIsSubmittingBanner] = useState(false);
    
    const [bannerTitle, setBannerTitle] = useState('');
    const [bannerLink, setBannerLink] = useState('');
    const [bannerOrder, setBannerOrder] = useState('0');

    // Estados do Cropper
    const [rawImageFile, setRawImageFile] = useState<string | null>(null);
    const [croppedFile, setCroppedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [panelsData, dealsData, bannersData] = await Promise.all([
                    panelsService.getAllPanels().catch(() => []),
                    crmService.getGlobalDeals().catch(() => []),
                    bannerService.getAllBanners().catch(() => [])
                ]);
                setPanels(panelsData);
                setDeals(dealsData);
                setBanners(bannersData);
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const reloadBanners = async () => {
        try {
            setIsLoadingBanners(true);
            const data = await bannerService.getAllBanners();
            setBanners(data);
        } catch (error) {
            addToast('Erro ao atualizar lista de banners.', 'error');
        } finally {
            setIsLoadingBanners(false);
        }
    };

    // Cálculos
    const totalPanels = panels.length;
    const availablePanels = panels.filter(p => p.status === 'AVAILABLE').length;
    const occupiedPanels = panels.filter(p => p.status === 'OCCUPIED').length;

    const totalImpacts = panels.reduce((acc, curr) => {
        let val = curr.impacts;
        if (!val) return acc;
        if (typeof val === 'string') {
            const numericPart = parseFloat(val.replace(/[^0-9,.]/g, '').replace(',', '.'));
            if (isNaN(numericPart)) return acc;
            if (val.toLowerCase().includes('mil')) return acc + (numericPart * 1000);
            if (val.toLowerCase().includes('mi') && !val.toLowerCase().includes('mil')) return acc + (numericPart * 1000000);
            return acc + numericPart;
        }
        return acc + (Number(val) || 0);
    }, 0);

    const formatImpacts = (num: number) => {
        if (num === 0) return '0';
        if (num >= 1000000) return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1).replace('.', ',')} mi`;
        if (num >= 1000) return `${Math.floor(num / 1000)} mil`;
        return num.toString();
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const wonDeals = deals.filter(d => d.status === 'WON');
    const totalWonValue = wonDeals.reduce((sum, d) => sum + (Number(d.expectedValue) || 0), 0);

    const sellerStatsMap = wonDeals.reduce((acc: Record<string, number>, deal: any) => {
        const sellerName = String(deal.seller?.name || 'Vendas Diretas / Sistema');
        const value = Number(deal.expectedValue) || 0;
        acc[sellerName] = (acc[sellerName] || 0) + value;
        return acc;
    }, {});

    const sellerStats = Object.entries(sellerStatsMap)
        .map(([name, totalValue]) => {
            const total = Number(totalValue) || 0; 
            return { name, total, percentage: totalWonValue > 0 ? (total / totalWonValue) * 100 : 0 };
        })
        .sort((a, b) => b.total - a.total);

    // ==========================================
    // FLUXO DO CROPPER
    // ==========================================
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const rawUrl = URL.createObjectURL(file);
            setRawImageFile(rawUrl);
            setIsCropModalOpen(true);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const confirmCrop = async () => {
        try {
            if (!rawImageFile || !croppedAreaPixels) return;
            const finalFile = await getCroppedImg(rawImageFile, croppedAreaPixels);
            
            setCroppedFile(finalFile);
            setPreviewUrl(URL.createObjectURL(finalFile));
            setIsCropModalOpen(false);
            setRawImageFile(null);
        } catch (e) {
            addToast('Erro ao recortar a imagem.', 'error');
        }
    };

    const cancelCrop = () => {
        setIsCropModalOpen(false);
        setRawImageFile(null);
    };

    // ==========================================
    // ENVIO PARA O BACKEND
    // ==========================================
    const handleBannerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!croppedFile) {
            addToast('Selecione e recorte uma imagem para o banner.', 'error');
            return;
        }

        setIsSubmittingBanner(true);
        try {
            const formData = new FormData();
            formData.append('file', croppedFile);

            const uploadRes = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const uploadedImageUrl = uploadRes.data.url || uploadRes.data.fileUrl || uploadRes.data[0];

            if (!uploadedImageUrl) throw new Error('Falha ao obter URL da imagem.');

            await bannerService.createBanner({
                title: bannerTitle,
                linkUrl: bannerLink || undefined,
                imageUrl: uploadedImageUrl,
                isActive: true,
                order: Number(bannerOrder) || 0
            });

            addToast('Banner publicado com sucesso!', 'success');
            
            setBannerTitle('');
            setBannerLink('');
            setBannerOrder('0');
            setCroppedFile(null);
            setPreviewUrl(null);
            
            reloadBanners();
        } catch (error) {
            console.error("[Overview] Erro no upload de banner:", error);
            addToast('Erro ao processar e salvar o banner.', 'error');
        } finally {
            setIsSubmittingBanner(false);
        }
    };

    const handleDeleteBanner = async (id: string) => {
        if (!confirm('Deseja realmente remover este banner da plataforma?')) return;
        try {
            await bannerService.deleteBanner(id);
            addToast('Banner removido com sucesso.', 'success');
            reloadBanners();
        } catch (error) {
            addToast('Erro ao remover banner.', 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center h-full w-full">
                <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-10">
            
            {/* Modal de Recorte de Imagem */}
            {isCropModalOpen && rawImageFile && (
                <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-brand-surface border border-brand-border rounded-[24px] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-5 border-b border-brand-border flex justify-between items-center bg-brand-background/50">
                            <h3 className="text-brand-text font-bold flex items-center gap-2">
                                <Crop className="w-5 h-5 text-brand-neon" /> Ajustar Banner
                            </h3>
                            <button onClick={cancelCrop} className="text-brand-muted hover:text-red-500 transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="relative w-full h-[50vh] bg-brand-background">
                            <Cropper
                                image={rawImageFile}
                                crop={crop}
                                zoom={zoom}
                                aspect={21 / 9}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        <div className="p-6 flex flex-col md:flex-row items-center gap-4 justify-between bg-brand-surface">
                            <div className="flex w-full md:w-1/2 items-center gap-3">
                                <span className="text-xs font-bold text-brand-muted">Zoom</span>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full accent-brand-neon"
                                />
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <Button variant="secondary" onClick={cancelCrop} className="flex-1 md:w-auto border-brand-border bg-brand-background text-brand-text">Cancelar</Button>
                                <Button onClick={confirmCrop} className="flex-1 md:w-auto bg-brand-neon text-white font-bold">Aplicar Recorte</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl md:text-3xl font-bold text-brand-text tracking-tight">Visão Geral</h1>
                <p className="text-sm text-brand-muted">Acompanhe as métricas principais e gerencie os banners da plataforma.</p>
            </div>

            {/* METRICS GRID - ESTILO XENITH (Responsivo 2 colunas mobile, 4 desktop) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-brand-surface p-5 md:p-6 rounded-[24px] border border-brand-border shadow-sm flex flex-col justify-between h-36 md:h-40 transition-shadow hover:shadow-md">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] md:text-xs font-bold text-brand-muted uppercase tracking-widest">Painéis</span>
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                            <MonitorPlay className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-brand-text tracking-tight">{totalPanels}</h3>
                </div>

                <div className="bg-brand-surface p-5 md:p-6 rounded-[24px] border border-brand-border shadow-sm flex flex-col justify-between h-36 md:h-40 transition-shadow hover:shadow-md">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] md:text-xs font-bold text-brand-muted uppercase tracking-widest">Livres</span>
                        <div className="p-2 rounded-xl bg-[#25D366]/10 text-[#25D366]">
                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-brand-text tracking-tight">{availablePanels}</h3>
                </div>

                <div className="bg-brand-surface p-5 md:p-6 rounded-[24px] border border-brand-border shadow-sm flex flex-col justify-between h-36 md:h-40 transition-shadow hover:shadow-md">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] md:text-xs font-bold text-brand-muted uppercase tracking-widest">Ocupados</span>
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                            <XCircle className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-brand-text tracking-tight">{occupiedPanels}</h3>
                </div>

                <div className="bg-brand-surface p-5 md:p-6 rounded-[24px] border border-brand-border shadow-sm flex flex-col justify-between h-36 md:h-40 transition-shadow hover:shadow-md">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] md:text-xs font-bold text-brand-muted uppercase tracking-widest">Impactos</span>
                        <div className="p-2 rounded-xl bg-brand-neon/10 text-brand-neon">
                            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-brand-text tracking-tight">{formatImpacts(totalImpacts)}</h3>
                </div>
            </div>

            {/* CHARTS / RANKING SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Ranking (Ocupa 2 colunas no Desktop) */}
                <div className="lg:col-span-2 bg-brand-surface p-6 md:p-8 rounded-[24px] border border-brand-border shadow-sm flex flex-col h-[380px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-base font-bold text-brand-text flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-brand-neon" />
                            Ranking Comercial
                        </h2>
                        <span className="text-xs font-bold text-[#25D366] bg-[#25D366]/10 px-3 py-1.5 rounded-lg border border-[#25D366]/20 self-start sm:self-auto">
                            Faturamento: {formatCurrency(totalWonValue)}
                        </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {sellerStats.length === 0 ? (
                            <div className="h-full flex items-center justify-center border-2 border-dashed border-brand-border rounded-[16px] bg-brand-background/50">
                                <p className="text-sm font-medium text-brand-muted">Nenhuma venda concluída ainda.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6 pb-2">
                                {sellerStats.map((seller, index) => (
                                    <div key={index} className="flex flex-col gap-2.5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-bold text-brand-text flex items-center gap-2">
                                                {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                                                {index > 0 && <span className="text-brand-muted font-black w-4 text-center">{index + 1}º</span>}
                                                {seller.name}
                                            </span>
                                            <span className="text-sm font-black text-brand-text">{formatCurrency(seller.total)}</span>
                                        </div>
                                        <div className="w-full bg-brand-background rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${index === 0 ? 'bg-brand-neon shadow-[0_0_10px_rgba(255,94,0,0.3)]' : 'bg-brand-muted/50'}`}
                                                style={{ width: `${seller.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Atualizações (1 Coluna) */}
                <div className="lg:col-span-1 bg-brand-surface p-6 md:p-8 rounded-[24px] border border-brand-border shadow-sm flex flex-col h-[380px]">
                    <h2 className="text-base font-bold text-brand-text flex items-center gap-2 mb-6 shrink-0">
                        <Clock className="w-5 h-5 text-brand-neon" /> Atualizações
                    </h2>
                    <div className="flex-1 border-2 border-dashed border-brand-border rounded-[16px] flex items-center justify-center bg-brand-background/50">
                        <p className="text-sm font-medium text-brand-muted">Novidades em Breve</p>
                    </div>
                </div>
            </div>

            {/* BANNERS MANAGER */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 border-b border-brand-border pb-4">
                    <ImageIcon className="w-6 h-6 text-brand-neon" /> 
                    <h2 className="text-xl font-bold text-brand-text">Gerenciador de Banners</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Fomulário (1 Coluna) */}
                    <div className="lg:col-span-1 bg-brand-surface p-6 md:p-8 rounded-[24px] border border-brand-border shadow-sm flex flex-col h-fit">
                        <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-brand-neon" /> Criar Novo
                        </h3>
                        
                        <form onSubmit={handleBannerSubmit} className="space-y-5">
                            {/* Dropzone */}
                            <div 
                                className={`border-2 border-dashed rounded-[16px] flex flex-col items-center justify-center p-0 cursor-pointer transition-all relative overflow-hidden group aspect-[21/9] w-full ${
                                    previewUrl ? 'border-brand-neon/50 bg-black' : 'border-brand-border hover:border-brand-neon/50 bg-brand-background/50'
                                }`}
                                onClick={() => fileInputRef.current?.click()}
                                title="Clique para selecionar uma imagem"
                            >
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Preview do Banner" className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                                            <Crop className="w-6 h-6 text-white mb-2" />
                                            <span className="text-xs font-bold text-white uppercase tracking-widest">Alterar Imagem</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-4 text-center">
                                        <ImageIcon className="w-8 h-8 text-brand-muted mb-3 group-hover:text-brand-neon transition-colors" />
                                        <span className="text-xs font-bold text-brand-text uppercase tracking-wider">Fazer Upload</span>
                                        <span className="text-[10px] text-brand-muted mt-1 font-medium">Será ajustada para 21:9</span>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
                            </div>

                            {/* Inputs */}
                            <div className="space-y-4">
                                <Input
                                    label="Título (Uso Interno)"
                                    placeholder="Ex: Campanha Dia das Mães"
                                    value={bannerTitle}
                                    onChange={(e) => setBannerTitle(e.target.value)}
                                    leftIcon={<Type className="w-4 h-4 text-brand-muted" />}
                                    className="bg-brand-background border-brand-border text-brand-text h-11"
                                />
                                <Input
                                    label="Link de Destino (Opcional)"
                                    placeholder="https://t3ooh.com/..."
                                    value={bannerLink}
                                    onChange={(e) => setBannerLink(e.target.value)}
                                    leftIcon={<LinkIcon className="w-4 h-4 text-brand-muted" />}
                                    className="bg-brand-background border-brand-border text-brand-text h-11"
                                />
                                <Input
                                    label="Ordem de Exibição"
                                    type="number"
                                    min="0"
                                    placeholder="0 para ser o primeiro"
                                    value={bannerOrder}
                                    onChange={(e) => setBannerOrder(e.target.value)}
                                    leftIcon={<Hash className="w-4 h-4 text-brand-muted" />}
                                    className="bg-brand-background border-brand-border text-brand-text h-11"
                                />
                            </div>

                            <Button 
                                type="submit" 
                                isLoading={isSubmittingBanner} 
                                disabled={!croppedFile}
                                className="w-full h-12 bg-brand-neon hover:bg-brand-neonHover text-white font-bold uppercase tracking-widest text-[11px] rounded-xl transition-all"
                            >
                                <Upload className="w-4 h-4 mr-2" /> Publicar Banner
                            </Button>
                        </form>
                    </div>

                    {/* Lista (2 Colunas) */}
                    <div className="lg:col-span-2 bg-brand-surface p-6 md:p-8 rounded-[24px] border border-brand-border shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest flex items-center gap-2">
                                Banners Ativos
                            </h3>
                            <span className="text-[10px] font-bold bg-brand-background border border-brand-border px-2.5 py-1 rounded-md text-brand-text">
                                {banners.length} Exibindo
                            </span>
                        </div>

                        {isLoadingBanners ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-10">
                                <Loader2 className="w-6 h-6 text-brand-neon animate-spin mb-3" />
                            </div>
                        ) : banners.length === 0 ? (
                            <div className="flex-1 border-2 border-dashed border-brand-border rounded-[16px] bg-brand-background/50 flex flex-col items-center justify-center py-12">
                                <ImageIcon className="w-8 h-8 text-brand-muted/50 mb-3" />
                                <p className="text-sm text-brand-muted font-medium">Nenhum banner ativo na plataforma.</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {banners.map((banner) => (
                                        <div key={banner.id} className="group relative rounded-[16px] overflow-hidden border border-brand-border bg-black aspect-[21/9] shadow-sm flex flex-col">
                                            <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-40" />
                                            
                                            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded text-[10px] font-bold text-white z-10">
                                                Ordem: {banner.order}
                                            </div>

                                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px] z-20">
                                                <button 
                                                    onClick={() => handleDeleteBanner(banner.id)}
                                                    className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all shadow-lg"
                                                    title="Excluir Banner"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}