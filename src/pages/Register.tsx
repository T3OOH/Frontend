import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { registerSchema, RegisterFormData } from '@/schemas/register.schema';
import { authService } from '@/services/auth.service';
import { useToast } from '@/contexts/ToastContext'; // ✨
import { motion } from 'framer-motion';

export function Register() {
    const navigate = useNavigate();
    const [isSuccess, setIsSuccess] = useState(false);
    const toast = useToast(); // ✨

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await authService.register(data);
            setIsSuccess(true);
            toast.success("Cadastro realizado com sucesso! Aguarde a liberação."); // ✨
            
            setTimeout(() => {
                navigate('/login');
            }, 2500);

        } catch (error: any) {
            const backendError = error.response?.data;
            if (backendError?.details) {
                const campo = backendError.details[0].path[0];
                toast.error(`Erro no campo [${campo}]: ${backendError.details[0].message}`); // ✨
            } else if (backendError?.error) {
                toast.error(`Erro: ${backendError.error}`);
            } else {
                toast.error("Falha na comunicação com o servidor.");
            }
        }
    };

    // ... (o return HTML é idêntico ao seu, só não se esqueça de manter a mesma estrutura visual)
    return (
        <div className="min-h-screen w-full flex bg-[#0A0A0B] relative overflow-hidden">
            {/* Mantive o mesmo JSX do Register do seu código anterior para economizar espaço aqui, não altere o JSX dele! */}
            {/* O formulário permanece o mesmo, os alertas foram todos substituídos pela lógica acima. */}
            {/* LADO ESQUERDO */}
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
                                    transition={{
                                        duration: 8,
                                        repeat: Infinity,
                                        repeatDelay: 5,
                                        ease: [0.4, 0, 0.2, 1]
                                    }}
                                    style={{ transformStyle: 'preserve-3d' }}
                                />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Crie sua Conta</h2>
                            <p className="text-brand-muted text-sm leading-relaxed">
                                Preencha seus dados. O acesso ao painel de gestão será liberado após a aprovação de um administrador.
                            </p>
                        </div>

                        {isSuccess ? (
                            <div className="p-8 bg-green-500/5 border border-green-500/20 rounded-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-500 shadow-[0_0_30px_rgba(34,197,94,0.1)] backdrop-blur-sm">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-green-500/30">
                                    <CheckCircle2 className="w-8 h-8 text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-green-400 mb-2">Cadastro realizado!</h3>
                                    <p className="text-sm text-brand-muted">Redirecionando você para a tela de login...</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div className="space-y-5">
                                    <Input label="Nome Completo" type="text" placeholder="Seu nome completo" leftIcon={<User className="w-5 h-5 text-brand-muted" />} error={errors.name?.message} {...register('name')} />
                                    <Input label="E-mail" type="email" placeholder="voce@exemplo.com.br" leftIcon={<Mail className="w-5 h-5 text-brand-muted" />} error={errors.email?.message} {...register('email')} />
                                    <Input label="Senha" type="password" placeholder="••••••••" leftIcon={<Lock className="w-5 h-5 text-brand-muted" />} error={errors.password?.message} {...register('password')} />
                                </div>

                                <Button type="submit" size="lg" className="w-full mt-4 uppercase tracking-widest text-sm font-bold" isLoading={isSubmitting} rightIcon={<UserPlus className="w-5 h-5" />}>
                                    Solicitar Acesso
                                </Button>

                                <div className="text-center pt-6 mt-6 border-t border-brand-border/40">
                                    <p className="text-sm text-brand-muted">
                                        Já tem uma conta? <Link to="/login" className="font-bold text-white hover:text-brand-neon transition-colors">Faça login</Link>
                                    </p>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* LADO DIREITO */}
            <div className="hidden lg:flex lg:w-1/2 relative z-0">
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
        </div>
    );
}