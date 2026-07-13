import { createContext, ReactNode, useContext, useState } from 'react';
import { api, AUTH_STORAGE_KEY } from '@/lib/axios';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN' | 'MANAGER';
}

interface StoredSession {
    token: string;
    user: User;
}

interface AuthContextData {
    user: User | null;
    isAuthenticated: boolean;
    signIn: (token: string, user: User) => void;
    signOut: () => void;
}

function readSession(): StoredSession | null {
    if (typeof window === 'undefined') return null;

    try {
        const serialized = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (!serialized) return null;

        const session = JSON.parse(serialized) as StoredSession;
        if (!session.token || !session.user) return null;
        return session;
    } catch {
        window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
    }
}

const initialSession = readSession();
if (initialSession) {
    api.defaults.headers.common.Authorization = `Bearer ${initialSession.token}`;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<StoredSession | null>(initialSession);

    const signIn = (token: string, user: User) => {
        const nextSession = { token, user };
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        setSession(nextSession);
    };

    const signOut = () => {
        window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
        delete api.defaults.headers.common.Authorization;
        setSession(null);
        window.location.assign('/login');
    };

    return (
        <AuthContext.Provider
            value={{
                user: session?.user ?? null,
                isAuthenticated: Boolean(session),
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
