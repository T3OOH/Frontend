import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { installAnalytics, trackPageview } from '@/lib/analytics';

installAnalytics();

/** Conta cada página vista do site público (as áreas internas ficam de fora). */
export function AnalyticsTracker() {
    const { pathname } = useLocation();
    useEffect(() => { trackPageview(pathname); }, [pathname]);
    return null;
}
