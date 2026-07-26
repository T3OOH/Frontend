import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Joga o scroll para o topo toda vez que a rota (pathname) mudar
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant' // Pode usar 'smooth' se quiser que ele suba rolando suavemente
        });
    }, [pathname]);

    return null; // Este componente não renderiza nada na tela
}