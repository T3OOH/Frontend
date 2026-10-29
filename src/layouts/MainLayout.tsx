import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import { BACKGROUND_VIDEOS, PhotoCity } from '@/components/led/PhotoCity';
import { Gateway } from '@/components/Gateway';

/**
 * A tela de escolha (T3 OOH x T3 Solution) aparece sempre que o site é aberto pelo
 * endereço inicial. Navegar dentro do site e links diretos (ex.: /mapa) não a mostram.
 */
const openedOnHome = typeof window !== 'undefined' && window.location.pathname === '/';
let gatewayShown = false;

export function MainLayout() {
    const [showGateway, setShowGateway] = useState(() => openedOnHome && !gatewayShown);
    const closeGateway = () => { gatewayShown = true; setShowGateway(false); };
    const { pathname } = useLocation();
    // A página da T3 Solution tem o próprio vídeo (casa com o telão); as demais, a cidade
    const background = pathname.startsWith('/solution') ? BACKGROUND_VIDEOS.solution : BACKGROUND_VIDEOS.cidade;

    return (
        <div className="relative isolate min-h-screen flex flex-col">
            <AnimatePresence>{showGateway && <Gateway onDone={closeGateway} />}</AnimatePresence>
            {/* Vídeo de fundo; "key" reinicia o loop ao trocar de vídeo */}
            <PhotoCity key={background.mp4} video={background} />
            <Header />
            <main className="flex-1 mt-20">
                <Outlet />
            </main>

            <Footer />

            <CookieConsent />
        </div>
    );
}
