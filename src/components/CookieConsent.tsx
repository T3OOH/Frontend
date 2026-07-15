import { useState, useEffect } from 'react';
import { Shield, Cookie } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('t3-cookie-consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('t3-cookie-consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('t3-cookie-consent', 'declined');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed bottom-6 left-0 right-0 mx-auto w-[90%] md:w-fit z-[9999] max-w-2xl glass-panel p-5 sm:p-6 rounded-2xl border border-brand-border/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row gap-5 items-center justify-between bg-[#0A0A0B]/90 backdrop-blur-x2"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-brand-neon/10 rounded-xl border border-brand-neon/20 flex-shrink-0">
                            <Cookie className="w-6 h-6 text-brand-neon" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-bold text-brand-text mb-1">Privacidade e Cookies</h3>
                            <p className="text-xs text-brand-muted leading-relaxed">
                                Utilizamos cookies essenciais para garantir o funcionamento da plataforma e cookies analíticos para melhorar sua experiência. 
                                Ao continuar navegando, você concorda com a nossa política de privacidade.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full md:w-auto text-xs border border-brand-border/40 hover:bg-brand-surface"
                            onClick={handleDecline}
                        >
                            Apenas Essenciais
                        </Button>
                        <Button 
                            size="sm" 
                            className="w-full md:w-auto text-xs shadow-[0_0_15px_rgba(255,94,0,0.2)]"
                            onClick={handleAccept}
                            leftIcon={<Shield className="w-3 h-3" />}
                        >
                            Aceitar Todos
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}