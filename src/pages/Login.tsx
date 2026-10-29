import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/Input';
import { loginSchema, LoginFormData } from '@/schemas/login.schema';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ReCAPTCHA from 'react-google-recaptcha';
import { Captcha, RECAPTCHA_SITE_KEY } from '@/components/Captcha';
import { Seo } from '@/components/Seo';
import { AuthShell, authInput } from '@/components/AuthShell';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { btnPrimary } from '@/lib/ui';

export function Login() {
    const navigate = useNavigate();
    const { signIn, isAuthenticated } = useAuth(); 
    const toast = useToast();

    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [remember, setRemember] = useState(true);
    const captchaRef = useRef<ReCAPTCHA>(null);

    // Redireciona se já estiver logado
    useEffect(() => {
        if (isAuthenticated) navigate('/', { replace: true });
    }, [isAuthenticated, navigate]);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => { 
        if (!captchaToken) {
            toast.error('Por favor, confirme que você não é um robô.');
            return;
        }

        try {
            const response = await authService.login({ ...data, captchaToken, remember });
            signIn(response);
            toast.success('Login realizado com sucesso!');
        } catch (error: any) {
            // O token do reCAPTCHA é de uso único: exige nova verificação
            captchaRef.current?.reset();
            setCaptchaToken(null);
            const backendError = error.response?.data;
            if (backendError?.details) {
                toast.error(`Erro: ${backendError.details[0].message}`);
            } else if (backendError?.error) {
                toast.error(`Erro: ${backendError.error}`);
            } else {
                toast.error("Falha no login. Verifique suas credenciais.");
            }
        }
    };

    return (
        <>
            <Seo title="Entrar" description="Acesse sua conta na plataforma T3 OOH." path="/login" noIndex />
            <AuthShell
                eyebrow="Área do cliente"
                title={<>Entrar na<br />sua conta</>}
                subtitle="Acompanhe seus orçamentos, pedidos e campanhas nos telões da T3."
                footer={<>Ainda não tem conta? <Link to="/cadastro" className="text-ink-100 underline underline-offset-4 hover:text-brand-neon">Criar conta</Link></>}
            >
                <GoogleSignIn mode="signin" remember={remember} />
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
                    <Input
                        id="login-email"
                        label="E-mail"
                        type="email"
                        placeholder="voce@empresa.com.br"
                        autoComplete="email"
                        error={errors.email?.message}
                        className={authInput}
                        {...register('email')}
                    />
                    <div className="flex flex-col gap-2">
                        <Input
                            id="login-senha"
                            label="Senha"
                            type="password"
                            placeholder="Sua senha"
                            autoComplete="current-password"
                            error={errors.password?.message}
                            className={authInput}
                            {...register('password')}
                        />
                        <div className="-my-2 flex items-center justify-between gap-3">
                            <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm text-ink-300">
                                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[#FF5E00]" />
                                Manter conectado
                            </label>
                            <Link to="/recuperar-senha" className="py-3 text-sm text-ink-400 hover:text-ink-100">Esqueci minha senha</Link>
                        </div>
                        {!remember && <p className="text-xs text-ink-500">Você sai ao fechar esta aba. Use em computadores compartilhados.</p>}
                    </div>

                    <Captcha ref={captchaRef} onChange={(token) => setCaptchaToken(token)} />

                    <button type="submit" disabled={isSubmitting || !RECAPTCHA_SITE_KEY} className={`${btnPrimary} mt-2 h-12 w-full`}>
                        {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Entrando…</> : <>Entrar <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /></>}
                    </button>
                </form>
            </AuthShell>
        </>
    );
}
