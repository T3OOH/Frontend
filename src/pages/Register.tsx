import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ArrowLeft, CheckCircle2, Phone, Building } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { registerSchema, RegisterFormData } from '@/schemas/register.schema';
import { authService } from '@/services/auth.service';
import { useToast } from '@/contexts/ToastContext';
import { motion } from 'framer-motion';

export function Register() {
    const navigate = useNavigate();
    const [isSuccess, setIsSuccess] = useState(false);
    const toast = useToast();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await authService.register(data);
            setIsSuccess(true);
            toast.success("Cadastro realizado com sucesso! Aguarde a liberação.");
            
            setTimeout(() => {
                navigate('/login');
            }, 2500);

        } catch (error: any) {
            const backendError = error.response?.data;
            if (backendError?.details) {
                const campo = backendError.details[0].path[0];
                toast.error(`Erro no campo [${campo}]: ${backendError.details[0].message}`);
            } else if (backendError?.error) {
                toast.error(`Erro: ${backendError.error}`);
            } else {
                toast.error("Falha na comunicação com o servidor.");
            }
        }
    };

    return (
        // Trava a tela inteira (dvh para mobile) e tira qualquer scroll global
        <div className="h-[100dvh] w-full flex bg-[#0A0A0B] relative overflow-hidden">
            
            {/* ========================================================= */}
            {/* DESKTOP LAYOUT (100% PRESERVADO)                            */}
            {/* ========================================================= */}
            
            {/* LADO ESQUERDO (FORMULÁRIO DESKTOP) */}
            <div className="hidden lg:flex w-1/2 flex-col relative z-10 px-16 lg:px-24 justify-center border-r border-white/5">
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
                    <div className="glass-panel p-10 rounded-3xl border border-brand-border/40 shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#0A0A0B]/60 backdrop-blur-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
                        
                        <div className="mb-8 text-left">
                            <div className="w-full max-w-xl flex justify-center mb-6 relative perspective-1000">
                                <motion.div 
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-neon rounded-full blur-[100px] opacity-20 pointer-events-none"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                />
                                
                                <motion.img 
                                    src="/t3d 2.png" 
                                    alt="Logo T3 3D" 
                                    className="w-[100px] h-[100px] object-contain mix-blend-screen relative z-10 drop-shadow-[0_0_30px_rgba(255,94,0,0.25)] cursor-pointer"
                                    transition={{ duration: 8, repeat: Infinity, repeatDelay: 5, ease: [0.4, 0, 0.2, 1] }}
                                    style={{ transformStyle: 'preserve-3d' }}
                                />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Crie sua Conta</h2>
                            <p className="text-brand-muted text-sm leading-relaxed">
                                Preencha seus dados corporativos. O acesso será liberado após a aprovação da nossa equipe.
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
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <Input label="Nome Completo" type="text" placeholder="Seu nome completo" leftIcon={<User className="w-4 h-4 text-brand-muted" />} error={errors.name?.message} {...register('name')} />
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="E-mail" type="email" placeholder="voce@empresa.com" leftIcon={<Mail className="w-4 h-4 text-brand-muted" />} error={errors.email?.message} {...register('email')} />
                                    <Input label="Telefone" type="text" placeholder="(62) 99999-9999" leftIcon={<Phone className="w-4 h-4 text-brand-muted" />} error={(errors as any).phone?.message} {...register('phone' as any)} />
                                </div>

                                <Input label="Empresa (Opcional)" type="text" placeholder="Nome da sua agência ou marca" leftIcon={<Building className="w-4 h-4 text-brand-muted" />} error={(errors as any).company?.message} {...register('company' as any)} />
                                
                                <Input label="Senha" type="password" placeholder="••••••••" leftIcon={<Lock className="w-4 h-4 text-brand-muted" />} error={errors.password?.message} {...register('password')} />

                                <Button type="submit" size="lg" className="w-full mt-2 uppercase tracking-widest text-sm font-bold shadow-[0_4px_15px_rgba(255,94,0,0.3)] border-none bg-brand-neon hover:bg-[#FF5E00]/90 text-[#0A0A0B]" isLoading={isSubmitting} rightIcon={<UserPlus className="w-4 h-4" />}>
                                    Solicitar Acesso
                                </Button>

                                <div className="text-center pt-4 mt-4 border-t border-brand-border/40">
                                    <p className="text-sm text-brand-muted">
                                        Já tem uma conta? <Link to="/login" className="font-bold text-white hover:text-brand-neon transition-colors">Faça login</Link>
                                    </p>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* LADO DIREITO (IMAGEM DESKTOP) */}
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

            {/* ========================================================= */}
            {/* MOBILE LAYOUT (APP PATTERN NATIVO)                          */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full h-full relative z-20 bg-[#0A0A0B]">
                
                {/* 1. App Bar Fixa no Topo */}
                <div className="sticky top-0 z-50 bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-brand-border/20 px-4 py-3 flex items-center justify-between shadow-sm pt-[env(safe-area-inset-top,12px)]">
                    <Link to="/login" className="flex items-center gap-3 text-white active:opacity-70 transition-opacity">
                        <div className="w-9 h-9 rounded-full bg-[#111113] flex items-center justify-center border border-brand-border/40 shadow-sm">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-[15px] tracking-wide">Voltar</span>
                    </Link>
                    <img src="/t3d 2.png" alt="T3 Logo" className="h-6 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,94,0,0.3)]" />
                </div>

                {/* 2. Área de Rolagem do Formulário */}
                <div className="flex-1 overflow-y-auto px-5 pt-8 pb-[120px] custom-scrollbar">
                    
                    {isSuccess ? (
                        <div className="h-full flex flex-col items-center justify-center pb-20">
                            <div className="p-8 bg-green-500/5 border border-green-500/20 rounded-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-500 shadow-[0_0_30px_rgba(34,197,94,0.1)] w-full">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-green-500/30">
                                    <CheckCircle2 className="w-8 h-8 text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-green-400 mb-2">Cadastro realizado!</h3>
                                    <p className="text-sm text-brand-muted">Redirecionando você para o login...</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-white tracking-tight mb-2 leading-tight">
                                    Crie sua Conta
                                </h2>
                                <p className="text-brand-muted text-[13px] leading-relaxed">
                                    Preencha seus dados corporativos. O acesso será liberado após a aprovação de um administrador.
                                </p>
                            </div>

                            <form id="mobile-register-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <Input 
                                    label="Nome Completo" 
                                    type="text" 
                                    placeholder="Seu nome completo" 
                                    leftIcon={<User className="w-4 h-4 text-brand-muted" />} 
                                    error={errors.name?.message} 
                                    {...register('name')} 
                                    className="bg-[#111113] h-12 text-sm"
                                />
                                <Input 
                                    label="E-mail" 
                                    type="email" 
                                    placeholder="voce@empresa.com.br" 
                                    leftIcon={<Mail className="w-4 h-4 text-brand-muted" />} 
                                    error={errors.email?.message} 
                                    {...register('email')} 
                                    className="bg-[#111113] h-12 text-sm"
                                />
                                <Input 
                                    label="Telefone / WhatsApp" 
                                    type="text" 
                                    placeholder="(62) 99999-9999" 
                                    leftIcon={<Phone className="w-4 h-4 text-brand-muted" />} 
                                    error={(errors as any).phone?.message} 
                                    {...register('phone' as any)} 
                                    className="bg-[#111113] h-12 text-sm"
                                />
                                <Input 
                                    label="Empresa (Opcional)" 
                                    type="text" 
                                    placeholder="Nome da sua marca" 
                                    leftIcon={<Building className="w-4 h-4 text-brand-muted" />} 
                                    error={(errors as any).company?.message} 
                                    {...register('company' as any)} 
                                    className="bg-[#111113] h-12 text-sm"
                                />
                                <Input 
                                    label="Senha" 
                                    type="password" 
                                    placeholder="••••••••" 
                                    leftIcon={<Lock className="w-4 h-4 text-brand-muted" />} 
                                    error={errors.password?.message} 
                                    {...register('password')} 
                                    className="bg-[#111113] h-12 text-sm"
                                />
                                
                                <div className="text-center pt-4 mt-2">
                                    <p className="text-sm text-brand-muted">
                                        Já tem uma conta? <Link to="/login" className="font-bold text-white hover:text-brand-neon transition-colors underline decoration-brand-border">Faça login</Link>
                                    </p>
                                </div>
                            </form>
                        </>
                    )}
                </div>

                {/* 3. Bottom Action Bar Fixa (Botão de Registro) */}
                {!isSuccess && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0B]/95 backdrop-blur-2xl border-t border-brand-border/20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-50 pb-safe">
                        <Button
                            type="submit"
                            form="mobile-register-form" // Liga o botão da barra inferior ao formulário
                            size="lg"
                            className="w-full bg-brand-neon hover:bg-[#FF5E00]/90 text-[#0A0A0B] font-black uppercase tracking-widest text-[13px] h-14 rounded-2xl shadow-[0_10px_25px_rgba(255,94,0,0.35)] active:scale-[0.98] transition-all border-none"
                            isLoading={isSubmitting}
                            rightIcon={<UserPlus className="w-4 h-4 text-[#0A0A0B]" />}
                        >
                            Criar Conta
                        </Button>
                    </div>
                )}
            </div>

        </div>
    );
}