import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Building2, Users, Image as ImageIcon, Loader2, Target, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useToast } from '@/contexts/ToastContext';
import { uploadImage } from '@/services/panels.service';
import { api } from '@/lib/axios';

interface TeamMember {
    id: string;
    name: string;
    role: string;
    bio: string;
    image: string;
    _file?: File | null;
    _preview?: string;
}

interface PartnerBrand {
    id: string;
    name: string;
    logo: string;
    _file?: File | null;
    _preview?: string;
}

export function DashboardInfo() {
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [team, setTeam] = useState<TeamMember[]>([]);
    const [brands, setBrands] = useState<PartnerBrand[]>([]);

    useEffect(() => {
        const fetchInfoData = async () => {
            setIsLoading(true);
            try {
                const res = await api.get('/institutional');
                
                let fetchedTeam = res.data?.team || [];
                let fetchedBrands = res.data?.brands || [];

                if (typeof fetchedTeam === 'string') {
                    try { fetchedTeam = JSON.parse(fetchedTeam); } catch (e) {}
                }
                if (typeof fetchedBrands === 'string') {
                    try { fetchedBrands = JSON.parse(fetchedBrands); } catch (e) {}
                }

                setTeam(fetchedTeam);
                setBrands(fetchedBrands);
            } catch (error) {
                console.error("Erro ao carregar dados no painel:", error);
                toast.error("Erro ao carregar os dados atuais.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInfoData();
    }, []);

    const addTeamMember = () => {
        setTeam([...team, { id: window.crypto.randomUUID(), name: '', role: '', bio: '', image: '' }]);
    };

    const removeTeamMember = (id: string) => {
        setTeam(team.filter(m => m.id !== id));
    };

    const updateTeamMember = (id: string, field: keyof TeamMember, value: string) => {
        setTeam(team.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const handleTeamImageSelect = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setTeam(team.map(m => m.id === id ? { ...m, _file: file, _preview: URL.createObjectURL(file) } : m));
        }
    };

    const addBrand = () => {
        setBrands([...brands, { id: window.crypto.randomUUID(), name: '', logo: '' }]);
    };

    const removeBrand = (id: string) => {
        setBrands(brands.filter(b => b.id !== id));
    };

    const updateBrand = (id: string, field: keyof PartnerBrand, value: string) => {
        setBrands(brands.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const handleBrandImageSelect = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setBrands(brands.map(b => b.id === id ? { ...b, _file: file, _preview: URL.createObjectURL(file) } : b));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const processedTeam = await Promise.all(team.map(async (member) => {
                let finalImageUrl = member.image;
                if (member._file) {
                    finalImageUrl = await uploadImage(member._file, 'team');
                }
                return {
                    id: member.id,
                    name: member.name,
                    role: member.role,
                    bio: member.bio,
                    image: finalImageUrl
                };
            }));

            const processedBrands = await Promise.all(brands.map(async (brand) => {
                let finalLogoUrl = brand.logo;
                if (brand._file) {
                    finalLogoUrl = await uploadImage(brand._file, 'Brands');
                }
                return {
                    id: brand.id,
                    name: brand.name,
                    logo: finalLogoUrl
                };
            }));

            const payload = {
                team: processedTeam,
                brands: processedBrands
            };

            await api.put('/institutional', payload);
            
            toast.success("Informações e fotos salvas com sucesso!");

            setTeam(processedTeam);
            setBrands(processedBrands);

        } catch (error) {
            console.error("Erro ao salvar:", error);
            toast.error("Ocorreu um erro ao salvar. Tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#FF5E00] animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col relative max-w-7xl mx-auto pb-12">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-[#FF5E00]" />
                        Gestão Institucional
                    </h1>
                    <p className="text-xs text-[#8F8F91] uppercase tracking-widest mt-1">Gerencie a diretoria e as marcas parceiras da Home.</p>
                </div>
                
                <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-[#25D366] text-[#0A0A0B] hover:bg-[#1eb858] border-none font-black uppercase tracking-widest text-xs px-8 py-3.5 rounded-sm flex items-center gap-2 transition-colors"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>

            <div className="flex flex-col gap-8">
                
                {/* GESTORES / EQUIPE */}
                <div className="bg-[#111113] border border-white/5 rounded-md flex flex-col overflow-hidden shadow-xl">
                    <div className="bg-[#0A0A0B] border-b border-white/5 p-5 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#FF5E00]" /> Gestores e Liderança
                        </h2>
                        <button onClick={addTeamMember} className="text-[#FF5E00] hover:text-[#e05300] flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Adicionar Gestor
                        </button>
                    </div>
                    
                    <div className="p-6 flex flex-col gap-6">
                        {team.length === 0 ? (
                            <p className="text-xs text-[#8F8F91] uppercase tracking-widest text-center py-6">Nenhum gestor cadastrado.</p>
                        ) : (
                            team.map((member) => (
                                <div key={member.id} className="flex flex-col md:flex-row gap-6 p-5 border border-white/5 rounded-sm bg-[#0A0A0B] relative group">
                                    <button onClick={() => removeTeamMember(member.id)} className="absolute top-4 right-4 text-[#8F8F91] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <label className="flex flex-col items-center justify-center w-full md:w-40 h-48 border border-white/10 border-dashed rounded-sm cursor-pointer bg-[#111113] hover:border-[#FF5E00]/50 transition-colors relative overflow-hidden shrink-0">
                                        {member._preview || member.image ? (
                                            // REMOVIDO o filter grayscale
                                            <img src={member._preview || member.image} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center px-4 text-center">
                                                <ImageIcon className="w-6 h-6 text-[#8F8F91] mb-2" />
                                                <span className="text-[10px] text-[#8F8F91] uppercase tracking-wider font-bold">Enviar Foto</span>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleTeamImageSelect(member.id, e)} />
                                    </label>

                                    <div className="flex flex-col gap-4 flex-1 mt-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input label="Nome do Gestor *" value={member.name} onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)} placeholder="Ex: Victor Silva" className="bg-[#111113]" />
                                            <Input label="Cargo *" value={member.role} onChange={(e) => updateTeamMember(member.id, 'role', e.target.value)} placeholder="Ex: Diretor Comercial" className="bg-[#111113]" />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-[#8F8F91] font-bold uppercase tracking-widest">Resumo Profissional</label>
                                            <textarea 
                                                rows={2} value={member.bio} onChange={(e) => updateTeamMember(member.id, 'bio', e.target.value)} 
                                                className="bg-[#111113] border border-white/10 rounded-sm px-4 py-2.5 text-white focus:border-[#FF5E00] outline-none resize-none text-sm transition-colors custom-scrollbar" 
                                                placeholder="Descreva a função dele na empresa..." 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* PARCEIROS / MARCAS */}
                <div className="bg-[#111113] border border-white/5 rounded-md flex flex-col overflow-hidden shadow-xl">
                    <div className="bg-[#0A0A0B] border-b border-white/5 p-5 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <Target className="w-4 h-4 text-[#FF5E00]" /> Parceiros Comerciais
                        </h2>
                        <button onClick={addBrand} className="text-[#FF5E00] hover:text-[#e05300] flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Adicionar Parceiro
                        </button>
                    </div>
                    
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {brands.length === 0 ? (
                            <div className="col-span-full text-center py-6">
                                <p className="text-xs text-[#8F8F91] uppercase tracking-widest">Nenhum parceiro cadastrado.</p>
                            </div>
                        ) : (
                            brands.map((brand) => (
                                <div key={brand.id} className="flex flex-col gap-3 p-3 border border-white/5 rounded-sm bg-[#0A0A0B] relative group">
                                    <button onClick={() => removeBrand(brand.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-sm shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 z-10">
                                        <X className="w-3 h-3" />
                                    </button>

                                    <label className="flex flex-col items-center justify-center w-full h-24 border border-white/10 border-dashed rounded-sm cursor-pointer bg-[#111113] hover:border-[#FF5E00]/50 transition-colors relative overflow-hidden">
                                        {brand._preview || brand.logo ? (
                                            <img src={brand._preview || brand.logo} alt="Logo" className="max-w-[80%] max-h-[80%] object-contain" />
                                        ) : (
                                            <ImageIcon className="w-5 h-5 text-[#8F8F91]" />
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleBrandImageSelect(brand.id, e)} />
                                    </label>
                                    
                                    <input 
                                        type="text" value={brand.name} onChange={(e) => updateBrand(brand.id, 'name', e.target.value)} 
                                        placeholder="Nome da Marca" 
                                        className="bg-[#111113] border border-white/10 rounded-sm px-3 py-2 text-xs text-white focus:border-[#FF5E00] outline-none transition-colors text-center w-full"
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}