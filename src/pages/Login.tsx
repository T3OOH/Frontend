import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { loginSchema, LoginFormData } from '@/schemas/login.schema';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { motion } from 'framer-motion';

// 1. Importação do componente reCAPTCHA
import ReCAPTCHA from 'react-google-recaptcha';

export function Login() {
    const navigate = useNavigate();
    const { signIn, isAuthenticated } = useAuth(); 
    const toast = useToast();

    // 2. Estado para armazenar o token gerado pelo reCAPTCHA
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => { 
        // 3. Validação: Impede o envio se o Captcha não foi resolvido
        if (!captchaToken) {
            toast.error('Por favor, confirme que você não é um robô.');
            return;
        }

        try {
            // 4. Envia os dados do formulário + o token do Captcha
            const response = await authService.login({ ...data, captchaToken });
            signIn(response.token, response.user);
            toast.success('Você está logado!');
        } catch (error: any) {
            const backendError = error.response?.data;
            console.error("Erro detalhado do login:", backendError || error);
            
            if (backendError?.details) {
                toast.error(`Erro de Validação: ${backendError.details[0].message}`);
            } else if (backendError?.error) {
                toast.error(`Erro: ${backendError.error}`);
            } else {
                toast.error("Falha no login. Verifique suas credenciais.");
            }
            
            // Opcional: Se o login falhar, você pode querer resetar o captcha
            // if (window.grecaptcha) window.grecaptcha.reset();
        }
    };

    return (
        <div className="h-[100dvh] w-full flex bg-[#0A0A0B] relative overflow-hidden">
            
            {!isMobile ? (
                /* ========================================================= */
                /* DESKTOP LAYOUT                                            */
                /* ========================================================= */
                <>
                    <div className="flex w-1/2 flex-col relative z-10 px-16 lg:px-24 justify-center border-r border-white/5">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-neon/5 rounded-full blur-[120px] pointer-events-none" />

                        <div className="absolute top-8 left-16 lg:left-24 z-20">
                            <Link to="/" className="group flex items-center gap-2 text-brand-muted hover:text-brand-neon transition-all duration-300 text-sm font-medium">
                                <div className="bg-brand-surface/50 p-1.5 rounded-full border border-brand-border/30 group-hover:border-brand-neon/50 group-hover:bg-brand-neon/10 transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                                Voltar ao Início
                            </Link>
                        </div>

                        <div className="w-full max-w-md mx-auto relative z-10">
                            <div className="glass-panel p-10 rounded-3xl border border-brand-border/40 shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#0A0A0B]/60 backdrop-blur-xl">
                                
                                <div className="mb-10 text-left">
                                    <div className="w-full max-w-xl flex justify-center mb-8 relative perspective-1000">
                                        <motion.div 
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-brand-neon rounded-full blur-[120px] opacity-20 pointer-events-none"
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                        <motion.img 
                                            src="/t3d 2.png" 
                                            alt="Logo T3 3D" 
                                            className="w-[120px] h-[120px] object-contain mix-blend-screen relative z-10 drop-shadow-[0_0_40px_rgba(255,94,0,0.25)] cursor-pointer"
                                            transition={{ duration: 8, repeat: Infinity, repeatDelay: 5, ease: [0.4, 0, 0.2, 1] }}
                                            style={{ transformStyle: 'preserve-3d' }}
                                        />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Acesso ao Sistema</h2>
                                    <p className="text-brand-muted text-sm leading-relaxed">
                                        Insira suas credenciais corporativas para acessar e gerenciar o circuito de painéis.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
                                    <div className="space-y-5">
                                        <Input 
                                            label="E-mail Corporativo" 
                                            type="email" 
                                            placeholder="exemplo@t3ooh.com.br" 
                                            leftIcon={<Mail className="w-5 h-5 text-brand-muted" />} 
                                            error={errors.email?.message} 
                                            {...register('email')} 
                                            autoComplete="off"
                                        />
                                        <div className="space-y-1 relative">
                                            <Input 
                                                label="Senha" 
                                                type="password" 
                                                placeholder="••••••••" 
                                                leftIcon={<Lock className="w-5 h-5 text-brand-muted" />} 
                                                error={errors.password?.message} 
                                                {...register('password')} 
                                                autoComplete="new-password"
                                            />
                                            <div className="flex justify-end pt-2">
                                                <Link to="#" className="text-xs font-medium text-brand-muted hover:text-brand-neon transition-all">Esqueceu a senha?</Link>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5. CAIXA DO RECAPTCHA NO DESKTOP */}
                                    <div className="flex justify-center pt-2">
                                        <ReCAPTCHA
                                            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""}
                                            onChange={(token) => setCaptchaToken(token)}
                                            theme="dark"
                                        />
                                    </div>

                                    <Button type="submit" size="lg" className="w-full mt-4 uppercase tracking-widest text-sm font-bold shadow-[0_4px_15px_rgba(255,94,0,0.3)] border-none bg-brand-neon hover:bg-[#FF5E00]/90 text-[#0A0A0B]" isLoading={isSubmitting} rightIcon={<LogIn className="w-5 h-5" />}>Entrar</Button>
                                    <div className="text-center pt-6 mt-6 border-t border-brand-border/40">
                                        <p className="text-sm text-brand-muted">Não tem uma conta? <Link to="/cadastro" className="font-bold text-white hover:text-brand-neon transition-colors">Cadastre-se</Link></p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="flex w-1/2 relative z-0">
                        <img src="/cidadet3 2.png" alt="Cidade" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-[#0A0A0B]/30 mix-blend-multiply" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] from-0% via-[#0A0A0B]/80 via-15% to-transparent w-full" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/40 to-transparent" />
                        <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-[#0A0A0B] to-transparent" />
                        <div className="absolute inset-0 bg-brand-neon/10 mix-blend-overlay" />
                        <div className="absolute bottom-16 left-16 right-16 z-10">
                            <div className="glass-panel p-8 rounded-2xl border-l-4 border-l-brand-neon bg-[#0A0A0B]/40">
                                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Impacto visual ininterrupto.</h3>
                                <p className="text-brand-muted text-sm leading-relaxed">Gerencie a exibição da sua marca nos pontos de maior fluxo da cidade com métricas auditáveis em tempo real. Uma plataforma completa de OOH.</p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* ========================================================= */
                /* MOBILE LAYOUT                                             */
                /* ========================================================= */
                <div className="flex flex-col w-full h-full relative z-20 bg-[#0A0A0B]">
                    
                    <div className="sticky top-0 z-50 bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-brand-border/20 px-4 py-3 flex items-center justify-between shadow-sm pt-[env(safe-area-inset-top,12px)]">
                        <Link to="/" className="flex items-center gap-3 text-white active:opacity-70 transition-opacity">
                            <div className="w-9 h-9 rounded-full bg-[#111113] flex items-center justify-center border border-brand-border/40 shadow-sm">
                                <ArrowLeft className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-[15px] tracking-wide">Voltar</span>
                        </Link>
                        <img src="/t3d 2.png" alt="T3 Logo" className="h-6 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,94,0,0.3)]" />
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 pt-8 pb-[120px] custom-scrollbar">
                        
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-white tracking-tight mb-2 leading-tight">
                                Acesso ao Sistema
                            </h2>
                            <p className="text-brand-muted text-[13px] leading-relaxed">
                                Insira suas credenciais corporativas para acessar e gerenciar o circuito de painéis.
                            </p>
                        </div>

                        <form id="mobile-login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
                            <Input 
                                label="E-mail Corporativo" 
                                type="email" 
                                placeholder="exemplo@t3ooh.com.br" 
                                leftIcon={<Mail className="w-4 h-4 text-brand-muted" />} 
                                error={errors.email?.message} 
                                {...register('email')} 
                                className="bg-[#111113] h-12 text-sm"
                                autoComplete="off"
                            />
                            
                            <div className="space-y-1 relative">
                                <Input 
                                    label="Senha" 
                                    type="password" 
                                    placeholder="••••••••" 
                                    leftIcon={<Lock className="w-4 h-4 text-brand-muted" />} 
                                    error={errors.password?.message} 
                                    {...register('password')} 
                                    className="bg-[#111113] h-12 text-sm"
                                    autoComplete="new-password"
                                />
                                <div className="flex justify-end pt-2">
                                    <Link to="#" className="text-xs font-medium text-brand-muted hover:text-brand-neon transition-all">Esqueceu a senha?</Link>
                                </div>
                            </div>

                            {/* 5. CAIXA DO RECAPTCHA NO MOBILE */}
                            <div className="flex justify-center pt-4 pb-2">
                                <ReCAPTCHA
                                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""}
                                    onChange={(token) => setCaptchaToken(token)}
                                    theme="dark"
                                />
                            </div>

                            <div className="text-center pt-4 mt-2">
                                <p className="text-sm text-brand-muted">
                                    Não tem uma conta? <Link to="/cadastro" className="font-bold text-white hover:text-brand-neon transition-colors underline decoration-brand-border">Cadastre-se</Link>
                                </p>
                            </div>
                        </form>
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0B]/95 backdrop-blur-2xl border-t border-brand-border/20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-50 pb-safe">
                        <Button
                            type="submit"
                            form="mobile-login-form" 
                            size="lg"
                            className="w-full bg-brand-neon hover:bg-[#FF5E00]/90 text-[#0A0A0B] font-black uppercase tracking-widest text-[13px] h-14 rounded-2xl shadow-[0_10px_25px_rgba(255,94,0,0.35)] active:scale-[0.98] transition-all border-none"
                            isLoading={isSubmitting}
                            rightIcon={<LogIn className="w-4 h-4 text-[#0A0A0B]" />}
                        >
                            Entrar
                        </Button>
                    </div>
                </div>
            )}

        </div>
    );
}