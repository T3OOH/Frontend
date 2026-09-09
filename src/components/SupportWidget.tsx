import { useState } from 'react';
import { MessageSquare, X, Send, Code2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SupportWidgetProps {
    systemName?: string;
    clientName?: string;
}

export function SupportWidget({ systemName = "T3 OOH", clientName = "Cliente" }: SupportWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success'>('idle');

    const handleWhatsAppSupport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        
        setIsSubmitting(true);

        // Simulando um delay de processamento para UX
        setTimeout(() => {
            // O seu número FBR.Dev (Substitua pelo seu WhatsApp real)
            const fbrPhone = "5562999999999"; 
            
            const text = `*Suporte Solicitado - FBR.Dev*\n\n` +
                         `*Sistema:* ${systemName}\n` +
                         `*Usuário:* ${clientName}\n` +
                         `*URL atual:* ${window.location.href}\n\n` +
                         `*Mensagem:* ${message}`;

            const waUrl = `https://wa.me/${fbrPhone}?text=${encodeURIComponent(text)}`;
            window.open(waUrl, '_blank');
            
            setIsSubmitting(false);
            setStatus('success');
            setMessage('');
            
            setTimeout(() => {
                setIsOpen(false);
                setStatus('idle');
            }, 3000);
        }, 800);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[99999]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-16 right-0 w-80 bg-[#111113] border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col mb-2"
                    >
                        {/* Header da FBR */}
                        <div className="bg-gradient-to-r from-[#0A0A0B] to-[#111113] p-4 border-b border-white/5 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#FF5E00]/10 blur-xl rounded-full" />
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-8 h-8 rounded-lg bg-[#FF5E00]/10 border border-[#FF5E00]/20 flex items-center justify-center">
                                    <Code2 className="w-4 h-4 text-[#FF5E00]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white leading-tight">FBR.Dev Support</h3>
                                    <p className="text-[10px] text-[#8F8F91] font-medium">Inovação e Tecnologia</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-[#8F8F91] hover:text-white transition-colors relative z-10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Corpo do Formulário */}
                        <div className="p-5">
                            {status === 'success' ? (
                                <div className="flex flex-col items-center justify-center text-center py-6 gap-3">
                                    <div className="w-12 h-12 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                                        <MessageSquare className="w-6 h-6 text-[#25D366]" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1">Redirecionando...</h4>
                                        <p className="text-xs text-[#8F8F91]">Você será atendido no WhatsApp.</p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleWhatsAppSupport} className="flex flex-col gap-4">
                                    <p className="text-xs text-[#8F8F91] leading-relaxed">
                                        Precisa de manutenção, encontrou um bug ou quer sugerir uma melhoria no <strong className="text-white">{systemName}</strong>?
                                    </p>
                                    
                                    <textarea
                                        autoFocus
                                        rows={4}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Descreva o que você precisa..."
                                        className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-[#8F8F91]/50 focus:border-[#FF5E00]/50 focus:ring-1 focus:ring-[#FF5E00]/50 outline-none resize-none transition-all"
                                        required
                                    />

                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting || !message.trim()}
                                        className="w-full bg-[#FF5E00] hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 text-[#0A0A0B] font-black py-3 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(255,94,0,0.2)]"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Enviar Solicitação
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Botão de Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300 ${
                    isOpen ? 'bg-[#111113] border border-white/10 text-white rotate-90 scale-90' : 'bg-[#FF5E00] text-[#0A0A0B] hover:scale-105'
                }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </button>
        </div>
    );
}