import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Componente global de Scroll to Top (Voltar ao topo).
 * Escuta eventos de rolagem tanto na janela global (window) quanto em 
 * contêineres internos (como o Dashboard) e exibe um Floating Action Button (FAB)
 * com animação suave para retornar ao topo.
 */
export function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    /**
     * Aciona a API nativa de rolagem com comportamento suave (smooth behavior).
     * Seleciona o contêiner de rolagem ativo no momento do clique.
     */
    const scrollToTop = () => {
        // Converte a NodeList para um Array de HTMLElements tipados
        const containers = Array.from(document.querySelectorAll('.custom-scrollbar, .overflow-y-auto')) as HTMLElement[];
        
        // Encontra o primeiro contêiner que está rolado para baixo
        const scrolledContainer = containers.find(container => container.scrollTop > 0);

        if (scrolledContainer) {
            scrolledContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    /**
     * Efeito responsável por monitorar o deslocamento (scroll).
     * O threshold (limite) para exibir o botão é de 300 pixels de rolagem.
     */
    useEffect(() => {
        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement | Document;
            
            // Verifica se o evento veio de um contêiner interno ou da janela principal
            const scrollTop = target instanceof Document 
                ? window.scrollY 
                : (target as HTMLElement).scrollTop;

            if (scrollTop > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        // Fase de captura: recebe a rolagem da janela (site público) e dos contêineres internos (dashboard)
        window.addEventListener('scroll', handleScroll, { capture: true, passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll, { capture: true });
        };
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    onClick={scrollToTop}
                    aria-label="Voltar ao topo"
                    className="group fixed bottom-28 right-4 z-[9999] flex h-11 w-11 items-center justify-center border border-white/15 bg-ink-950/95 text-ink-300 backdrop-blur transition-colors hover:border-white/40 hover:text-ink-100 lg:bottom-10 lg:right-10"
                >
                    <ChevronUp className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" strokeWidth={1.75} />
                </motion.button>
            )}
        </AnimatePresence>
    );
}