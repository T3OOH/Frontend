import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import { PhotoCity } from '@/components/led/PhotoCity';
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

    return (
        <div className="relative isolate min-h-screen flex flex-col">
            <AnimatePresence>{showGateway && <Gateway onDone={closeGateway} />}</AnimatePresence>
            {/* Fundo realista: foto de Goiânia com telões de LED e trânsito animados */}
            <PhotoCity />
            <Header />
            <main className="flex-1 mt-20">
                <Outlet />
            </main>
            
            <Footer />
            
            <CookieConsent />
        </div>
    );
}