import { useEffect, useState } from 'react';

/** Acompanha uma media query CSS (ex.: '(min-width: 1024px)'). */
export function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(query).matches : false
    );

    useEffect(() => {
        const media = window.matchMedia(query);
        const onChange = () => setMatches(media.matches);
        onChange();
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, [query]);

    return matches;
}

/** Breakpoint "lg" do Tailwind. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
