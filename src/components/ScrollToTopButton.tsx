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

        // Captura a rolagem global (Site Público)
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Configuração para capturar a rolagem interna no Dashboard (captura na fase de captura)
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('scroll', handleScroll, true);
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
                    className="fixed bottom-28 right-5 lg:bottom-10 lg:right-10 z-[9999] p-3 rounded-full bg-[#111113]/80 backdrop-blur-md border border-brand-border/40 text-brand-muted shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:text-brand-neon hover:border-brand-neon/50 hover:bg-[#111113] active:scale-95 transition-colors group"
                >
                    <ChevronUp className="w-5 h-5 lg:w-6 lg:h-6 group-hover:-translate-y-1 transition-transform" />
                </motion.button>
            )}
        </AnimatePresence>
    );
}