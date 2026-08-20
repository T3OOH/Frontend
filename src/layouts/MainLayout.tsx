import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';

export function MainLayout() {
    return (
        <div className="min-h-screen bg-brand-black flex flex-col">
            <Header />
            <main className="flex-1 mt-20">
                <Outlet />
            </main>
            
            <Footer />
            
            <CookieConsent />
        </div>
    );
}