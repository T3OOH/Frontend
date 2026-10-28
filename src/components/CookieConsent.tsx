import { useState, useEffect } from 'react';
import { Shield, Cookie } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';

const STORAGE_KEY = 't3-cookie-consent';

const readConsent = () => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
};
const saveConsent = (value: string) => {
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* storage indisponível */ }
};

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!readConsent()) {
            setIsVisible(true);
        }
    }, []);

    // Só há recursos essenciais: o aviso é informativo e registra apenas que foi lido
    const handleAccept = () => {
        saveConsent('acknowledged');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 24, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    role="dialog"
                    aria-live="polite"
                    aria-label="Aviso de privacidade e cookies"
                    className="fixed top-24 lg:top-auto lg:bottom-6 left-0 right-0 mx-auto w-[90%] md:w-fit z-[9999] max-w-2xl glass-panel p-5 sm:p-6 rounded-2xl border border-brand-border/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row gap-5 items-center justify-between bg-[#0A0A0B]/90 backdrop-blur-xl"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-brand-neon/10 rounded-xl border border-brand-neon/20 flex-shrink-0">
                            <Cookie className="w-6 h-6 text-brand-neon" aria-hidden="true" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-bold text-brand-text mb-1">Privacidade e Cookies</h3>
                            <p className="text-xs text-brand-muted leading-relaxed">
                                Usamos apenas recursos essenciais para o site funcionar (login, carrinho e preferências) e a verificação
                                anti-robô do Google reCAPTCHA. Não usamos cookies de publicidade.{' '}
                                <Link to="/privacidade" className="text-white underline underline-offset-2 hover:text-brand-neon">Política de Privacidade</Link>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
                        <Button
                            size="sm" 
                            className="w-full md:w-auto text-xs shadow-[0_0_15px_rgba(255,94,0,0.2)]"
                            onClick={handleAccept}
                            leftIcon={<Shield className="w-3 h-3" aria-hidden="true" />}
                        >
                            Entendi
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}