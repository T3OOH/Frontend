import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// O painel do chat só é baixado quando a pessoa abre o balão (a home continua leve)
const PainelIaT3 = lazy(() => import('./PainelIaT3'));

/** Mesma chave do aviso de cookies (components/CookieConsent.tsx). */
const COOKIES = 't3-cookie-consent';
const cookiesRespondidos = () => { try { return !!localStorage.getItem(COOKIES); } catch { return true; } };

/** Telas internas (Gestão, CRM, reuniões, login) não mostram o balão. */
const SEM_BALAO = /^\/(dashboard|crm|reuniao|seguranca|login|cadastro|recuperar-senha|atualizar-senha)(\/|$)/;

/** Tamanho do balão e folga entre ele e o painel (px). */
const BALAO = 56;
const FOLGA = 12;

/**
 * Posição do balão (px a partir do canto inferior direito). No /mapa ele sobe: no celular acima
 * da faixa de cards e do botão "Lista"; no computador acima dos botões de zoom do mapa.
 */
export function posicaoBalao(rota: string, computador: boolean) {
    const mapa = rota === '/mapa';
    return {
        right: computador ? 32 : 16,
        bottom: mapa ? (computador ? 112 : 176) : (computador ? 32 : 24),
        // Espaço livre no alto para o chat aberto: cabeçalho (80 px) e, no /mapa, o botão "Tela cheia"
        topo: mapa ? 152 : 96,
    };
}

/**
 * Balão flutuante de dúvidas (IA T3), montado no MainLayout (site público e perfil). Fica abaixo
 * do cabeçalho (z 500): o menu do celular, o mapa em tela cheia e as janelas (carrinho, galeria,
 * orçamento) ficam por cima dele; com a tela de escolha da home aberta, ele nem aparece.
 */
export function BalaoIaT3() {
    const { pathname } = useLocation();
    const computador = useMediaQuery('(min-width: 1024px)');
    const [aberto, setAberto] = useState(false);
    const [jaAbriu, setJaAbriu] = useState(false);
    // O aviso de cookies ocupa o mesmo canto: o balão aparece depois da resposta a ele
    const [livre, setLivre] = useState(cookiesRespondidos);
    useEffect(() => {
        if (livre) return;
        const t = window.setInterval(() => { if (cookiesRespondidos()) setLivre(true); }, 1000);
        return () => window.clearInterval(t);
    }, [livre]);

    const visivel = livre && !SEM_BALAO.test(pathname);
    useEffect(() => { if (aberto) setJaAbriu(true); }, [aberto]);
    // Trocou de página para uma sem balão: fecha o chat
    useEffect(() => { if (!visivel) setAberto(false); }, [visivel]);
    // Com o chat aberto, o botão "voltar ao topo" some (ver ScrollToTopButton)
    useEffect(() => {
        document.documentElement.toggleAttribute('data-chat-aberto', aberto && visivel);
        return () => document.documentElement.removeAttribute('data-chat-aberto');
    }, [aberto, visivel]);

    if (!visivel) return null;

    const { right, bottom, topo } = posicaoBalao(pathname, computador);
    return (
        <>
            {jaAbriu && (
                <Suspense fallback={null}>
                    <PainelIaT3 aberto={aberto} onFechar={() => setAberto(false)} right={right} bottom={bottom + BALAO + FOLGA} topo={topo} />
                </Suspense>
            )}
            <button
                type="button"
                onClick={() => setAberto((a) => !a)}
                aria-label={aberto ? 'Fechar o chat de dúvidas' : 'Abrir o chat de dúvidas com a IA T3'}
                aria-expanded={aberto}
                style={{ right, bottom }}
                className="fixed z-[490] flex h-14 w-14 items-center justify-center rounded-full bg-brand-neon text-ink-950 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
                {aberto ? <X className="h-6 w-6" strokeWidth={2.25} /> : <MessageCircle className="h-6 w-6" strokeWidth={2.25} />}
                {!aberto && <span className="pointer-events-none absolute -top-1 right-0 rounded-sm bg-ink-950 px-1 py-px font-mono text-[9px] font-semibold text-brand-neon">IA</span>}
            </button>
        </>
    );
}
