import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent'; // 👇 Importe aqui

export function MainLayout() {
    return (
        <div className="min-h-screen bg-brand-black flex flex-col">
            <Header />
            
            {/* O conteúdo da página entra aqui */}
            <main className="flex-1 mt-20">
                <Outlet />
            </main>
            
            <Footer />
            
            {/* 👇 O componente flutuante é renderizado no final */}
            <CookieConsent />
        </div>
    );
}