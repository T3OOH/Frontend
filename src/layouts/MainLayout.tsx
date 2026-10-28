import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import { CityScene } from '@/components/led/CityScene';

export function MainLayout() {
    return (
        <div className="relative isolate min-h-screen flex flex-col">
            {/* Fundo animado: cidade à noite com telões e trânsito (fixo atrás do conteúdo) */}
            <CityScene />
            <Header />
            <main className="flex-1 mt-20">
                <Outlet />
            </main>
            
            <Footer />
            
            <CookieConsent />
        </div>
    );
}