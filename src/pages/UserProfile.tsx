import { useState, useEffect, useCallback } from 'react';
import { 
    User as UserIcon, 
    Mail, 
    ShoppingBag, 
    MapPin, 
    Edit2, 
    Check, 
    Loader2, 
    Calendar, 
    ArrowRight,
    ArrowLeft,
    MessageCircle,
    Building,
    Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { profileService } from '@/services/profile.service';
import { useNavigate } from 'react-router-dom';

// Utilitário para formatar o WhatsApp em tempo real
const maskPhone = (value: string) => {
    let v = value.replace(/\D/g, ""); 
    if (v.length > 11) v = v.substring(0, 11); 
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    else if (v.length > 0) v = v.replace(/^(\d*)/, "($1");
    return v;
};

export function UserProfile() {
    const { addToast } = useToast();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState<'data' | 'orders'>('data');
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [myOrders, setMyOrders] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', companyName: '',
    });

    const [activeOrder, setActiveOrder] = useState<any | null>(null);

    const fetchProfileData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [profileData, ordersData] = await Promise.all([
                profileService.getProfile(),
                profileService.getMyOrders()
            ]);
            
            setFormData({
                name: profileData.name || '', 
                email: profileData.email || '',
                phone: profileData.phone || profileData.whatsapp || '', 
                // Captura do campo legado ou novo para exibir em tela
                companyName: profileData.companyName || profileData.company || '',
            });
            setMyOrders(ordersData);
        } catch (error) {
            console.error("Profile data fetch failed:", error);
            addToast('Erro ao carregar dados do perfil.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // CORREÇÃO DO ERRO 500:
            // Enviamos apenas "companyName". Se enviarmos "company", o Prisma tenta
            // acessar a Tabela de Relação Company e causa colisão de tipo.
            const payload = {
                name: formData.name, 
                phone: formData.phone, 
                companyName: formData.companyName
            };

            await profileService.updateProfile(payload as any);
            
            addToast('Perfil atualizado com sucesso!', 'success');
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            addToast('Erro ao atualizar o perfil. Verifique os dados.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleContactSupport = (order: any) => {
        const sellerPhone = order.seller?.phone || order.seller?.whatsapp || '5562999999999';
        
        let cleanPhone = String(sellerPhone).replace(/\D/g, '');
        if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
            cleanPhone = '55' + cleanPhone;
        }

        const text = `Olá! Gostaria de falar sobre o meu orçamento *#${order.id.substring(0,6).toUpperCase()}*.\n\nStatus atual: *${translateStatus(order.status).text}*`;
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
        
        window.open(waUrl, '_blank');
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const translateStatus = (status: string) => {
        if (status === 'WON') return { text: 'Aprovado', color: 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20' };
        if (status === 'LOST') return { text: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
        return { text: 'Em Análise', color: 'bg-brand-neon/10 text-brand-neon border-brand-neon/20' };
    };

    if (isLoading) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0A0A0B]">
                <Loader2 className="w-10 h-10 text-[#FF5E00] animate-spin mb-4" />
                <span className="text-[11px] font-bold text-[#8F8F91] uppercase tracking-widest">Carregando Perfil...</span>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-[#0A0A0B] pt-[100px] pb-12 px-4 sm:px-6 relative overflow-x-hidden">
            
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#FF5E00]/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-5xl mx-auto w-full relative z-10">
                
                {/* Profile Header */}
                <div className="bg-[#111113]/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative shadow-[0_20px_60px_rgba(0,0,0,0.5)] mb-8">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#0A0A0B] border border-white/10 flex items-center justify-center text-4xl font-black text-[#FF5E00] shadow-[0_0_30px_rgba(255,94,0,0.15)] flex-shrink-0 z-10">
                        {formData.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 text-center sm:text-left z-10 min-w-0 flex flex-col justify-center h-full">
                        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 truncate">{formData.name}</h1>
                        <p className="text-[#FF5E00] text-xs font-bold uppercase tracking-widest mb-5">Conta Corporativa</p>
                        
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 text-[13px] text-[#8F8F91] font-medium">
                            <span className="flex items-center gap-2 truncate"><Mail className="w-4 h-4 flex-shrink-0" /> {formData.email}</span>
                            {formData.phone && <span className="flex items-center gap-2 flex-shrink-0"><Phone className="w-4 h-4 flex-shrink-0" /> {formData.phone}</span>}
                            {formData.companyName && <span className="flex items-center gap-2 flex-shrink-0"><Building className="w-4 h-4 flex-shrink-0" /> {formData.companyName}</span>}
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-px overflow-x-auto custom-scrollbar px-2">
                    <button 
                        onClick={() => { setActiveTab('data'); setActiveOrder(null); }}
                        className={`flex items-center gap-2 px-4 py-4 text-[13px] uppercase tracking-widest font-black transition-all relative whitespace-nowrap ${activeTab === 'data' ? 'text-[#FF5E00]' : 'text-[#8F8F91] hover:text-white'}`}
                    >
                        <UserIcon className="w-4 h-4" /> Meus Dados
                        {activeTab === 'data' && <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 w-full h-1 bg-[#FF5E00] rounded-t-full shadow-[0_-2px_10px_rgba(255,94,0,0.5)]" />}
                    </button>
                    <button 
                        onClick={() => setActiveTab('orders')}
                        className={`flex items-center gap-2 px-4 py-4 text-[13px] uppercase tracking-widest font-black transition-all relative whitespace-nowrap ${activeTab === 'orders' ? 'text-[#FF5E00]' : 'text-[#8F8F91] hover:text-white'}`}
                    >
                        <ShoppingBag className="w-4 h-4" /> Meus Orçamentos
                        {activeTab === 'orders' && <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 w-full h-1 bg-[#FF5E00] rounded-t-full shadow-[0_-2px_10px_rgba(255,94,0,0.5)]" />}
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {/* MEUS DADOS TAB */}
                    {activeTab === 'data' && (
                        <motion.div 
                            key="data"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[#111113]/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">Informações Pessoais</h2>
                                    <p className="text-sm text-[#8F8F91] mt-2">Mantenha seus dados de contato atualizados para facilitar as negociações.</p>
                                </div>
                                <Button 
                                    variant={isEditing ? 'primary' : 'secondary'} 
                                    onClick={() => !isEditing ? setIsEditing(true) : handleSaveProfile(new Event('submit') as any)} 
                                    disabled={isSubmitting}
                                    className={`shrink-0 uppercase tracking-widest font-bold text-xs px-6 py-4 rounded-xl transition-all ${isEditing ? 'bg-[#FF5E00] hover:bg-[#e05300] text-[#0A0A0B] border-none shadow-[0_4px_15px_rgba(255,94,0,0.3)]' : 'bg-[#0A0A0B] text-white border-white/10 hover:border-[#FF5E00] hover:bg-[#FF5E00]/5'}`}
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <><Check className="w-4 h-4 mr-2" /> Salvar Alterações</> : <><Edit2 className="w-4 h-4 mr-2" /> Editar Dados</>}
                                </Button>
                            </div>

                            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-white/70 ml-1">Nome Completo</label>
                                    <Input 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})} 
                                        disabled={!isEditing} 
                                        className={`h-14 rounded-xl text-sm ${!isEditing ? 'opacity-50 bg-[#0A0A0B] border-white/5' : 'bg-[#111113]/50 border-white/10 focus:border-[#FF5E00] text-white'}`} 
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-white/70 ml-1">E-mail Corporativo</label>
                                    <Input 
                                        type="email" 
                                        value={formData.email} 
                                        disabled={true} 
                                        className="h-14 rounded-xl text-sm opacity-40 cursor-not-allowed bg-[#0A0A0B] border-white/5" 
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-white/70 ml-1">WhatsApp</label>
                                    <Input 
                                        placeholder="(00) 00000-0000" 
                                        value={formData.phone} 
                                        onChange={e => {
                                            // Aplica a máscara em tempo real
                                            setFormData({...formData, phone: maskPhone(e.target.value)})
                                        }} 
                                        disabled={!isEditing} 
                                        className={`h-14 rounded-xl text-sm ${!isEditing ? 'opacity-50 bg-[#0A0A0B] border-white/5' : 'bg-[#111113]/50 border-white/10 focus:border-[#FF5E00] text-white'}`} 
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-white/70 ml-1">Empresa / Marca</label>
                                    <Input 
                                        placeholder="Sua empresa" 
                                        value={formData.companyName} 
                                        onChange={e => setFormData({...formData, companyName: e.target.value})} 
                                        disabled={!isEditing} 
                                        className={`h-14 rounded-xl text-sm ${!isEditing ? 'opacity-50 bg-[#0A0A0B] border-white/5' : 'bg-[#111113]/50 border-white/10 focus:border-[#FF5E00] text-white'}`} 
                                    />
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {/* MEUS ORÇAMENTOS TAB */}
                    {activeTab === 'orders' && (
                        <motion.div 
                            key="orders"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[#111113]/60 backdrop-blur-2xl border border-white/10 rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                        >
                            {activeOrder ? (
                                /* ORDER DETAILS VIEW */
                                <div className="flex flex-col h-full w-full">
                                    {/* Header do Detalhe */}
                                    <div className="p-6 md:p-8 border-b border-white/5 bg-[#0A0A0B]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <button 
                                                onClick={() => setActiveOrder(null)} 
                                                className="w-10 h-10 flex items-center justify-center bg-[#111113] border border-white/10 hover:border-[#FF5E00]/50 hover:bg-[#FF5E00]/10 rounded-full text-[#8F8F91] hover:text-[#FF5E00] transition-all flex-shrink-0"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                            <div className="min-w-0">
                                                <h2 className="text-xl font-black text-white truncate tracking-tight">Orçamento #{activeOrder.id.substring(0,6).toUpperCase()}</h2>
                                                <p className="text-[11px] text-[#8F8F91] uppercase tracking-widest font-bold mt-1 flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5" /> {new Date(activeOrder.createdAt).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl border flex items-center justify-center text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${translateStatus(activeOrder.status).color}`}>
                                            {translateStatus(activeOrder.status).text}
                                        </div>
                                    </div>

                                    {/* Corpo do Detalhe */}
                                    <div className="p-6 md:p-8 flex flex-col gap-8">
                                        
                                        <div>
                                            <h3 className="text-[11px] font-bold text-[#8F8F91] uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Painéis Solicitados</h3>
                                            <div className="flex flex-col gap-3">
                                                {activeOrder.items?.map((item: any, idx: number) => (
                                                    <div key={item.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#0A0A0B] border border-white/5 rounded-2xl">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-[#111113] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                                {item.panel?.images?.[0] ? (
                                                                    <img src={item.panel.images[0]} alt="Painel" className="w-full h-full object-cover opacity-70" />
                                                                ) : (
                                                                    <MapPin className="w-5 h-5 text-[#8F8F91]" />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-white">{item.panel?.name || 'Painel Removido'}</span>
                                                                <span className="text-[11px] text-[#8F8F91] font-medium mt-0.5">{item.panel?.city} - {item.panel?.state}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className="text-[10px] font-bold text-[#25D366] uppercase tracking-widest block mb-0.5">Valor Mensal</span>
                                                            <span className="text-sm font-black text-white">{formatCurrency(item.priceSnapshot || 0)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-[#0A0A0B] border border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-inner">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-bold text-[#8F8F91] uppercase tracking-widest">Resumo Financeiro</span>
                                                <span className="text-2xl font-black text-[#25D366] tracking-tight">{formatCurrency(activeOrder.expectedValue || 0)}</span>
                                                <span className="text-xs text-[#8F8F91] font-medium mt-1">Duração: {activeOrder.contractMonths || 1} Meses</span>
                                            </div>
                                            
                                            <Button 
                                                onClick={() => handleContactSupport(activeOrder)}
                                                size="lg"
                                                className="w-full sm:w-auto bg-[#25D366] hover:brightness-110 text-[#0A0A0B] font-black uppercase tracking-widest text-[12px] h-14 rounded-xl shadow-[0_10px_25px_rgba(37,211,102,0.2)] border-none shrink-0 transition-all active:scale-[0.98]"
                                                rightIcon={<MessageCircle className="w-4 h-4" />}
                                            >
                                                Falar com Consultor
                                            </Button>
                                        </div>

                                    </div>
                                </div>
                            ) : (
                                /* LISTA DE ORÇAMENTOS */
                                <div className="p-6 sm:p-10">
                                    <div className="mb-10 border-b border-white/5 pb-8">
                                        <h2 className="text-2xl font-black text-white tracking-tight">Histórico de Orçamentos</h2>
                                        <p className="text-sm text-[#8F8F91] mt-2">Acompanhe o status das suas solicitações feitas no mapa de painéis.</p>
                                    </div>

                                    {myOrders.length === 0 ? (
                                        <div className="py-20 flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 rounded-full bg-[#0A0A0B] border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                                                <ShoppingBag className="w-8 h-8 text-[#8F8F91]" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Nenhum orçamento solicitado</h3>
                                            <p className="text-sm text-[#8F8F91] max-w-md mb-8">Navegue pelo nosso catálogo e solicite um orçamento para iniciar sua campanha.</p>
                                            <Button 
                                                onClick={() => navigate('/mapa')} 
                                                className="bg-white hover:bg-gray-200 text-[#0A0A0B] font-black uppercase tracking-widest text-xs px-8 py-4 h-auto rounded-xl border-none shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
                                                rightIcon={<MapPin className="w-4 h-4" />}
                                            >
                                                Explorar Painéis
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {myOrders.map(order => {
                                                const statusBadge = translateStatus(order.status);
                                                return (
                                                    <div key={order.id} className="bg-[#0A0A0B] border border-white/5 rounded-[24px] p-5 sm:p-6 hover:border-[#FF5E00]/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm hover:shadow-lg cursor-pointer" onClick={() => setActiveOrder(order)}>
                                                        <div className="flex flex-col gap-1.5 min-w-0">
                                                            <div className="flex items-center gap-4 mb-1">
                                                                <h4 className="font-black text-white text-base truncate">#{order.id.substring(0, 6).toUpperCase()}</h4>
                                                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border flex-shrink-0 ${statusBadge.color}`}>
                                                                    {statusBadge.text}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#8F8F91] font-medium">
                                                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-white/40" /> {new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                                                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#FF5E00]/60" /> {order.items?.length || 0} Painéis</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-6 justify-between lg:justify-end border-t lg:border-t-0 border-white/5 pt-5 lg:pt-0 mt-2 lg:mt-0 w-full lg:w-auto">
                                                            <div className="flex flex-col lg:items-end">
                                                                <span className="text-[10px] text-[#8F8F91] uppercase tracking-widest font-bold mb-0.5">Total Orçado</span>
                                                                <span className="text-xl font-black text-white">{formatCurrency(order.expectedValue || 0)}</span>
                                                            </div>
                                                            <div className="w-12 h-12 rounded-full bg-[#111113] border border-white/10 flex items-center justify-center text-[#8F8F91] hover:bg-[#FF5E00] hover:text-[#0A0A0B] hover:border-[#FF5E00] transition-colors shrink-0">
                                                                <ArrowRight className="w-5 h-5" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}