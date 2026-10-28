import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const STORAGE_KEY = 't3-cookie-consent';

const readConsent = () => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
};
const saveConsent = (value: string) => {
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* storage indisponível */ }
};

/**
 * Aviso de privacidade: faixa compacta no rodapé da tela.
 * Antes era um cartão grande no topo que cobria o título das páginas no celular.
 */
export function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Espera a página aparecer antes de mostrar o aviso
        const t = setTimeout(() => { if (!readConsent()) setVisible(true); }, 1200);
        return () => clearTimeout(t);
    }, []);

    // Só há recursos essenciais: o aviso é informativo e registra apenas que foi lido
    const accept = () => {
        saveConsent('acknowledged');
        setVisible(false);
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 40, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                    role="region"
                    aria-label="Aviso de privacidade"
                    className="fixed inset-x-0 bottom-0 z-[9999] border-t border-white/10 bg-ink-950/95 backdrop-blur md:inset-x-auto md:bottom-6 md:right-6 md:max-w-md md:border"
                >
                    <div className="flex items-center gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-4">
                        <p className="flex-1 text-xs leading-relaxed text-ink-300 md:text-sm">
                            Usamos só o essencial (login, orçamento e reCAPTCHA). Sem cookies de publicidade.{' '}
                            <Link to="/privacidade" className="text-ink-100 underline underline-offset-2 hover:text-brand-neon">Privacidade</Link>
                        </p>
                        <button type="button" onClick={accept} className="min-h-[44px] shrink-0 bg-brand-neon px-5 text-sm font-semibold text-ink-950 hover:bg-brand-neonHover">
                            Entendi
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
