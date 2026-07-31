import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ArrowLeft, CheckCircle2, Phone, Building, FileText } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { registerSchema, RegisterFormData } from '@/schemas/register.schema';
import { authService } from '@/services/auth.service';
import { useToast } from '@/contexts/ToastContext';
import { motion } from 'framer-motion';
import ReCAPTCHA from 'react-google-recaptcha';

// =========================================================
// UTILS: MÁSCARAS DE INPUT
// =========================================================

const maskPhone = (value: string) => {
    let v = value.replace(/\D/g, ""); 
    if (v.length > 11) v = v.substring(0, 11); 

    if (v.length > 10) {
        // Formato com 11 dígitos: (00) 00000-0000
        v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (v.length > 6) {
        // Formato com até 10 dígitos: (00) 0000-0000
        v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (v.length > 2) {
        // Formato com DDD: (00) 000
        v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else if (v.length > 0) {
        v = v.replace(/^(\d*)/, "($1");
    }
    return v;
};

const maskCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const maskCNPJ = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

export function Register() {
    const navigate = useNavigate();
    const [isSuccess, setIsSuccess] = useState(false);
    const toast = useToast();

    // =========================================================
    // STATES & FORM CONFIGURATION
    // =========================================================
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [documentType, setDocumentType] = useState<'CPF' | 'CNPJ'>('CPF');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const phoneRegister = register('phone' as any);
    const documentRegister = register('document' as any);

    // =========================================================
    // HANDLERS
    // =========================================================
    const onSubmit = async (data: RegisterFormData) => {
        if (!captchaToken) {
            toast.error('Por favor, confirme que você não é um robô.');
            return;
        }

        try {
            const payload = { ...data, documentType, captchaToken };
            await authService.register(payload as any);
            
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

    // =========================================================
    // COMPONENTE DE FORMULÁRIO (Reutilizável Desktop/Mobile)
    // =========================================================
    const renderForm = () => (
        <form 
            id={isMobile ? "mobile-register-form" : "desktop-register-form"} 
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-3" 
            autoComplete="off" 
        >
            {/* Chave (Toggle) de Tipo de Conta */}
            <div className="flex bg-[#0A0A0B] p-1 rounded-xl border border-white/5 mb-1">
                <button
                    type="button"
                    className={`flex-1 text-xs font-bold py-2.5 rounded-lg transition-all ${documentType === 'CPF' ? 'bg-brand-neon text-black shadow-sm' : 'text-brand-muted hover:text-white'}`}
                    onClick={() => setDocumentType('CPF')}
                >
                    Pessoa Física
                </button>
                <button
                    type="button"
                    className={`flex-1 text-xs font-bold py-2.5 rounded-lg transition-all ${documentType === 'CNPJ' ? 'bg-brand-neon text-black shadow-sm' : 'text-brand-muted hover:text-white'}`}
                    onClick={() => setDocumentType('CNPJ')}
                >
                    Empresa (CNPJ)
                </button>
            </div>

            <Input 
                label="Nome Completo" 
                type="text" 
                placeholder="Seu nome completo" 
                leftIcon={<User className="w-4 h-4 text-brand-muted" />} 
                error={errors.name?.message} 
                {...register('name')} 
                className="bg-[#111113] border-white/5 h-11 text-sm focus:border-brand-neon/50"
                autoComplete="off"
            />
            
            <Input 
                label={documentType === 'CPF' ? 'CPF' : 'CNPJ'} 
                type="text" 
                placeholder={documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'} 
                leftIcon={<FileText className="w-4 h-4 text-brand-muted" />} 
                error={(errors as any).document?.message} 
                {...documentRegister} 
                onChange={(e) => {
                    e.target.value = documentType === 'CPF' ? maskCPF(e.target.value) : maskCNPJ(e.target.value);
                    documentRegister.onChange(e); 
                }}
                className="bg-[#111113] border-white/5 h-11 text-sm focus:border-brand-neon/50"
                autoComplete="off"
            />

            <Input 
                label="E-mail" 
                type="email" 
                placeholder="voce@empresa.com.br" 
                leftIcon={<Mail className="w-4 h-4 text-brand-muted" />} 
                error={errors.email?.message} 
                {...register('email')} 
                className="bg-[#111113] border-white/5 h-11 text-sm focus:border-brand-neon/50"
                autoComplete="off"
            />
            
            <Input 
                label="WhatsApp" 
                type="text" 
                placeholder="(00) 00000-0000" 
                leftIcon={<Phone className="w-4 h-4 text-brand-muted" />} 
                error={(errors as any).phone?.message} 
                {...phoneRegister} 
                onChange={(e) => {
                    e.target.value = maskPhone(e.target.value);
                    phoneRegister.onChange(e); 
                }}
                className="bg-[#111113] border-white/5 h-11 text-sm focus:border-brand-neon/50"
                autoComplete="off"
            />

            <Input 
                label={documentType === 'CNPJ' ? 'Razão Social / Nome Fantasia' : 'Empresa (Opcional)'} 
                type="text" 
                placeholder="Nome da sua marca" 
                leftIcon={<Building className="w-4 h-4 text-brand-muted" />} 
                error={(errors as any).company?.message} 
                {...register('company' as any)} 
                className="bg-[#111113] border-white/5 h-11 text-sm focus:border-brand-neon/50"
                autoComplete="off"
            />
            
            <Input 
                label="Senha" 
                type="password" 
                placeholder="••••••••" 
                leftIcon={<Lock className="w-4 h-4 text-brand-muted" />} 
                error={errors.password?.message} 
                {...register('password')} 
                className="bg-[#111113] border-white/5 h-11 text-sm focus:border-brand-neon/50"
                autoComplete="new-password"
            />

            {/* CAIXA DO RECAPTCHA */}
            <div className="flex justify-center pt-2 pb-1">
                <div className="rounded-xl overflow-hidden shadow-lg border border-white/5">
                    <ReCAPTCHA
                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""}
                        onChange={(token) => setCaptchaToken(token)}
                        theme="dark"
                    />
                </div>
            </div>
            
            {!isMobile && (
                <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full mt-2 uppercase tracking-widest text-[13px] h-14 rounded-2xl font-black shadow-[0_4px_15px_rgba(255,94,0,0.3)] border-none bg-brand-neon hover:bg-[#FF5E00]/90 text-[#0A0A0B] transition-transform active:scale-[0.98]" 
                    isLoading={isSubmitting} 
                    rightIcon={<UserPlus className="w-4 h-4 text-[#0A0A0B]" />}
                >
                    Criar Conta
                </Button>
            )}

            <div className="text-center pt-3 mt-1 border-t border-white/5">
                <p className="text-xs text-brand-muted">
                    Já tem uma conta? <Link to="/login" className="font-bold text-white hover:text-brand-neon transition-colors underline decoration-brand-border/50">Faça login</Link>
                </p>
            </div>
        </form>
    );

    return (
        <div className="h-[100dvh] w-full flex bg-[#0A0A0B] relative overflow-hidden">
            
            {!isMobile ? (
                /* ========================================================= */
                /* DESKTOP LAYOUT (Premium Dark Pattern)                     */
                /* ========================================================= */
                <>
                    <div className="flex w-[45%] xl:w-[40%] flex-col relative z-10 justify-center border-r border-white/5 bg-[#0A0A0B]">
                        
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-neon/5 rounded-full blur-[100px] pointer-events-none" />

                        <div className="absolute top-8 left-8 lg:left-12 z-20">
                            <Link to="/" className="flex items-center gap-3 text-white group transition-all">
                                <div className="w-10 h-10 rounded-full bg-[#111113] flex items-center justify-center border border-white/5 shadow-lg group-hover:border-brand-neon/40 group-hover:bg-brand-neon/10 transition-all duration-300">
                                    <ArrowLeft className="w-4 h-4 text-brand-muted group-hover:text-brand-neon transition-colors" />
                                </div>
                            </Link>
                        </div>

                        <div className="w-full max-w-[440px] mx-auto relative z-10 px-6">
                            <div className="bg-[#111113]/90 backdrop-blur-2xl p-7 rounded-[32px] border border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.7)] flex flex-col max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                
                                <div className="mb-4 text-center flex flex-col items-center">
                                    <motion.img 
                                        src="/logot3branca.png" 
                                        alt="Logo T3" 
                                        className="h-10 w-auto mb-3 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5 }}
                                    />
                                    <h2 className="text-xl font-black text-white mb-1 tracking-tight">Crie sua Conta</h2>
                                    <p className="text-brand-muted text-[11px] leading-relaxed px-4">
                                        Preencha seus dados corporativos. O acesso será liberado após a aprovação.
                                    </p>
                                </div>

                                {isSuccess ? (
                                    <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-500 shadow-[0_0_30px_rgba(34,197,94,0.1)] backdrop-blur-sm my-4">
                                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-green-500/30">
                                            <CheckCircle2 className="w-8 h-8 text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-green-400 mb-1">Cadastro realizado!</h3>
                                            <p className="text-xs text-brand-muted">Redirecionando para o login...</p>
                                        </div>
                                    </div>
                                ) : (
                                    renderForm()
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-1 relative z-0 overflow-hidden">
                        <img src="/cidadet3 2.png" alt="Cidade" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-[#0A0A0B]/40 mix-blend-multiply" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-[#0A0A0B]/80 to-transparent w-full" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/20 to-transparent" />
                        <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-[#0A0A0B] to-transparent" />
                        
                        <div className="absolute bottom-16 left-16 max-w-lg z-10">
                            <div className="bg-[#111113]/85 backdrop-blur-2xl p-8 rounded-3xl border border-white/5 shadow-2xl border-l-4 border-l-brand-neon">
                                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Cresça com a T3.</h3>
                                <p className="text-brand-muted text-[13px] leading-relaxed">Cadastre-se na nossa plataforma e assuma o controle estratégico da presença da sua marca nas principais vias de Goiânia e região metropolitana.</p>
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
                        <Link to="/login" className="flex items-center gap-3 text-white active:opacity-70 transition-opacity">
                            <div className="w-9 h-9 rounded-full bg-[#111113] flex items-center justify-center border border-brand-border/40 shadow-sm">
                                <ArrowLeft className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-[15px] tracking-wide">Voltar</span>
                        </Link>
                        <img src="/logot3branca.png" alt="T3 Logo" className="h-5 w-auto object-contain" />
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 pt-6 pb-[120px] custom-scrollbar">
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
                                <div className="mb-6">
                                    <h2 className="text-2xl font-black text-white tracking-tight mb-2 leading-tight">
                                        Solicitar Acesso
                                    </h2>
                                    <p className="text-brand-muted text-[13px] leading-relaxed">
                                        Preencha seus dados. O acesso será liberado após a aprovação de um administrador.
                                    </p>
                                </div>
                                {renderForm()}
                            </>
                        )}
                    </div>

                    {!isSuccess && (
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0B]/95 backdrop-blur-2xl border-t border-brand-border/20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-50 pb-safe">
                            <Button
                                type="submit"
                                form="mobile-register-form" 
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
            )}
        </div>
    );
}