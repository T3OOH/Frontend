import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { api } from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

/** Personalização visual do site. Fica no navegador e, com a conta conectada, também no servidor. */
export interface Preferences {
    /** Tema das áreas internas (Gestão e CRM). */
    theme: 'dark' | 'light';
    /** Fundo do site: vídeo da cidade ou foto animada (mais leve). */
    background: 'video' | 'still';
    motion: 'full' | 'reduced';
    textSize: 'default' | 'large';
    avatarColor: 'orange' | 'white' | 'emerald' | 'sky' | 'rose';
    /** Mapa de painéis do site. */
    mapStyle: 'dark' | 'light';
}

export const DEFAULT_PREFERENCES: Preferences = {
    theme: 'dark',
    background: 'video',
    motion: 'full',
    textSize: 'default',
    avatarColor: 'orange',
    mapStyle: 'dark',
};

export const AVATAR_COLORS: Record<Preferences['avatarColor'], { label: string; className: string }> = {
    orange: { label: 'Laranja T3', className: 'bg-brand-neon text-ink-950' },
    white: { label: 'Branco', className: 'bg-ink-100 text-ink-950' },
    emerald: { label: 'Verde', className: 'bg-emerald-500 text-ink-950' },
    sky: { label: 'Azul', className: 'bg-sky-400 text-ink-950' },
    rose: { label: 'Rosa', className: 'bg-rose-500 text-ink-950' },
};

const STORAGE_KEY = '@t3:preferences';
const LEGACY_THEME_KEY = '@t3:theme';

/** Mantém só chaves e valores conhecidos (dados antigos ou editados à mão não quebram o site). */
function sanitize(input: unknown): Partial<Preferences> {
    if (!input || typeof input !== 'object') return {};
    const allowed: { [K in keyof Preferences]: readonly Preferences[K][] } = {
        theme: ['dark', 'light'],
        background: ['video', 'still'],
        motion: ['full', 'reduced'],
        textSize: ['default', 'large'],
        avatarColor: ['orange', 'white', 'emerald', 'sky', 'rose'],
        mapStyle: ['dark', 'light'],
    };
    const out: Partial<Preferences> = {};
    for (const key of Object.keys(allowed) as (keyof Preferences)[]) {
        const value = (input as Record<string, unknown>)[key];
        if ((allowed[key] as readonly unknown[]).includes(value)) (out as Record<string, unknown>)[key] = value;
    }
    return out;
}

function readLocal(): Preferences {
    try {
        const saved = sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
        const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY);
        if (!saved.theme && (legacyTheme === 'light' || legacyTheme === 'dark')) saved.theme = legacyTheme;
        return { ...DEFAULT_PREFERENCES, ...saved };
    } catch {
        return DEFAULT_PREFERENCES;
    }
}

interface ThemeContextType {
    preferences: Preferences;
    /** Altera uma opção; com a conta conectada, salva no servidor. Rejeita se o servidor recusar. */
    setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => Promise<void>;
    resetPreferences: () => Promise<void>;
    theme: Preferences['theme'];
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated, updateUser } = useAuth();
    const [preferences, setPreferences] = useState<Preferences>(readLocal);

    // Ao entrar na conta, as preferências salvas nela valem sobre as do navegador
    const appliedFor = useRef<string | null>(null);
    useEffect(() => {
        if (!user) { appliedFor.current = null; return; }
        if (appliedFor.current === user.id) return;
        appliedFor.current = user.id;
        const fromAccount = sanitize(user.preferences);
        if (Object.keys(fromAccount).length) setPreferences((prev) => ({ ...prev, ...fromAccount }));
    }, [user]);

    // Navegador: guarda e aplica o que vale para a página inteira
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
            localStorage.setItem(LEGACY_THEME_KEY, preferences.theme);
        } catch { /* armazenamento indisponível: vale só nesta visita */ }
        const root = document.documentElement;
        root.style.fontSize = preferences.textSize === 'large' ? '112.5%' : '';
        root.classList.toggle('reduce-motion', preferences.motion === 'reduced');
    }, [preferences]);

    const persist = useCallback(async (patch: Partial<Preferences>) => {
        if (!isAuthenticated) return;
        const { data } = await api.put('/profile/preferences', patch);
        // A sessão guardada também recebe o valor novo (senão um recarregamento traria o antigo)
        updateUser({ preferences: data });
    }, [isAuthenticated, updateUser]);

    const setPreference = useCallback(async <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
        setPreferences((prev) => ({ ...prev, [key]: value }));
        await persist({ [key]: value } as Partial<Preferences>);
    }, [persist]);

    const resetPreferences = useCallback(async () => {
        setPreferences(DEFAULT_PREFERENCES);
        await persist(DEFAULT_PREFERENCES);
    }, [persist]);

    const toggleTheme = useCallback(() => {
        setPreference('theme', preferences.theme === 'light' ? 'dark' : 'light').catch(() => {});
    }, [preferences.theme, setPreference]);

    const value = useMemo(
        () => ({ preferences, setPreference, resetPreferences, theme: preferences.theme, toggleTheme }),
        [preferences, setPreference, resetPreferences, toggleTheme],
    );

    return (
        <ThemeContext.Provider value={value}>
            {/* "user": segue o sistema; "always": a pessoa pediu menos movimento no perfil */}
            <MotionConfig reducedMotion={preferences.motion === 'reduced' ? 'always' : 'user'}>
                {children}
            </MotionConfig>
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};

export const usePreferences = useTheme;

/** Classes do quadrado com a inicial do usuário, na cor escolhida no perfil. */
export function useAvatarClass() {
    return AVATAR_COLORS[useTheme().preferences.avatarColor].className;
}
