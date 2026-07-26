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
    
    // Novas funções do fluxo de autenticação e recuperação
    registerUser: (email: string, password: string, name: string) => Promise<void>;
    sendPasswordResetEmail: (email: string) => Promise<void>;
    updatePassword: (password: string, token: string) => Promise<void>;
}

/**
 * Lê e valida a sessão atual armazenada no SessionStorage do navegador.
 * Garante que dados corrompidos sejam limpos imediatamente.
 */
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

// Inicializa a sessão e já injeta o token no Axios para requisições subsequentes
const initialSession = readSession();
if (initialSession) {
    api.defaults.headers.common.Authorization = `Bearer ${initialSession.token}`;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

/**
 * Provider de Autenticação Global.
 * Gerencia o estado do usuário logado e expõe os métodos de comunicação com a API.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<StoredSession | null>(initialSession);

    /**
     * Autentica o usuário na aplicação, salvando o token na sessão e no Axios.
     */
    const signIn = (token: string, user: User) => {
        const nextSession = { token, user };
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        setSession(nextSession);
    };

    /**
     * Encerra a sessão do usuário, limpando os dados locais e redirecionando para o login.
     */
    const signOut = () => {
        window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
        delete api.defaults.headers.common.Authorization;
        setSession(null);
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
        
        // NOTA: Se você decidir usar o cliente do Supabase diretamente no Frontend futuramente:
        // const { error } = await supabase.auth.resetPasswordForEmail(email, {
        //    redirectTo: `${window.location.origin}/atualizar-senha`,
        // });
        // if (error) throw error;
    };

    /**
     * Envia a nova senha para o backend após o usuário acessar o link seguro.
     */
    const updatePassword = async (password: string) => {
        await api.post('/auth/reset-password', { password });
    };

    return (
        <AuthContext.Provider
            value={{
                user: session?.user ?? null,
                isAuthenticated: Boolean(session),
                signIn,
                signOut,
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