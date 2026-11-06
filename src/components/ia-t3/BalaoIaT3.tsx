import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X } from 'lucide-react';

// O painel do chat só é baixado quando a pessoa abre o balão (a home continua leve)
const PainelIaT3 = lazy(() => import('./PainelIaT3'));

/** Mesma chave do aviso de cookies (components/CookieConsent.tsx). */
const COOKIES = 't3-cookie-consent';
const cookiesRespondidos = () => { try { return !!localStorage.getItem(COOKIES); } catch { return true; } };

/** Telas internas (Gestão, CRM, reuniões, login) não mostram o balão. */
const SEM_BALAO = /^\/(dashboard|crm|reuniao|seguranca|login|cadastro|recuperar-senha|atualizar-senha)(\/|$)/;

/**
 * Balão flutuante de dúvidas (IA T3), em todas as páginas do site. No /mapa do celular sobe para
 * não cobrir a faixa de cards dos painéis.
 */
export function BalaoIaT3() {
    const { pathname } = useLocation();
    const [aberto, setAberto] = useState(false);
    const [jaAbriu, setJaAbriu] = useState(false);
    // O aviso de cookies ocupa o mesmo canto: o balão aparece depois da resposta a ele
    const [livre, setLivre] = useState(cookiesRespondidos);
    useEffect(() => {
        if (livre) return;
        const t = window.setInterval(() => { if (cookiesRespondidos()) setLivre(true); }, 1000);
        return () => window.clearInterval(t);
    }, [livre]);

    useEffect(() => { if (aberto) setJaAbriu(true); }, [aberto]);
    if (!livre || SEM_BALAO.test(pathname)) return null;

    const noMapa = pathname === '/mapa';
    return (
        <>
            {jaAbriu && (
                <Suspense fallback={null}>
                    <PainelIaT3 aberto={aberto} onFechar={() => setAberto(false)} noMapa={noMapa} />
                </Suspense>
            )}
            <button
                type="button"
                onClick={() => setAberto((a) => !a)}
                aria-label={aberto ? 'Fechar o chat de dúvidas' : 'Abrir o chat de dúvidas com a IA T3'}
                aria-expanded={aberto}
                className={`fixed right-4 z-[10001] flex h-14 w-14 items-center justify-center rounded-full bg-brand-neon text-ink-950 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:bottom-8 lg:right-8 ${noMapa ? 'bottom-44' : 'bottom-6'}`}
            >
                {aberto ? <X className="h-6 w-6" strokeWidth={2.25} /> : <MessageCircle className="h-6 w-6" strokeWidth={2.25} />}
                {!aberto && <span className="pointer-events-none absolute -top-1 right-0 rounded-sm bg-ink-950 px-1 py-px font-mono text-[9px] font-semibold text-brand-neon">IA</span>}
            </button>
        </>
    );
}
