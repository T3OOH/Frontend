import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Input } from '@/components/Input';
import { loginSchema, LoginFormData } from '@/schemas/login.schema';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { motion } from 'framer-motion';
import ReCAPTCHA from 'react-google-recaptcha';

export function Login() {
    const navigate = useNavigate();
    const { signIn, isAuthenticated } = useAuth(); 
    const toast = useToast();

    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

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
            const response = await authService.login({ ...data, captchaToken } as any);
            signIn(response.token, response.user);
            toast.success('Login realizado com sucesso!');
        } catch (error: any) {
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
        <div className="relative min-h-[100dvh] w-full flex items-center bg-[#0A0A0B] overflow-x-hidden">
            
            {/* BACKGROUND IMERSIVO */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <img 
                    src="/cidadet3 2.png" 
                    alt="Background Cidade" 
                    className="w-full h-full object-cover opacity-30 mix-blend-luminosity" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-[#0A0A0B]/90 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/40 to-transparent" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 lg:py-0 flex flex-col lg:flex-row lg:items-center justify-between gap-16 lg:gap-24 h-full min-h-screen">
                
                {/* COLUNA ESQUERDA: LOGO GIGANTE E TÍTULO */}
                <div className="w-full lg:w-[45%] flex flex-col justify-center">
                    <motion.img 
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: "easeOut" }}
                        src="/t3d 2.png" 
                        alt="T3 OOH Logo Gigante" 
                        className="w-[60%] md:w-[70%] max-w-[400px] h-auto object-contain drop-shadow-[0_0_40px_rgba(255,94,0,0.3)] origin-left mb-8"
                    />
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1] mb-10"
                    >
                        Fazer Login
                    </motion.h1>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                        <Link to="/" className="inline-flex items-center justify-center px-8 py-5 border border-white/20 text-white hover:bg-white/5 hover:border-white/40 uppercase tracking-widest text-xs font-bold transition-all">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Início
                        </Link>
                    </motion.div>
                </div>

                {/* COLUNA DIREITA: FORMULÁRIO "NAKED" */}
                <div className="w-full lg:w-[50%] flex flex-col justify-center">
                    <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-6" autoComplete="off">
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">E-mail Corporativo *</label>
                            <Input 
                                type="email" 
                                placeholder="seu@empresa.com.br" 
                                leftIcon={<Mail className="w-4 h-4 text-white/40" />} 
                                error={errors.email?.message} 
                                {...register('email')} 
                                className="bg-[#111113]/50 backdrop-blur-md border-white/10 text-white placeholder:text-white/30 h-14 rounded-xl focus:border-[#FF5E00] shadow-inner"
                                autoComplete="email"
                            />
                        </div>
                        
                        <div className="flex flex-col gap-2 relative">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">Senha *</label>
                            <Input 
                                type="password" 
                                placeholder="••••••••" 
                                leftIcon={<Lock className="w-4 h-4 text-white/40" />} 
                                error={errors.password?.message} 
                                {...register('password')} 
                                className="bg-[#111113]/50 backdrop-blur-md border-white/10 text-white placeholder:text-white/30 h-14 rounded-xl focus:border-[#FF5E00] shadow-inner"
                                autoComplete="current-password"
                            />
                            <div className="flex justify-end pt-1">
                                <Link to="#" className="text-[11px] font-bold text-[#8F8F91] hover:text-white transition-all uppercase tracking-widest">Esqueceu a senha?</Link>
                            </div>
                        </div>

                        <div className="rounded-xl overflow-hidden mt-2 w-fit">
                            <ReCAPTCHA sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""} onChange={(token) => setCaptchaToken(token)} theme="dark" />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full bg-white hover:bg-gray-200 text-[#0A0A0B] font-black uppercase tracking-widest text-[13px] h-16 rounded-none transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.99]"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Entrar no Sistema <Send className="w-4 h-4" /></>}
                        </button>

                        <div className="text-center pt-2">
                            <p className="text-[12px] text-[#8F8F91] uppercase tracking-widest font-bold">
                                Não tem uma conta? <Link to="/cadastro" className="text-white hover:text-[#FF5E00] transition-colors underline decoration-white/20">Cadastre-se</Link>
                            </p>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}