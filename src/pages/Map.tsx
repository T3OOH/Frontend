import { useState, useEffect } from 'react';
import { InteractiveMap } from '@/features/map/InteractiveMap';
import { Loader2, Search, X, ChevronLeft, ShoppingCart, Check, Send, Activity } from 'lucide-react';
import { panelsService } from '@/services/panels.service';
import { api } from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';

export function Map() {
    const [panels, setPanels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
    const [cart, setCart] = useState<any[]>([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkoutForm, setCheckoutForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });

    useEffect(() => {
        const fetchPanels = async () => {
            try {
                setIsLoading(true);
                const data = await panelsService.getAllPanels();
                setPanels(data.filter((p: any) => p.status === 'AVAILABLE'));
            } catch (error) {
                console.error("Erro ao carregar mapa público:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPanels();
    }, []);

    const filteredPanels = panels.filter((p: any) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleInCart = (panel: any) => {
        const exists = cart.find(item => item.id === panel.id);
        if (exists) {
            setCart(cart.filter(item => item.id !== panel.id));
        } else {
            setCart([...cart, panel]);
        }
    };

    const handleSubmitQuotation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const panelListText = cart.map(p => `- ${p.name} (${p.city || 'Goiânia'}/${p.state || 'GO'})`).join('\n');
            const finalMessage = `SOLICITAÇÃO DE ORÇAMENTO (Via Mapa Interativo)\n\nPainéis de interesse:\n${panelListText}\n\nMensagem do Cliente:\n${checkoutForm.message || 'Gostaria de receber uma cotação para os pontos listados acima.'}`;

            await api.post('/contacts', {
                name: checkoutForm.name,
                email: checkoutForm.email,
                phone: checkoutForm.phone,
                company: checkoutForm.company || undefined,
                message: finalMessage,
            });

            alert('Orçamento solicitado com sucesso! Nossa equipe entrará em contato.');
            setCart([]);
            setIsCheckoutOpen(false);
            setCheckoutForm({ name: '', email: '', phone: '', company: '', message: '' });
        } catch (error) {
            console.error("Erro ao enviar orçamento:", error);
            alert('Houve um erro ao enviar sua solicitação. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 w-full flex bg-[#0A0A0B] relative overflow-hidden min-h-[calc(100vh-5rem)]">

            {/* BACKGROUND DO MAPA */}
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

            {/* BOTÃO FLUTUANTE PARA ABRIR SIDEBAR (Aparece quando a sidebar está fechada) */}
            <AnimatePresence>
                {!isSidebarOpen && !isCheckoutOpen && (
                    <motion.button
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        onClick={() => setIsSidebarOpen(true)}
                        className="absolute top-4 left-4 z-40 bg-[#0A0A0B]/85 backdrop-blur-xl border border-brand-border/40 px-4 py-3 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] hover:border-brand-neon/50 transition-all flex items-center gap-3 group"
                    >
                        <Search className="w-5 h-5 text-brand-neon group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold text-white tracking-wide">Buscar Painéis</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* BARRA LATERAL FLUTUANTE (Sidebar Esquerda) */}
            <AnimatePresence initial={false}>
                {isSidebarOpen && !isCheckoutOpen && (
                    <motion.div
                        initial={{ x: '-120%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-120%', opacity: 0 }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                        // Ajuste essencial para mobile: w-[calc(100vw-2rem)] garante respiro nas bordas
                        className="absolute top-4 left-4 bottom-4 w-[calc(100vw-2rem)] sm:w-80 md:w-96 bg-[#0A0A0B]/85 backdrop-blur-2xl border border-brand-border/40 z-40 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden"
                    >
                        {/* Header da Sidebar com botão de fechar */}
                        <div className="p-5 md:p-6 border-b border-brand-border/30 bg-brand-surface/10 flex-shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Pontos Disponíveis</h2>
                                <button 
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-1.5 bg-brand-surface/50 border border-brand-border/40 hover:border-brand-neon hover:text-brand-neon rounded-lg text-brand-muted transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                                <input
                                    type="text"
                                    placeholder="Buscar por avenida..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-brand-surface/30 border border-brand-border/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Lista de Painéis (Área rolável) */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="flex flex-col gap-3">
                                {filteredPanels.map((panel) => {
                                    const inCart = cart.some(item => item.id === panel.id);
                                    const isSelected = selectedPanelId === panel.id;
                                    return (
                                        <div
                                            key={panel.id}
                                            className={`flex flex-col p-3 rounded-xl border transition-all duration-300 text-left ${
                                                isSelected
                                                    ? 'bg-brand-neon/5 border-brand-neon/40 shadow-[0_0_20px_rgba(255,94,0,0.1)]'
                                                    : 'bg-brand-surface/20 border-brand-border/30 hover:border-brand-neon/30 hover:bg-brand-surface/40'
                                            }`}
                                        >
                                            <div className="flex gap-3 md:gap-4 cursor-pointer" onClick={() => setSelectedPanelId(panel.id)}>
                                                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border border-brand-border/40 flex-shrink-0">
                                                    <img
                                                        src={panel.images && panel.images.length > 0 ? panel.images[0] : '/placeholder.jpg'}
                                                        alt={panel.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex flex-col justify-center flex-1">
                                                    <h4 className="text-sm font-semibold text-brand-text line-clamp-2 mb-1 leading-tight">{panel.name}</h4>
                                                    <div className="flex items-center gap-1.5 mt-auto">
                                                        <Activity className="w-3 h-3 text-brand-neon" />
                                                        <p className="text-[11px] text-brand-muted">{panel.impacts} impactos/dia</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Botão de Adicionar ao Orçamento */}
                                            <button
                                                onClick={() => toggleInCart(panel)}
                                                className={`mt-3 py-2 w-full rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                                                    inCart
                                                        ? 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
                                                        : 'bg-brand-neon text-brand-black shadow-[0_0_15px_rgba(255,94,0,0.2)] hover:shadow-[0_0_25px_rgba(255,94,0,0.4)]'
                                                }`}
                                            >
                                                {inCart ? <><Check className="w-3.5 h-3.5" /> Selecionado</> : 'Adicionar ao Orçamento'}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* RODAPÉ DA SIDEBAR */}
                        <AnimatePresence>
                            {cart.length > 0 && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 20, opacity: 0 }}
                                    className="p-4 bg-brand-surface/50 border-t border-brand-border/40 backdrop-blur-xl flex-shrink-0"
                                >
                                    <button
                                        onClick={() => setIsCheckoutOpen(true)}
                                        className="w-full bg-brand-neon text-brand-black px-4 py-3.5 rounded-xl font-bold shadow-[0_0_20px_rgba(255,94,0,0.3)] hover:shadow-[0_0_30px_rgba(255,94,0,0.5)] flex items-center justify-center gap-3 hover:-translate-y-0.5 transition-all duration-300"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        <span className="tracking-wide">Solicitar Orçamento ({cart.length})</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL / SIDEBAR DE CHECKOUT */}
            <AnimatePresence>
                {isCheckoutOpen && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                        // Ajuste para mobile também no checkout
                        className="absolute top-0 right-0 h-full w-full md:w-[480px] bg-[#0A0A0B]/95 backdrop-blur-2xl border-l border-brand-border/40 z-[100] shadow-[-20px_0_50px_rgba(0,0,0,0.7)] flex flex-col"
                    >
                        {/* Header Checkout */}
                        <div className="p-5 md:p-6 border-b border-brand-border/40 flex justify-between items-center bg-brand-surface/10">
                            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                                <Send className="w-5 h-5 text-brand-neon" /> Finalizar Pedido
                            </h2>
                            <button 
                                onClick={() => setIsCheckoutOpen(false)} 
                                className="p-2 hover:bg-brand-surface/50 border border-transparent hover:border-brand-border/50 rounded-full text-brand-muted hover:text-white transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Área com Scroll */}
                        <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar">
                            
                            {/* Lista de Selecionados */}
                            <div className="mb-10">
                                <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-4">Painéis Selecionados ({cart.length})</h3>
                                <ul className="space-y-2.5">
                                    {cart.map(p => (
                                        <li key={p.id} className="flex justify-between items-center text-sm bg-brand-surface/20 p-3.5 rounded-xl border border-brand-border/30">
                                            <span className="text-brand-text truncate font-medium pr-4">{p.name}</span>
                                            <button 
                                                onClick={() => toggleInCart(p)} 
                                                className="text-red-500/80 hover:text-red-400 font-semibold text-xs tracking-wider uppercase transition-colors"
                                            >
                                                Remover
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Formulário de Contato */}
                            <form id="quotation-form" onSubmit={handleSubmitQuotation} className="space-y-4 md:space-y-5">
                                <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-4 border-b border-brand-border/30 pb-2">Seus Dados</h3>

                                <div>
                                    <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wider mb-1.5">Nome Completo *</label>
                                    <input required type="text" value={checkoutForm.name} onChange={e => setCheckoutForm({ ...checkoutForm, name: e.target.value })} className="w-full bg-brand-surface/30 border border-brand-border/40 rounded-xl px-4 py-3 text-sm text-brand-text focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/50 outline-none transition-all" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wider mb-1.5">E-mail *</label>
                                        <input required type="email" value={checkoutForm.email} onChange={e => setCheckoutForm({ ...checkoutForm, email: e.target.value })} className="w-full bg-brand-surface/30 border border-brand-border/40 rounded-xl px-4 py-3 text-sm text-brand-text focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/50 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wider mb-1.5">Telefone/WhatsApp *</label>
                                        <input required type="text" value={checkoutForm.phone} onChange={e => setCheckoutForm({ ...checkoutForm, phone: e.target.value })} className="w-full bg-brand-surface/30 border border-brand-border/40 rounded-xl px-4 py-3 text-sm text-brand-text focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/50 outline-none transition-all" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wider mb-1.5">Empresa / Agência <span className="opacity-50">(Opcional)</span></label>
                                    <input type="text" value={checkoutForm.company} onChange={e => setCheckoutForm({ ...checkoutForm, company: e.target.value })} className="w-full bg-brand-surface/30 border border-brand-border/40 rounded-xl px-4 py-3 text-sm text-brand-text focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/50 outline-none transition-all" />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wider mb-1.5">Observações <span className="opacity-50">(Opcional)</span></label>
                                    <textarea value={checkoutForm.message} onChange={e => setCheckoutForm({ ...checkoutForm, message: e.target.value })} rows={3} placeholder="Data pretendida da campanha, objetivo, etc." className="w-full bg-brand-surface/30 border border-brand-border/40 rounded-xl px-4 py-3 text-sm text-brand-text placeholder:text-brand-muted/50 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/50 outline-none transition-all resize-none" />
                                </div>
                            </form>
                        </div>

                        {/* Footer Checkout */}
                        <div className="p-5 md:p-6 bg-[#0A0A0B] border-t border-brand-border/40 flex-shrink-0">
                            <button
                                type="submit"
                                form="quotation-form"
                                disabled={isSubmitting || cart.length === 0}
                                className="w-full bg-brand-neon text-brand-black font-bold py-3.5 md:py-4 rounded-xl shadow-[0_0_20px_rgba(255,94,0,0.3)] hover:shadow-[0_0_30px_rgba(255,94,0,0.5)] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Solicitação Oficial'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}