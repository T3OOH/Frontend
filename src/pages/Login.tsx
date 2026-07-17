import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { loginSchema, LoginFormData } from '@/schemas/login.schema';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext'; // ✨ Importando o Toast
import { motion } from 'framer-motion';

export function Login() {
    const navigate = useNavigate();
    const [apiError, setApiError] = useState('');
    const { signIn, isAuthenticated } = useAuth(); 
    const toast = useToast(); // ✨ Instanciando o Toast

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setApiError(''); 
        try {
            const response = await authService.login(data);
            signIn(response.token, response.user);
            toast.success('Login realizado com sucesso!'); // ✨ Notificação de sucesso
        } catch (error: any) {
            const backendError = error.response?.data;
            console.error("Erro detalhado do login:", backendError || error);
            
            if (backendError?.details) {
                toast.error(`Erro de Validação: ${backendError.details[0].message}`); // ✨ Notificação de erro
            } else if (backendError?.error) {
                toast.error(`Erro: ${backendError.error}`);
            } else {
                toast.error("Falha no login. Verifique suas credenciais.");
            }
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#0A0A0B] relative overflow-hidden">
            <div className="w-full lg:w-1/2 flex flex-col relative z-10 px-6 py-10 sm:px-16 lg:px-24 justify-center">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-neon/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="absolute top-8 left-6 sm:left-16 lg:left-24 z-20">
                    <Link to="/" className="group flex items-center gap-2 text-brand-muted hover:text-brand-neon transition-all duration-300 text-sm font-medium">
                        <div className="bg-brand-surface/50 p-1.5 rounded-full border border-brand-border/30 group-hover:border-brand-neon/50 group-hover:bg-brand-neon/10 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Voltar ao Início
                    </Link>
                </div>

                <div className="w-full max-w-md mx-auto mt-12 lg:mt-0 relative z-10">
                    <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-brand-border/40 shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#0A0A0B]/60 backdrop-blur-xl">
                        <div className="mb-10 text-center sm:text-left">
                            <div className="w-full max-w-xl flex justify-center mb-8 relative perspective-1000">
                                <motion.div 
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-brand-neon rounded-full blur-[120px] opacity-20 pointer-events-none"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <motion.img 
                                    src="/t3d 2.png" 
                                    alt="Logo T3 3D" 
                                    className="w-80 h-80 md:w-[120px] md:h-[120px] object-contain mix-blend-screen relative z-10 drop-shadow-[0_0_40px_rgba(255,94,0,0.25)] cursor-pointer"
                                    transition={{ duration: 8, repeat: Infinity, repeatDelay: 5, ease: [0.4, 0, 0.2, 1] }}
                                    style={{ transformStyle: 'preserve-3d' }}
                                />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Acesso ao Sistema</h2>
                            <p className="text-brand-muted text-sm leading-relaxed">
                                Insira suas credenciais corporativas para acessar e gerenciar o circuito de painéis.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-5">
                                <Input label="E-mail Corporativo" type="email" placeholder="admin@t3ooh.com.br" leftIcon={<Mail className="w-5 h-5 text-brand-muted" />} error={errors.email?.message} {...register('email')} />
                                <div className="space-y-1 relative">
                                    <Input label="Senha" type="password" placeholder="••••••••" leftIcon={<Lock className="w-5 h-5 text-brand-muted" />} error={errors.password?.message} {...register('password')} />
                                    <div className="flex justify-end pt-2">
                                        <Link to="#" className="text-xs font-medium text-brand-muted hover:text-brand-neon transition-all">Esqueceu a senha?</Link>
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" size="lg" className="w-full mt-4 uppercase tracking-widest text-sm font-bold" isLoading={isSubmitting} rightIcon={<LogIn className="w-5 h-5" />}>Entrar no Dashboard</Button>
                            <div className="text-center pt-6 mt-6 border-t border-brand-border/40">
                                <p className="text-sm text-brand-muted">Não tem uma conta? <Link to="/cadastro" className="font-bold text-white hover:text-brand-neon transition-colors">Cadastre-se</Link></p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="hidden lg:flex lg:w-1/2 relative z-0">
                <img src="/Cidadet3.png" alt="Cidade" className="absolute inset-0 w-full h-full object-cover" />
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
        </div>
    );
}