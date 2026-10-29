import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/axios';
import { clearSession } from '@/lib/session';
import { apiErrorMessage } from '@/lib/upload';
import { Seo } from '@/components/Seo';
import { AuthShell } from '@/components/AuthShell';
import { btnGhost, btnPrimary } from '@/lib/ui';

/**
 * "Não fui eu": aberta pelo e-mail de acesso em aparelho novo.
 * Só age depois do clique (leitores de e-mail costumam abrir os links sozinhos para checar).
 * Encerra todos os aparelhos e leva direto para criar a senha nova.
 */
export function ReportAccess() {
    const navigate = useNavigate();
    const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '');
    const [state, setState] = useState<'idle' | 'busy' | 'error'>(token ? 'idle' : 'error');
    const [error, setError] = useState(token ? '' : 'O link está incompleto. Abra de novo pelo e-mail.');

    // O token sai da barra de endereço (histórico, prints e compartilhamentos)
    useEffect(() => {
        if (token) window.history.replaceState(null, '', window.location.pathname);
    }, [token]);

    const protect = async () => {
        setState('busy');
        try {
            const { data } = await api.post<{ resetToken: string }>('/auth/report-access', { token });
            clearSession();
            navigate(`/atualizar-senha?token=${encodeURIComponent(data.resetToken)}`, { replace: true });
        } catch (e) {
            setError(apiErrorMessage(e, 'Não foi possível proteger a conta agora. Tente de novo.'));
            setState('error');
        }
    };

    return (
        <>
            <Seo title="Proteger minha conta" description="Encerre os acessos à sua conta T3 OOH e crie uma nova senha." path="/seguranca/nao-fui-eu" noIndex />
            <AuthShell
                eyebrow="Segurança da conta"
                title={<>Não foi<br />você?</>}
                subtitle="Vamos encerrar o acesso em todos os aparelhos e, em seguida, você cria uma nova senha."
                footer={<>Foi você? <Link to="/" className="text-ink-100 underline underline-offset-4 hover:text-brand-neon">Voltar ao site</Link>, não precisa fazer nada.</>}
            >
                <div className="flex flex-col gap-5">
                    <ol className="flex flex-col gap-3 text-sm text-ink-300">
                        <li className="flex gap-3"><span className="font-mono text-brand-neon">01</span> Todos os aparelhos saem da conta, inclusive este.</li>
                        <li className="flex gap-3"><span className="font-mono text-brand-neon">02</span> Você cria uma senha nova na próxima tela.</li>
                        <li className="flex gap-3"><span className="font-mono text-brand-neon">03</span> Depois, entre de novo com a senha nova.</li>
                    </ol>

                    {state === 'error' && (
                        <div role="alert" className="flex gap-3 border-l-2 border-brand-neon bg-ink-900 p-4 text-sm text-ink-300">
                            <ShieldAlert className="h-5 w-5 shrink-0 text-brand-neon" strokeWidth={1.75} aria-hidden="true" />
                            <div>
                                <p>{error}</p>
                                <Link to="/recuperar-senha" className="mt-3 inline-block text-ink-100 underline underline-offset-4 hover:text-brand-neon">Criar nova senha pelo e-mail</Link>
                            </div>
                        </div>
                    )}

                    {state !== 'error' && (
                        <button type="button" onClick={protect} disabled={state === 'busy'} className={`${btnPrimary} h-12 w-full`}>
                            {state === 'busy' ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Protegendo a conta…</> : 'Proteger minha conta'}
                        </button>
                    )}
                    <Link to="/" className={`${btnGhost} w-full`}>Foi eu, voltar ao site</Link>
                </div>
            </AuthShell>
        </>
    );
}
