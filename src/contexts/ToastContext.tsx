import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, LifeBuoy, X } from 'lucide-react';
import { lastReported } from '@/lib/errorReporting';
import { supportUrl } from '@/lib/support';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextData {
    addToast: (message: string, type: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Some sozinho: erros ficam mais tempo para dar tempo de acionar o suporte
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, type === 'error' ? 9000 : 4000);
    }, []);

    // Valor estável: páginas usam o toast em dependências de efeitos sem disparar re-execuções
    const value = useMemo<ToastContextData>(() => ({
        addToast,
        success: (msg: string) => addToast(msg, 'success'),
        error: (msg: string) => addToast(msg, 'error'),
        info: (msg: string) => addToast(msg, 'info'),
    }), [addToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            
            {/* CONTAINER DAS NOTIFICAÇÕES */}
            <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[99999] flex flex-col gap-2 md:inset-x-auto md:bottom-6 md:right-6">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 12, transition: { duration: 0.18 } }}
                            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                            className={`pointer-events-auto flex items-center gap-3 border border-l-[3px] border-white/10 bg-ink-950 py-3 pl-4 pr-2 shadow-[0_12px_30px_rgba(0,0,0,0.45)] md:min-w-[320px] md:max-w-sm ${
                                toast.type === 'success' ? 'border-l-emerald-500 text-emerald-400' :
                                toast.type === 'error' ? 'border-l-red-500 text-red-400' :
                                'border-l-brand-neon text-brand-neon'
                            }`}
                        >
                            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                            {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
                            {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
                            
                            <p className="flex-1 text-sm text-ink-100">{toast.message}</p>

                            {toast.type === 'error' && (
                                <a
                                    href={supportUrl({ message: toast.message, code: lastReported && Date.now() - lastReported.at < 60_000 ? lastReported.code : null })}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex min-h-9 shrink-0 items-center gap-1.5 border border-white/15 px-2.5 text-xs text-ink-100 transition-colors hover:border-white/40"
                                >
                                    <LifeBuoy className="h-3.5 w-3.5" aria-hidden="true" /> Acionar suporte
                                </a>
                            )}
                            
                            <button 
                                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                                aria-label="Fechar notificação"
                                className="flex h-9 w-9 shrink-0 items-center justify-center text-ink-400 transition-colors hover:text-ink-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);