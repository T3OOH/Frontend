import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiErrorMessage } from '@/lib/upload';

/** ID do cliente OAuth (Google Cloud → Credenciais). Sem ele o botão não aparece. */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface GoogleIdApi {
    initialize: (config: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: 'popup'; cancel_on_tap_outside?: boolean }) => void;
    renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
}
declare global {
    interface Window { google?: { accounts: { id: GoogleIdApi } } }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise: Promise<void> | null = null;

/** Carrega o script do Google uma vez só, sob demanda (só nas telas de login e cadastro). */
function loadGoogleScript() {
    if (window.google?.accounts?.id) return Promise.resolve();
    scriptPromise ??= new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = SCRIPT_SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => { scriptPromise = null; reject(new Error('google script')); };
        document.head.appendChild(script);
    });
    return scriptPromise;
}

interface GoogleSignInProps {
    /** Texto do botão: "Continuar com o Google" (entrar) ou "Inscrever-se com o Google" (cadastro). */
    mode?: 'signin' | 'signup';
    /** "Manter conectado" da tela de login (o cadastro mantém por padrão). */
    remember?: boolean;
}

/**
 * Botão oficial do Google (Google Identity Services). O Google devolve uma credencial (ID token)
 * que o backend confere em /auth/google: entra na conta com o mesmo e-mail ou cria uma conta de cliente.
 */
export function GoogleSignIn({ mode = 'signin', remember = true }: GoogleSignInProps) {
    const box = useRef<HTMLDivElement>(null);
    const { signInWithGoogle } = useAuth();
    const toast = useToast();
    const [state, setState] = useState<'loading' | 'ready' | 'busy' | 'error'>('loading');
    // O callback é registrado uma vez no script do Google; a ref mantém a versão atual
    const onCredential = useRef<(credential: string) => void>(() => {});

    onCredential.current = async (credential: string) => {
        setState('busy');
        try {
            const { created } = await signInWithGoogle(credential, remember);
            // Login e cadastro já redirecionam quando a sessão começa
            toast.success(created ? 'Conta criada com o Google. Complete seus dados em Meu perfil.' : 'Login realizado com sucesso!');
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Não foi possível entrar com o Google. Tente de novo.'));
            setState('ready');
        }
    };

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;
        let alive = true;
        loadGoogleScript()
            .then(() => {
                if (!alive || !box.current || !window.google) return;
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: ({ credential }) => credential && onCredential.current(credential),
                    ux_mode: 'popup',
                    cancel_on_tap_outside: true,
                });
                window.google.accounts.id.renderButton(box.current, {
                    type: 'standard',
                    theme: 'filled_black',
                    size: 'large',
                    shape: 'rectangular',
                    text: mode === 'signup' ? 'signup_with' : 'continue_with',
                    logo_alignment: 'center',
                    locale: 'pt-BR',
                    width: Math.min(400, box.current.offsetWidth || 400),
                });
                setState('ready');
            })
            .catch(() => alive && setState('error'));
        return () => { alive = false; };
    }, [mode]);

    if (!GOOGLE_CLIENT_ID) return null;

    return (
        <div className="flex flex-col gap-5">
            <div className="relative min-h-[44px]">
                {/* O Google desenha o botão aqui (iframe próprio, com a marca dele) */}
                <div ref={box} className={`flex w-full justify-center ${state === 'busy' ? 'pointer-events-none opacity-40' : ''}`} />
                {(state === 'loading' || state === 'busy') && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 border border-white/10 text-sm text-ink-400">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> {state === 'busy' ? 'Entrando com o Google…' : 'Carregando Google…'}
                    </div>
                )}
                {state === 'error' && (
                    <p className="border border-white/10 px-4 py-3 text-center text-sm text-ink-400">O login com Google não carregou. Use e-mail e senha.</p>
                )}
            </div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-ink-500" aria-hidden="true">
                <span className="h-px flex-1 bg-white/10" /> ou com e-mail <span className="h-px flex-1 bg-white/10" />
            </div>
        </div>
    );
}
