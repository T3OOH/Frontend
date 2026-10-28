import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import { PhotoCity } from '@/components/led/PhotoCity';

export function MainLayout() {
    return (
        <div className="relative isolate min-h-screen flex flex-col">
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