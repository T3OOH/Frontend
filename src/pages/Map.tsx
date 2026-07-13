import { useState, useEffect } from 'react';
import { InteractiveMap } from '@/features/map/InteractiveMap';
import { MapPin, Loader2, Search, X, ChevronLeft, ChevronRight, ShoppingCart, Check, Send } from 'lucide-react';
import { panelsService } from '@/services/panels.service';
import { api } from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';

export function Map() {
    const [panels, setPanels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
                // Na vitrine, mostramos apenas os disponíveis
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

    // Funções do Carrinho
    const toggleInCart = (panel: any) => {
        const exists = cart.find(item => item.id === panel.id);
        if (exists) {
            setCart(cart.filter(item => item.id !== panel.id));
        } else {
            setCart([...cart, panel]);
        }
    };

    // Função para enviar o Orçamento para a sua API de Contatos
    const handleSubmitQuotation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Monta a mensagem incluindo os painéis escolhidos
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
        <div className="flex-1 w-full flex bg-brand-black relative overflow-hidden" style={{ minHeight: 'calc(100vh - 80px)' }}>

            <div className="absolute inset-0 z-0">
                {isLoading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-brand-black">
                        <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-4" />
                        <p className="text-brand-muted">Carregando painéis disponíveis...</p>
                    </div>
                ) : (
                    <InteractiveMap panels={panels} selectedPanelId={selectedPanelId} />
                )}
            </div>

            {/* BARRA LATERAL FLUTUANTE (Sidebar) */}
            <AnimatePresence initial={false}>
                {isSidebarOpen && !isCheckoutOpen && (
                    <motion.div
                        initial={{ x: '-120%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-120%', opacity: 0 }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                        className="absolute top-4 left-4 bottom-4 h-[calc(100%-2rem)] w-80 md:w-96 glass-panel bg-brand-surface/95 backdrop-blur-md border border-brand-border/50 z-40 flex flex-col shadow-2xl rounded-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-brand-border/50 bg-brand-black/20">
                            <h2 className="text-xl font-bold text-brand-text mb-4">Pontos Disponíveis</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                                <input
                                    type="text"
                                    placeholder="Buscar por avenida, nome..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-brand-black/60 border border-brand-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-neon transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="flex flex-col gap-3">
                                {filteredPanels.map((panel) => {
                                    const inCart = cart.some(item => item.id === panel.id);
                                    return (
                                        <div
                                            key={panel.id}
                                            className={`flex flex-col p-3 rounded-xl border transition-all text-left ${selectedPanelId === panel.id
                                                ? 'bg-brand-neon/10 border-brand-neon/50'
                                                : 'bg-brand-surface/40 border-transparent hover:border-brand-neon/20 hover:bg-brand-surface'
                                                }`}
                                        >
                                            <div className="flex gap-4 cursor-pointer" onClick={() => setSelectedPanelId(panel.id)}>
                                                <img
                                                    src={panel.images && panel.images.length > 0 ? panel.images[0] : '/placeholder.jpg'}
                                                    alt={panel.name}
                                                    className="w-20 h-20 object-cover rounded-lg bg-brand-black"
                                                />
                                                <div className="flex flex-col justify-center flex-1">
                                                    <h4 className="text-sm font-semibold text-brand-text line-clamp-2 mb-1">{panel.name}</h4>
                                                    <p className="text-xs text-brand-muted mb-2">{panel.impacts} impactos/dia</p>
                                                </div>
                                            </div>

                                            {/* 👇 BOTÃO DE ADICIONAR AO ORÇAMENTO */}
                                            <button
                                                onClick={() => toggleInCart(panel)}
                                                className={`mt-3 py-2 w-full rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${inCart
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                                                    : 'bg-brand-neon text-brand-black hover:bg-brand-neon/90'
                                                    }`}
                                            >
                                                {inCart ? <><Check className="w-4 h-4" /> Selecionado</> : 'Adicionar ao Orçamento'}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BOTÃO FLUTUANTE DO CARRINHO (Aparece apenas quando tem item) */}
            <AnimatePresence>
                {cart.length > 0 && !isCheckoutOpen && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50"
                    >
                        <button
                            onClick={() => setIsCheckoutOpen(true)}
                            className="bg-brand-neon text-brand-black px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-3 hover:scale-[1.02] transition-all border border-brand-neon/20"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            <span>Solicitar Orçamento ({cart.length} locais)</span>
                        </button>
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
                        className="absolute top-0 right-0 h-full w-full md:w-[500px] bg-brand-surface/95 backdrop-blur-xl border-l border-brand-border/50 z-[100] shadow-2xl flex flex-col"
                    >
                        <div className="p-6 border-b border-brand-border/50 flex justify-between items-center bg-brand-black/40">
                            <h2 className="text-xl font-bold text-brand-text flex items-center gap-2">
                                <Send className="w-5 h-5 text-brand-neon" /> Finalizar Pedido
                            </h2>
                            <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-brand-surface rounded-full text-brand-muted hover:text-brand-text">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="mb-8">
                                <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Painéis Selecionados ({cart.length})</h3>
                                <ul className="space-y-2">
                                    {cart.map(p => (
                                        <li key={p.id} className="flex justify-between text-sm bg-brand-black/30 p-3 rounded-lg border border-brand-border/30">
                                            <span className="text-brand-text truncate pr-4">{p.name}</span>
                                            <button onClick={() => toggleInCart(p)} className="text-red-500 hover:text-red-400 font-medium text-xs">Remover</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <form id="quotation-form" onSubmit={handleSubmitQuotation} className="space-y-4">
                                <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Seus Dados</h3>

                                <div>
                                    <label className="block text-xs font-medium text-brand-muted mb-1">Nome Completo *</label>
                                    <input required type="text" value={checkoutForm.name} onChange={e => setCheckoutForm({ ...checkoutForm, name: e.target.value })} className="w-full bg-brand-black/50 border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-text focus:border-brand-neon focus:outline-none" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-brand-muted mb-1">E-mail *</label>
                                        <input required type="email" value={checkoutForm.email} onChange={e => setCheckoutForm({ ...checkoutForm, email: e.target.value })} className="w-full bg-brand-black/50 border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-text focus:border-brand-neon focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-brand-muted mb-1">Telefone/WhatsApp *</label>
                                        <input required type="text" value={checkoutForm.phone} onChange={e => setCheckoutForm({ ...checkoutForm, phone: e.target.value })} className="w-full bg-brand-black/50 border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-text focus:border-brand-neon focus:outline-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-brand-muted mb-1">Empresa / Agência (Opcional)</label>
                                    <input type="text" value={checkoutForm.company} onChange={e => setCheckoutForm({ ...checkoutForm, company: e.target.value })} className="w-full bg-brand-black/50 border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-text focus:border-brand-neon focus:outline-none" />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-brand-muted mb-1">Observações (Opcional)</label>
                                    <textarea value={checkoutForm.message} onChange={e => setCheckoutForm({ ...checkoutForm, message: e.target.value })} rows={3} placeholder="Data pretendida da campanha, objetivo, etc." className="w-full bg-brand-black/50 border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-text focus:border-brand-neon focus:outline-none resize-none" />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 bg-brand-black/40 border-t border-brand-border/50">
                            <button
                                type="submit"
                                form="quotation-form"
                                disabled={isSubmitting || cart.length === 0}
                                className="w-full bg-brand-neon text-brand-black font-bold py-3.5 rounded-xl hover:bg-brand-neon/90 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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