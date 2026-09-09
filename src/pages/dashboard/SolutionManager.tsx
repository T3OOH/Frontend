import React, { useState, useRef, useEffect } from 'react';
import { Images, Plus, Trash2, Loader2, Image as ImageIcon, X, Type, UploadCloud } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { api } from '@/lib/axios';
import { uploadImage } from '@/services/panels.service';

interface PortfolioImage {
    id: string;
    url: string;
    alt: string;
}

export function SolutionManager() {
    const { addToast } = useToast();
    
    // Estados do Grid
    const [images, setImages] = useState<PortfolioImage[]>([]);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    
    // Estados do Fluxo de Upload
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [imageTitle, setImageTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ==========================================
    // BUSCA DE DADOS (VIA API BACKEND)
    // ==========================================
    const fetchImages = async () => {
        try {
            setIsLoadingInitial(true);
            const response = await api.get('/solution/portfolio');
            if (response.data && Array.isArray(response.data)) {
                setImages(response.data);
            }
        } catch (error) {
            console.error("Erro ao buscar imagens:", error);
            addToast("Erro ao carregar o portfólio.", "error");
        } finally {
            setIsLoadingInitial(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    // ==========================================
    // HANDLERS DE SELEÇÃO E UPLOAD
    // ==========================================
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            
            // Sugere o título baseado no nome do arquivo
            const suggestedTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            setImageTitle(suggestedTitle.charAt(0).toUpperCase() + suggestedTitle.slice(1));
        }
    };

    const handleCancel = () => {
        setImageFile(null);
        setPreviewUrl(null);
        setImageTitle('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) {
            addToast('Selecione uma imagem antes de salvar.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            // 1. Faz o upload da imagem usando o utilitário existente
            const uploadedUrl = await uploadImage(imageFile);

            if (!uploadedUrl) {
                throw new Error('Falha no upload da imagem.');
            }

            // 2. Salva o registro no banco de dados via API
            const payload = {
                url: uploadedUrl,
                alt: imageTitle.trim() || 'T3 Solution Portfólio'
            };

            await api.post('/solution/portfolio', payload);
            
            addToast('Imagem adicionada ao portfólio com sucesso!', 'success');
            handleCancel();
            await fetchImages(); // Recarrega o grid atualizado
        } catch (error: any) {
            console.error("Erro ao salvar no banco:", error);
            const backendMsg = error.response?.data?.error || error.response?.data?.message || 'Erro ao salvar a imagem.';
            addToast(backendMsg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente remover esta imagem do carrossel da T3 Solution?')) return;
        
        try {
            await api.delete(`/solution/portfolio/${id}`);
            setImages(prev => prev.filter(img => img.id !== id));
            addToast('Imagem removida com sucesso.', 'success');
        } catch (error: any) {
            console.error("Erro na exclusão:", error);
            addToast('Erro ao remover imagem.', 'error');
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-brand-text flex items-center gap-2">
                        <Images className="w-6 h-6 text-brand-neon" /> Gestão T3 Solution
                    </h1>
                    <p className="text-sm text-brand-muted mt-1">Gerencie as imagens exibidas no carrossel de portfólio da página T3 Solution.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUNA ESQUERDA: FORMULÁRIO */}
                <div className="lg:col-span-1 bg-brand-surface p-6 rounded-[24px] border border-brand-border shadow-sm flex flex-col h-fit">
                    <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-brand-neon" /> Nova Imagem
                    </h3>
                    
                    <form onSubmit={handleSave} className="flex flex-col gap-4">
                        <label className="border-2 border-dashed border-brand-border hover:border-brand-neon/50 bg-brand-background/50 rounded-[16px] flex flex-col items-center justify-center p-8 cursor-pointer transition-all aspect-[4/5] group relative overflow-hidden">
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover absolute inset-0 opacity-90" />
                                    <div className="absolute inset-0 bg-brand-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10">
                                        <p className="text-sm font-medium text-white">Trocar Foto</p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center text-center">
                                    <ImageIcon className="w-10 h-10 text-brand-muted mb-4 group-hover:text-brand-neon transition-colors" />
                                    <span className="text-sm font-bold text-brand-text uppercase tracking-wider mb-2">Selecionar Arquivo</span>
                                    <span className="text-[11px] text-brand-muted font-medium px-4">Utilize imagens verticais (formato retrato).</span>
                                </div>
                            )}
                            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} disabled={isSaving} />
                        </label>

                        {previewUrl && (
                            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                                <Input
                                    name="alt"
                                    label="Título / Texto Alternativo"
                                    placeholder="Ex: Painel LED Corporativo"
                                    value={imageTitle}
                                    onChange={(e) => setImageTitle(e.target.value)}
                                    disabled={isSaving}
                                    required
                                    leftIcon={<Type className="w-4 h-4 text-brand-muted" />}
                                    className="bg-brand-background border-brand-border text-brand-text"
                                />

                                <div className="flex gap-2 mt-2">
                                    <Button 
                                        type="button" 
                                        variant="secondary" 
                                        onClick={handleCancel} 
                                        disabled={isSaving}
                                        className="w-1/3 bg-brand-background border-brand-border text-brand-muted hover:text-brand-text h-12 flex items-center justify-center"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={isSaving}
                                        className="w-2/3 bg-brand-neon hover:bg-brand-neonHover text-[#0A0A0B] font-black uppercase tracking-widest text-[11px] rounded-xl h-12 shadow-[0_0_15px_rgba(255,94,0,0.15)] flex items-center justify-center"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                                        Salvar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* COLUNA DIREITA: GRID DE IMAGENS ATUAIS */}
                <div className="lg:col-span-2 bg-brand-surface p-6 md:p-8 rounded-[24px] border border-brand-border shadow-sm flex flex-col h-fit lg:min-h-[500px]">
                    <div className="flex justify-between items-center mb-6 shrink-0 border-b border-brand-border pb-4">
                        <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest flex items-center gap-2">
                            Imagens em Exibição
                        </h3>
                        <span className="text-[10px] font-bold bg-brand-background border border-brand-border px-2.5 py-1 rounded-md text-brand-text">
                            {images.length} Ativas
                        </span>
                    </div>

                    {isLoadingInitial ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-3" />
                            <p className="text-sm text-brand-muted font-medium">Buscando no servidor...</p>
                        </div>
                    ) : images.length === 0 ? (
                        <div className="flex-1 border-2 border-dashed border-brand-border rounded-[16px] bg-brand-background/50 flex flex-col items-center justify-center py-12">
                            <Images className="w-8 h-8 text-brand-muted/50 mb-3" />
                            <p className="text-sm text-brand-muted font-medium">Nenhuma imagem no carrossel.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                            {images.map((img) => (
                                <div key={img.id} className="group relative rounded-xl overflow-hidden border border-brand-border bg-black aspect-[3/4] shadow-sm flex flex-col">
                                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-40" />
                                    
                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                                        <p className="text-[10px] font-bold text-white truncate drop-shadow-md">{img.alt}</p>
                                    </div>

                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px] z-20">
                                        <button 
                                            onClick={() => handleDelete(img.id)}
                                            className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all shadow-lg active:scale-90"
                                            title="Excluir Imagem"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}