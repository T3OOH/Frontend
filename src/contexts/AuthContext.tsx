import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { StoredSession, deviceId, logoutSession, onSessionChange, readSession, saveSession } from '@/lib/session';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN' | 'MANAGER' | 'COMERCIAL' | 'COMPANY';
    /** Personalização visual salva na conta (ver ThemeContext). */
    preferences?: Record<string, unknown> | null;
}

/** Resposta de login do backend (senha ou Google). */
export interface LoginResponse {
    token: string;
    user: User;
    refreshToken?: string;
    persistent?: boolean;
}

interface AuthContextData {
    user: User | null;
    isAuthenticated: boolean;
    signIn: (response: LoginResponse) => void;
    signOut: () => void;
    /** Atualiza dados do usuário na sessão atual (ex.: preferências salvas no perfil). */
    updateUser: (patch: Partial<User>) => void;
    /** Entra (ou cria a conta) com a credencial devolvida pelo botão do Google. */
    signInWithGoogle: (credential: string, remember?: boolean) => Promise<{ created: boolean }>;

    // Novas funções do fluxo de autenticação e recuperação
    registerUser: (email: string, password: string, name: string) => Promise<void>;
    sendPasswordResetEmail: (email: string) => Promise<void>;
    updatePassword: (password: string, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

/**
 * Provider de Autenticação Global.
 * A sessão (tokens, renovação e sincronização entre abas) fica em lib/session.ts;
 * aqui só o estado de tela acompanha.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<StoredSession | null>(readSession);

    // Renovação, saída ou login em outra aba: a tela acompanha
    useEffect(() => onSessionChange(setSession), []);

    /** Guarda a sessão (no navegador se "manter conectado", senão só na aba). */
    const signIn = (response: LoginResponse) => {
        saveSession({
            token: response.token,
            user: response.user,
            refreshToken: response.refreshToken,
            persistent: response.persistent ?? false,
        });
    };

    const updateUser = useCallback((patch: Partial<User>) => {
        const current = readSession();
        if (current) saveSession({ ...current, user: { ...current.user, ...patch } });
    }, []);

    const signInWithGoogle = async (credential: string, remember = true) => {
        const { data } = await api.post('/auth/google', { credential, deviceId: deviceId(), remember });
        signIn(data);
        return { created: Boolean(data.created) };
    };

    /**
     * Encerra a sessão deste aparelho (também no servidor) e volta para o login.
     */
    const signOut = () => {
        logoutSession();
        window.location.assign('/login');
    };

    /**
     * Registra um novo usuário através da API.
     * Como a confirmação de e-mail está ativa, o login não é feito automaticamente.
     */
    const registerUser = async (email: string, password: string, name: string) => {
        await api.post('/auth/register', { email, password, name });
    };

    /**
     * Solicita ao backend o envio do e-mail de recuperação de senha.
     */
    const sendPasswordResetEmail = async (email: string) => {
        await api.post('/auth/forgot-password', { email });
    };

    /**
     * Envia a nova senha para o backend após o usuário acessar o link seguro.
     */
    const updatePassword = async (password: string, token: string) => {
        await api.post('/auth/reset-password', { token, password });
    };

    return (
        <AuthContext.Provider
            value={{
                user: session?.user ?? null,
                isAuthenticated: Boolean(session),
                signIn,
                signOut,
                updateUser,
                signInWithGoogle,
                registerUser,
                sendPasswordResetEmail,
                updatePassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
