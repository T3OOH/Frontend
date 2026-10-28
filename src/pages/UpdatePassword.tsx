import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Seo } from '@/components/Seo';
import { AuthShell, authInput } from '@/components/AuthShell';
import { DEFAULT_SALES_PHONE } from '@/lib/contacts';
import { btnGhost, btnPrimary } from '@/lib/ui';

type Step = 'request' | 'sent' | 'reset' | 'expired' | 'done';

const RULES = [
    { id: 'len', label: '8 caracteres ou mais', test: (p: string) => p.length >= 8 },
    { id: 'upper', label: 'Uma letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
    { id: 'digit', label: 'Um número', test: (p: string) => /\d/.test(p) },
];

/** Lê a validade do token (JWT) sem verificar a assinatura: só para avisar cedo que o link expirou. */
const tokenExpired = (token: string) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
    } catch {
        return true;
    }
};

const apiError = (error: unknown) => (error as { response?: { status?: number; data?: { error?: string } } }).response;

const field = `${authInput} w-full border px-4 focus:outline-none`;

/**
 * Recuperação de senha.
 * /recuperar-senha: pede o link por e-mail.
 * /atualizar-senha?token=…: define a nova senha (o token sai da barra de endereço ao abrir).
 */
export function UpdatePassword() {
    const { updatePassword, sendPasswordResetEmail } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // O token fica só na memória; a URL é limpa para não ir para o histórico
    const [token] = useState(() => searchParams.get('token'));
    const [step, setStep] = useState<Step>(() => (token ? (tokenExpired(token) ? 'expired' : 'reset') : 'request'));
    useEffect(() => {
        if (searchParams.has('token')) navigate({ search: '' }, { replace: true });
    }, [searchParams, navigate]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [show, setShow] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<{ message: string; contact?: boolean } | null>(null);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const checks = useMemo(() => RULES.map((r) => ({ ...r, ok: r.test(password) })), [password]);
    const strong = checks.every((c) => c.ok);
    const matches = confirm.length > 0 && confirm === password;

    /** `resend`: reenvio para o mesmo e-mail, que respeita a espera de 60s. */
    const requestLink = async (e?: FormEvent, resend = false) => {
        e?.preventDefault();
        if (busy || (resend && cooldown > 0)) return;
        setError(null);
        try {
            setBusy(true);
            await sendPasswordResetEmail(email.trim().toLowerCase());
            setStep('sent');
            setCooldown(60);
        } catch (err) {
            const res = apiError(err);
            const unavailable = res?.status === 503 || res?.status === 502;
            setError({
                message: res?.status === 429
                    ? res.data?.error || 'Muitos pedidos. Aguarde alguns minutos.'
                    : res?.data?.error || 'Não foi possível enviar o e-mail. Confira sua conexão e tente de novo.',
                contact: unavailable,
            });
        } finally {
            setBusy(false);
        }
    };

    const savePassword = async (e: FormEvent) => {
        e.preventDefault();
        if (!token || busy || !strong || !matches) return;
        setError(null);
        try {
            setBusy(true);
            await updatePassword(password, token);
            setStep('done');
        } catch (err) {
            const res = apiError(err);
            if (res?.status === 401) setStep('expired');
            else setError({ message: res?.data?.error || 'Não foi possível salvar a nova senha. Tente de novo.' });
        } finally {
            setBusy(false);
        }
    };

    const titles: Record<Step, { title: ReactNode; subtitle: string }> = {
        request: { title: <>Recuperar<br />senha</>, subtitle: 'Informe o e-mail da sua conta. Enviamos um link para criar uma nova senha, válido por 15 minutos.' },
        sent: { title: <>Confira seu<br />e-mail</>, subtitle: 'Se houver uma conta com esse e-mail, o link chega em instantes.' },
        reset: { title: <>Criar nova<br />senha</>, subtitle: 'Escolha a nova senha da sua conta.' },
        expired: { title: <>Link<br />expirado</>, subtitle: 'O link de recuperação vale por 15 minutos e só pode ser usado uma vez.' },
        done: { title: <>Senha<br />atualizada</>, subtitle: 'Pronto. Entre com a nova senha.' },
    };

    const whatsapp = `https://wa.me/${DEFAULT_SALES_PHONE}?text=${encodeURIComponent('Olá! Preciso de ajuda para recuperar o acesso à minha conta na T3 OOH.')}`;

    const ErrorBox = () => error && (
        <div role="alert" className="border-l-2 border-red-500 bg-red-500/10 p-4 text-sm leading-relaxed text-red-200">
            {error.message}
            {error.contact && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="mt-3 flex w-fit items-center gap-2 text-ink-100 underline underline-offset-4">
                    <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Falar com o comercial
                </a>
            )}
        </div>
    );

    return (
        <>
            <Seo title="Recuperar senha" description="Recupere o acesso à sua conta T3 OOH." path="/recuperar-senha" noIndex />
            <AuthShell
                eyebrow="Acesso"
                title={titles[step].title}
                subtitle={titles[step].subtitle}
                footer={<Link to="/login" className="inline-flex min-h-[44px] items-center gap-1.5 hover:text-ink-100"><ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Voltar para o login</Link>}
            >
                {/* ============================ PEDIR O LINK ============================ */}
                {step === 'request' && (
                    <form onSubmit={requestLink} className="flex flex-col gap-5" noValidate>
                        <div>
                            <label htmlFor="rp-email" className="mb-2 block text-sm text-ink-300">E-mail da conta</label>
                            <input id="rp-email" type="email" required autoComplete="email" inputMode="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com.br" className={field} />
                        </div>
                        <ErrorBox />
                        <button type="submit" disabled={busy || !/\S+@\S+\.\S+/.test(email)} className={`${btnPrimary} h-12 w-full`}>
                            {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Enviando</> : <>Enviar link <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
                        </button>
                    </form>
                )}

                {/* ============================ LINK ENVIADO ============================ */}
                {step === 'sent' && (
                    <div className="flex flex-col gap-5">
                        <div role="status" className="border-l-2 border-brand-neon bg-ink-900 p-5 text-sm leading-relaxed text-ink-300">
                            Enviamos para <strong className="font-medium text-ink-100">{email.trim().toLowerCase()}</strong>. Abra o e-mail "Crie uma nova senha" e toque no botão. Não chegou? Veja o spam e as promoções.
                        </div>
                        <ErrorBox />
                        <button type="button" onClick={() => requestLink(undefined, true)} disabled={busy || cooldown > 0} className={`${btnGhost} h-12 w-full disabled:opacity-50`}>
                            {cooldown > 0 ? <>Reenviar em <span className="font-mono">{cooldown}s</span></> : busy ? 'Enviando…' : 'Reenviar link'}
                        </button>
                        <button type="button" onClick={() => { setStep('request'); setError(null); setCooldown(0); }} className="min-h-[44px] self-start text-sm text-ink-400 underline-offset-4 hover:text-ink-100 hover:underline">
                            Usar outro e-mail
                        </button>
                    </div>
                )}

                {/* ============================ NOVA SENHA ============================ */}
                {step === 'reset' && (
                    <form onSubmit={savePassword} className="flex flex-col gap-5" noValidate>
                        <div>
                            <label htmlFor="rp-pass" className="mb-2 block text-sm text-ink-300">Nova senha</label>
                            <div className="relative">
                                <input id="rp-pass" type={show ? 'text' : 'password'} required autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="rp-rules" className={`${field} pr-12`} />
                                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={show} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-400 hover:text-ink-100">
                                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <ul id="rp-rules" className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                                {checks.map((c) => (
                                    <li key={c.id} className={`flex items-center gap-1.5 ${c.ok ? 'text-emerald-400' : 'text-ink-500'}`}>
                                        <Check className={`h-3.5 w-3.5 ${c.ok ? 'opacity-100' : 'opacity-30'}`} strokeWidth={2.5} aria-hidden="true" />
                                        {c.label}<span className="sr-only">{c.ok ? ': ok' : ': pendente'}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <label htmlFor="rp-confirm" className="mb-2 block text-sm text-ink-300">Repita a nova senha</label>
                            <input id="rp-confirm" type={show ? 'text' : 'password'} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={confirm.length > 0 && !matches} className={`${field} ${confirm.length > 0 && !matches ? 'border-red-500' : ''}`} />
                            {confirm.length > 0 && !matches && <p className="mt-2 text-sm text-red-400">As senhas não são iguais.</p>}
                        </div>
                        <ErrorBox />
                        <button type="submit" disabled={busy || !strong || !matches} className={`${btnPrimary} h-12 w-full`}>
                            {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Salvando</> : 'Salvar nova senha'}
                        </button>
                    </form>
                )}

                {/* ============================ LINK EXPIRADO ============================ */}
                {step === 'expired' && (
                    <div className="flex flex-col gap-5">
                        <p className="border-l-2 border-red-500 bg-red-500/10 p-5 text-sm leading-relaxed text-red-200">
                            Este link não vale mais. Peça um novo e use em até 15 minutos.
                        </p>
                        <button type="button" onClick={() => { setStep('request'); setError(null); }} className={`${btnPrimary} h-12 w-full`}>
                            Pedir novo link <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                )}

                {/* ============================ CONCLUÍDO ============================ */}
                {step === 'done' && (
                    <div className="flex flex-col gap-5">
                        <p role="status" className="flex items-center gap-3 border-l-2 border-emerald-500 bg-emerald-500/10 p-5 text-sm text-emerald-200">
                            <Check className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden="true" /> Sua senha foi alterada. Links de recuperação antigos deixaram de valer.
                        </p>
                        <Link to="/login" className={`${btnPrimary} h-12 w-full`}>Entrar <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                    </div>
                )}
            </AuthShell>
        </>
    );
}
