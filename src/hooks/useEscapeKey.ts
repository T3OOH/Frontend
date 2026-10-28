import { useEffect, useRef } from 'react';

/** Fecha modais e painéis com a tecla Esc enquanto `active` for verdadeiro. */
export function useEscapeKey(active: boolean, onEscape: () => void) {
    const handlerRef = useRef(onEscape);
    handlerRef.current = onEscape;

    useEffect(() => {
        if (!active) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') handlerRef.current();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [active]);
}
