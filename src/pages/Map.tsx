import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { InteractiveMap } from '@/features/map/InteractiveMap';
import { 
    Loader2, Search, X, ChevronLeft, ShoppingCart, Check, Send, 
    Zap, Layers, MapPin, Compass, Shield, MonitorPlay
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { api } from '@/lib/axios';
import { panelsService } from '@/services/panels.service';
import { useCart, Panel } from '@/contexts/CartContext';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import { Button } from '@/components/Button';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext'; 

export function Map() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { cart, toggleInCart, isInCart, clearCart } = useCart();
    const { addToast } = useToast();
    const { user } = useAuth();

    const [panels, setPanels] = useState<Panel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(searchParams.get('checkout') === 'true');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [checkoutForm, setCheckoutForm] = useState({ 
        name: '', email: '', phone: '', company: '', message: '' 
    });

    useEffect(() => {
        if (user) {
            const u = user as any; 
            setCheckoutForm(prev => ({
                ...prev,
                name: u.name || prev.name,
                email: u.email || prev.email,
                phone: u.phone || prev.phone,
                company: u.company || prev.company
            }));
        }
    }, [user]);

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const formatImpacts = (rawImpacts: string | number) => {
        if (!rawImpacts) return '0';
        const strVal = String(rawImpacts).toLowerCase();
        
        let n = Number(strVal.replace(/\D/g, ''));
        
        if (strVal.includes('mil') && !strVal.includes('milh')) n *= 1000;
        else if (strVal.includes('mi') || strVal.includes('milh')) n *= 1000000;
        else if (strVal.includes('bi')) n *= 1000000000;

        if (n >= 1000000000) return (n / 1000000000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' bilhão';
        if (n >= 2000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' milhões';
        if (n >= 1000000) return '1 milhão';
        if (n >= 1000) return (n / 1000).toFixed(0) + ' mil';
        return n.toLocaleString('pt-BR');
    };

    useEffect(() => {
        const fetchPanels = async () => {
            try {
                setIsLoading(true);
                const data = await panelsService.getAllPanels();
                
                const validPanels = data
                    .filter((p: any) => p.status === 'AVAILABLE' && p.id)
                    .map((p: any) => ({
                        ...p,
                        id: p.id,
                        name: p.name || 'Sem Nome',
                        city: p.city || 'Desconhecida',
                        state: p.state || '',
                        lat: Number(p.lat) || 0, 
                        lng: Number(p.lng) || 0,
                        price: Number(p.price) || 0 
                    })) as Panel[];
                    
                setPanels(validPanels);
            } catch (error) {
                console.error("[Map] Fetch Panels Error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPanels();
    }, []);

    const filteredPanels = panels.filter((p) => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.city?.toLowerCase().includes(searchTerm.toLowerCase()));

    // Lógica de Desconto Combo Progressivo
    let totalOriginalValue = 0;
    let totalVolumeDiscount = 0;

    cart.forEach((cartItem, index) => {
        const livePanel = panels.find(p => p.id === cartItem.id);
        const price = Number(livePanel ? livePanel.price : cartItem.price) || 0;
        
        totalOriginalValue += price;
        if (index > 0) {
            totalVolumeDiscount += price * 0.10;
        }
    });

    const finalCartValue = totalOriginalValue - totalVolumeDiscount;

    const totalCartImpacts = cart.reduce((acc, cartItem) => {
        const livePanel = panels.find(p => p.id === cartItem.id);
        const impactToSum = livePanel ? livePanel.impacts : cartItem.impacts;
        
        const strVal = String(impactToSum || '').toLowerCase();
        let n = Number(strVal.replace(/\D/g, ''));
        if (strVal.includes('mil') && !strVal.includes('milh')) n *= 1000;
        else if (strVal.includes('mi') || strVal.includes('milh')) n *= 1000000;
        else if (strVal.includes('bi')) n *= 1000000000;
        return acc + n;
    }, 0);

    const handleSubmitQuotation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const systemNote = totalVolumeDiscount > 0 
                ? `\n\n[SISTEMA]: O cliente obteve R$ ${totalVolumeDiscount.toFixed(2)} de desconto por pacote (10% a partir do 2º painel). Valor estimado do orçamento: ${formatCurrency(finalCartValue)}.`
                : '';

            const payload = {
                clientDetails: {
                    ...checkoutForm,
                    message: checkoutForm.message + systemNote
                },
                panelIds: cart.map(p => p.id),
                source: 'INTERACTIVE_MAP'
            };

            await api.post('/crm/deals/checkout', payload);

            addToast('Seu pedido foi registrado com sucesso.', 'success');

            clearCart();
            setIsCheckoutOpen(false);
            setCheckoutForm({ name: '', email: '', phone: '', company: '', message: '' });
            navigate('/dashboard');
        } catch (error) {
            console.error("[Map] Checkout Integration Error:", error);
            addToast('Falha ao processar solicitação. Verifique sua conexão.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 w-full flex bg-[#0A0A0B] relative overflow-hidden min-h-[calc(100vh-5rem)]">
            
            {/* --- MAPA BACKGROUND --- */}
            <div className="absolute inset-0 z-0 bg-brand-black">
                {isLoading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0A0A0B]/80 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-4" />
                        <p className="text-sm font-medium tracking-wide text-brand-muted uppercase">Sincronizando Circuito...</p>
                    </div>
                ) : (
                    <InteractiveMap panels={panels} selectedPanelId={selectedPanelId} />
                )}
            </div>

            {/* ========================================================= */}
            {/* DESKTOP LAYOUT (100% PRESERVADO)                            */}
            {/* ========================================================= */}
            
            {/* Botão Flutuante Desktop */}
            <AnimatePresence>
                {!isSidebarOpen && !isCheckoutOpen && (
                    <motion.button
                        key="reopen-sidebar-btn"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        onClick={() => setIsSidebarOpen(true)}
                        className="hidden md:flex absolute top-6 left-6 z-[100] bg-[#0A0A0B]/85 backdrop-blur-xl border border-brand-border/40 px-5 py-3 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.9)] hover:border-brand-neon transition-all items-center gap-3 group cursor-pointer"
                    >
                        <Search className="w-5 h-5 text-brand-neon group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold text-white tracking-wide">Buscar Painéis</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Sidebar Desktop */}
            <AnimatePresence initial={false}>
                {isSidebarOpen && !isCheckoutOpen && (
                    <motion.div initial={{ x: '-120%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-120%', opacity: 0 }} className="hidden md:flex absolute top-4 left-4 bottom-4 w-96 bg-[#0A0A0B]/85 backdrop-blur-2xl border border-brand-border/40 z-40 flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-brand-border/30 bg-brand-surface/10 flex-shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white tracking-tight">Pontos Disponíveis</h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 bg-brand-surface/50 border border-brand-border/40 hover:text-brand-neon rounded-lg text-brand-muted transition-all">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted z-10" />
                                <Input
                                    placeholder="Buscar por avenida..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {filteredPanels.map((panel) => {
                                const inCart = isInCart(panel.id);
                                const isSelected = selectedPanelId === panel.id; 

                                return (
                                    <div 
                                        key={panel.id} 
                                        className={`flex flex-col p-3.5 rounded-xl border mb-3 transition-all duration-300 ${
                                            isSelected 
                                            ? 'bg-brand-neon/10 border-brand-neon shadow-[0_0_20px_rgba(255,94,0,0.15)] scale-[1.02]' 
                                            : 'bg-brand-surface/20 border-brand-border/30 hover:bg-brand-surface/40'
                                        }`}
                                    >
                                        <div className="flex gap-3 cursor-pointer mb-3" onClick={() => setSelectedPanelId(panel.id)}>
                                            <div className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border relative transition-colors ${isSelected ? 'border-brand-neon' : 'border-brand-border/50'}`}>
                                                <img src={panel.images?.[0] || '/placeholder.jpg'} alt={panel.name} className="w-full h-full object-cover" />
                                            </div>
                                            
                                            <div className="flex-1 flex flex-col justify-between overflow-hidden">
                                                <h4 className={`text-sm font-bold leading-tight line-clamp-2 transition-colors ${isSelected ? 'text-brand-neon' : 'text-white'}`}>
                                                    {panel.name}
                                                </h4>
                                                
                                                <div className="flex flex-col gap-1 mt-auto">
                                                    <div className="flex items-center gap-1.5 w-full">
                                                        <Zap className="w-4 h-4 text-[#FF5E00] flex-shrink-0 fill-[#FF5E00]" />
                                                        <span className="text-[17px] font-black text-[#FF5E00] tracking-tighter truncate">
                                                            {formatImpacts(panel.impacts || 0)}
                                                        </span>
                                                        <span className="text-[8px] text-[#FF5E00]/80 uppercase font-black leading-tight ml-auto text-right">
                                                            Impactos<br/>Diários
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between border-t border-brand-border/30 pt-1.5 mt-0.5">
                                                        <span className="text-[9px] text-brand-muted uppercase font-bold tracking-widest">Investimento</span>
                                                        <span className="text-xs font-semibold text-brand-muted">{formatCurrency(Number(panel.price) || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <Button
                                            variant={inCart ? 'secondary' : 'primary'}
                                            className="w-full text-xs py-2 h-auto"
                                            onClick={() => toggleInCart(panel)}
                                        >
                                            {inCart ? <><Check className="w-3.5 h-3.5 mr-1" /> Selecionado</> : 'Adicionar ao Orçamento'}
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>

                        <AnimatePresence>
                            {cart.length > 0 && (
                                <motion.div className="p-4 border-t border-brand-border/40 flex-shrink-0">
                                    <Button onClick={() => setIsCheckoutOpen(true)} className="w-full py-4 text-sm font-bold bg-brand-neon hover:bg-[#e05300] text-black shadow-[0_0_20px_rgba(255,94,0,0.3)]">
                                        <ShoppingCart className="w-5 h-5 mr-2" /> Solicitar Orçamento ({cart.length})
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ========================================================= */}
            {/* MOBILE LAYOUT (VISÃO LIMPA DE APLICATIVO)                   */}
            {/* ========================================================= */}
            
            {!isCheckoutOpen && (
                <>
                    {/* Barra de Pesquisa Superior Flutuante (Livrando a visão) */}
                    <div className="md:hidden absolute top-4 left-4 right-4 z-40 pointer-events-auto">
                        <div className="bg-[#111113]/95 backdrop-blur-xl border border-brand-border/40 rounded-full px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.6)] flex items-center gap-3 transition-all focus-within:border-brand-neon/50">
                            <Search className="w-5 h-5 text-brand-neon flex-shrink-0" />
                            <input 
                                className="bg-transparent border-none text-white w-full focus:outline-none text-[13px] placeholder-brand-muted"
                                placeholder="Buscar avenida ou região..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="p-1.5 text-brand-muted hover:text-white flex-shrink-0 bg-brand-surface/50 rounded-full">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Container Inferior (Pílula de Carrinho + Cards Compactos) */}
                    <div className="md:hidden absolute bottom-[76px] left-0 right-0 z-40 pointer-events-none flex flex-col items-center justify-end pb-2">
                        
                        {/* Botão de Solicitar Orçamento (Estilo Pill) */}
                        <AnimatePresence>
                            {cart.length > 0 && (
                                <motion.div 
                                    initial={{ y: 20, opacity: 0, scale: 0.9 }} 
                                    animate={{ y: 0, opacity: 1, scale: 1 }} 
                                    exit={{ y: 20, opacity: 0, scale: 0.9 }}
                                    className="pointer-events-auto mb-4"
                                >
                                    <Button onClick={() => setIsCheckoutOpen(true)} className="rounded-full bg-brand-neon text-[#0A0A0B] font-black py-3 px-6 shadow-[0_10px_30px_rgba(255,94,0,0.4)] text-[13px] flex justify-center items-center gap-2 border border-transparent">
                                        <ShoppingCart className="w-4 h-4" />
                                        Ver Carrinho ({cart.length})
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Cards Horizontais dos Painéis (Design Compacto Horizontal) */}
                        <div className="w-full pointer-events-auto">
                            <div className="flex gap-3 overflow-x-auto snap-x custom-scrollbar px-4 pb-2">
                                {filteredPanels.map(panel => {
                                    const inCart = isInCart(panel.id);
                                    const isSelected = selectedPanelId === panel.id;

                                    return (
                                        <div 
                                            key={panel.id}
                                            onClick={() => setSelectedPanelId(panel.id)}
                                            className={`snap-start flex-shrink-0 w-[290px] h-[110px] bg-[#111113]/95 backdrop-blur-xl rounded-2xl overflow-hidden border transition-all shadow-xl flex flex-row ${
                                                isSelected ? 'border-brand-neon shadow-[0_0_15px_rgba(255,94,0,0.15)] scale-[1.02]' : 'border-white/10'
                                            }`}
                                        >
                                            {/* Imagem Pequena Esquerda */}
                                            <div className="w-[100px] h-full bg-black relative flex-shrink-0">
                                                <img src={panel.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover opacity-90" alt={panel.name} />
                                                <div className="absolute top-1.5 left-1.5 bg-[#0A0A0B]/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-1">
                                                    <Zap className="w-2.5 h-2.5 text-brand-neon" />
                                                    <span className="text-[9px] font-black text-white tracking-widest">{formatImpacts(panel.impacts || 0)}</span>
                                                </div>
                                            </div>

                                            {/* Informações Direita */}
                                            <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
                                                <div>
                                                    <h4 className="text-[13px] font-bold text-white line-clamp-2 leading-tight mb-1 pr-1">{panel.name}</h4>
                                                    <p className="text-[10px] text-brand-muted flex items-center gap-1 truncate">
                                                        <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{panel.city}</span>
                                                    </p>
                                                </div>
                                                
                                                <div className="flex justify-between items-center mt-1 border-t border-brand-border/20 pt-1.5">
                                                    <span className="text-sm font-black text-brand-neon tracking-tight">{formatCurrency(Number(panel.price) || 0)}</span>
                                                    
                                                    {/* Botão de Carrinho (Ícone) Reduzido para despoluir */}
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); toggleInCart(panel); }}
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors flex-shrink-0 ${
                                                            inCart 
                                                            ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                                                            : 'bg-brand-neon text-black'
                                                        }`}
                                                    >
                                                        {inCart ? <X className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Bottom Navigation Nativa (Apenas Mobile, Oculta se Checkout Aberto) */}
            {!isCheckoutOpen && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-2xl border-t border-brand-border/20 z-[100] px-6 py-3 flex justify-between items-center pb-safe">
                    <Link to="/" className="flex flex-col items-center gap-1 text-brand-muted hover:text-white transition-colors">
                        <Compass className="w-5 h-5" />
                        <span className="text-[9px] font-medium">Explorar</span>
                    </Link>
                    <Link to="/mapa" className="flex flex-col items-center gap-1 text-brand-neon">
                        <MapPin className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Mapa</span>
                    </Link>
                    <Link to="/servicos" className="flex flex-col items-center gap-1 text-brand-muted hover:text-white transition-colors">
                        <MonitorPlay className="w-5 h-5" />
                        <span className="text-[9px] font-medium">Painéis</span>
                    </Link>
                    <Link to="/contato" className="flex flex-col items-center gap-1 text-brand-muted hover:text-white transition-colors">
                        <Shield className="w-5 h-5" />
                        <span className="text-[9px] font-medium">Contato</span>
                    </Link>
                </div>
            )}

            {/* ========================================================= */}
            {/* CHECKOUT MODAL (COMPARTILHADO, MAS RESPONSIVO)              */}
            {/* ========================================================= */}
            
            <AnimatePresence>
                {isCheckoutOpen && (
                    <motion.div initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} className="absolute top-0 right-0 h-full w-full md:w-[480px] bg-[#0A0A0B]/95 backdrop-blur-2xl border-l border-brand-border/40 z-[110] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.7)]">
                        <div className="p-5 md:p-6 border-b border-brand-border/40 flex justify-between items-center bg-brand-surface/10 pt-[env(safe-area-inset-top,20px)]">
                            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2"><Send className="w-5 h-5 text-brand-neon" /> Finalizar Pedido CRM</h2>
                            <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-brand-surface/50 rounded-full text-brand-muted hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar space-y-6">
                            
                            <div className="bg-[#111113] border border-brand-border/40 rounded-2xl p-5 flex flex-col gap-4 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5E00]/5 rounded-full blur-[40px] pointer-events-none"></div>
                                
                                <div className="flex items-center justify-between border-b border-brand-border/30 pb-3 relative z-10">
                                    <span className="text-xs font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1.5">
                                        <Layers className="w-4 h-4 text-brand-neon" /> Painéis no Carrinho
                                    </span>
                                    <span className="text-sm font-black text-white bg-[#0A0A0B] px-3 py-1 rounded-md border border-brand-border/50">{cart.length} unid</span>
                                </div>
                                
                                <div className="flex items-end justify-between relative z-10 pt-1">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-[#FF5E00]/80 uppercase font-black tracking-widest mb-0.5">Alcance Total (Diário)</span>
                                        <span className="text-2xl font-black text-[#FF5E00] tracking-tighter leading-none">{formatImpacts(totalCartImpacts || 0)}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        {totalVolumeDiscount > 0 && (
                                            <span className="text-[10px] text-red-500 line-through mb-0.5 font-bold decoration-red-500/50">
                                                {formatCurrency(totalOriginalValue)}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-brand-muted uppercase font-bold tracking-widest mb-1">
                                            {totalVolumeDiscount > 0 ? 'Investimento (c/ Desconto)' : 'Investimento Base'}
                                        </span>
                                        <span className="text-xl font-black text-[#25D366] leading-none">{formatCurrency(finalCartValue || 0)}</span>
                                        {totalVolumeDiscount > 0 && (
                                            <span className="text-[9px] font-bold text-[#25D366] mt-1.5 bg-[#25D366]/10 px-1.5 py-0.5 rounded uppercase tracking-wider ml-auto w-fit">
                                                Economia: {formatCurrency(totalVolumeDiscount)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-4">Seus Dados de Contato</h3>
                                <form id="quotation-form" onSubmit={handleSubmitQuotation} className="space-y-4">
                                    <div>
                                        <label className="text-xs text-brand-muted mb-1 block">Nome Completo *</label>
                                        <Input required value={checkoutForm.name} onChange={e => setCheckoutForm({ ...checkoutForm, name: e.target.value })} className="bg-[#111113]" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-brand-muted mb-1 block">E-mail *</label>
                                            <Input required type="email" value={checkoutForm.email} onChange={e => setCheckoutForm({ ...checkoutForm, email: e.target.value })} className="bg-[#111113]" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-brand-muted mb-1 block">WhatsApp *</label>
                                            <Input required value={checkoutForm.phone} onChange={e => setCheckoutForm({ ...checkoutForm, phone: e.target.value })} className="bg-[#111113]" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-brand-muted mb-1 block">Empresa / Agência</label>
                                        <Input value={checkoutForm.company} onChange={e => setCheckoutForm({ ...checkoutForm, company: e.target.value })} className="bg-[#111113]" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-brand-muted mb-1 block">Observações (Opcional)</label>
                                        <Textarea value={checkoutForm.message} onChange={e => setCheckoutForm({ ...checkoutForm, message: e.target.value })} rows={3} placeholder="Mencione condições de pagamento, datas da campanha, etc." className="bg-[#111113]" />
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="p-5 md:p-6 bg-[#0A0A0B] border-t border-brand-border/40 pb-safe">
                            <Button type="submit" form="quotation-form" disabled={isSubmitting || cart.length === 0} className="w-full py-4 text-sm font-bold rounded-xl">
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gerar Ticket Comercial CRM'}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}