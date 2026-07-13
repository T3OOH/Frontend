import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';

export function MainLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-brand-black w-full">

            {/* Nosso novo Header Modular */}
            <Header />

            {/* O Outlet é onde as páginas (Home, Contato, etc) serão injetadas */}
            {/* pt-20 compensa a altura exata do Header fixo (h-20) */}
            <main className="flex-1 pt-20 flex flex-col">
                <Outlet />
            </main>

            {/* Footer Temporário */}
            <footer className="border-t border-brand-border py-8 text-center text-brand-muted text-sm mt-auto">
                &copy; {new Date().getFullYear()} T3 OOH. Todos os direitos reservados.
            </footer>
        </div>
    );
}