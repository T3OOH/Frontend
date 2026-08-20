import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, CheckCircle2, Phone, Building, FileText, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Input } from '@/components/Input';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { motion } from 'framer-motion';
import ReCAPTCHA from 'react-google-recaptcha';
import { z } from 'zod';

const registerSchema = z.object({
    personType: z.enum(['PF', 'PJ']),
    name: z.string().min(3, 'Mínimo de 3 caracteres'),
    document: z.string().min(11, 'Documento inválido'),
    email: z.string().email('E-mail inválido'),
    phone: z.string().min(10, 'WhatsApp inválido'),
    companyName: z.string().optional(),
    password: z.string().min(6, 'Mínimo de 6 caracteres'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const maskPhone = (value: string) => {
    let v = value.replace(/\D/g, ""); 
    if (v.length > 11) v = v.substring(0, 11); 
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    else if (v.length > 0) v = v.replace(/^(\d*)/, "($1");
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
    const { isAuthenticated } = useAuth();
    const [isSuccess, setIsSuccess] = useState(false);
    const toast = useToast();

    const [documentType, setDocumentType] = useState<'PF' | 'PJ'>('PF');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    // Redireciona se já estiver logado (e resolve o erro de useEffect não utilizado)
    useEffect(() => {
        if (isAuthenticated) navigate('/', { replace: true });
    }, [isAuthenticated, navigate]);

    const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: { personType: 'PF' }
    });

    const phoneRegister = register('phone');
    const documentRegister = register('document');

    const handleToggleType = (type: 'PF' | 'PJ') => {
        setDocumentType(type);
        setValue('personType', type);
        setValue('document', ''); 
    };

    const onSubmit = async (data: RegisterFormData) => {
        if (!captchaToken) {
            toast.error('Por favor, confirme que você não é um robô.');
            return;
        }

        if (documentType === 'PJ' && !data.companyName?.trim()) {
            toast.error('Para contas empresariais, a Razão Social é obrigatória.');
            return;
        }

        try {
            const payload = { ...data, captchaToken, role: documentType === 'PJ' ? 'COMPANY' : 'USER' };
            await authService.register(payload as any);
            setIsSuccess(true);
            toast.success("Cadastro realizado com sucesso! Aguarde a liberação.");
            setTimeout(() => { navigate('/login'); }, 3000);
        } catch (error: any) {
            const backendError = error.response?.data;
            if (backendError?.details) toast.error(`Erro: ${backendError.details[0].message}`);
            else if (backendError?.error) toast.error(`Erro: ${backendError.error}`);
            else toast.error("Falha na comunicação com o servidor.");
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

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 lg:py-0 flex flex-col lg:flex-row lg:items-center justify-between gap-16 lg:gap-20 h-full min-h-screen">
                
                {/* COLUNA ESQUERDA: LOGO GIGANTE E TÍTULO */}
                <div className="w-full lg:w-[40%] flex flex-col justify-center">
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
                        Criar Conta
                    </motion.h1>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                        <Link to="/login" className="inline-flex items-center justify-center px-8 py-5 border border-white/20 text-white hover:bg-white/5 hover:border-white/40 uppercase tracking-widest text-xs font-bold transition-all">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o Login
                        </Link>
                    </motion.div>
                </div>

                {/* COLUNA DIREITA: FORMULÁRIO "NAKED" */}
                <div className="w-full lg:w-[55%] flex flex-col justify-center pb-10 lg:pb-0">
                    
                    {isSuccess ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
                            className="p-10 bg-[#25D366]/5 border border-[#25D366]/20 text-center space-y-4 shadow-[0_0_50px_rgba(37,211,102,0.1)] backdrop-blur-xl"
                        >
                            <div className="w-20 h-20 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#25D366]/30">
                                <CheckCircle2 className="w-10 h-10 text-[#25D366] drop-shadow-[0_0_15px_rgba(37,211,102,0.5)]" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Cadastro Concluído!</h3>
                            <p className="text-sm text-white/70 leading-relaxed">
                                Seus dados foram enviados para análise. Assim que um administrador aprovar, você terá acesso total à plataforma.<br/><br/>
                                Redirecionando para a tela de login...
                            </p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-6" autoComplete="off">
                            
                            {/* TOGGLE PF / PJ */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">Tipo de Conta *</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleType('PF')}
                                        className={`py-4 px-4 border flex items-center justify-center font-bold text-[11px] uppercase tracking-widest transition-all ${
                                            documentType === 'PF' 
                                            ? 'bg-[#FF5E00]/10 border-[#FF5E00]/50 text-[#FF5E00]' 
                                            : 'bg-[#111113]/40 border-white/10 text-[#8F8F91] hover:border-white/30 hover:text-white'
                                        }`}
                                    >
                                        <User className="w-4 h-4 mr-2" /> Pessoa Física
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleType('PJ')}
                                        className={`py-4 px-4 border flex items-center justify-center font-bold text-[11px] uppercase tracking-widest transition-all ${
                                            documentType === 'PJ' 
                                            ? 'bg-[#FF5E00]/10 border-[#FF5E00]/50 text-[#FF5E00]' 
                                            : 'bg-[#111113]/40 border-white/10 text-[#8F8F91] hover:border-white/30 hover:text-white'
                                        }`}
                                    >
                                        <Building className="w-4 h-4 mr-2" /> Empresa (CNPJ)
                                    </button>
                                </div>
                            </div>

                            {/* GRID DE INPUTS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">
                                        {documentType === 'PF' ? 'Nome Completo *' : 'Nome do Responsável *'}
                                    </label>
                                    <Input
                                        placeholder="Ex: João Silva"
                                        leftIcon={<User className="w-4 h-4 text-white/40" />}
                                        error={errors.name?.message}
                                        {...register('name')}
                                        className="bg-[#111113]/50 backdrop-blur-md border-white/10 text-white placeholder:text-white/30 h-14 rounded-xl focus:border-[#FF5E00] shadow-inner"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">
                                        {documentType === 'PF' ? 'CPF *' : 'CNPJ *'}
                                    </label>
                                    <Input
                                        placeholder={documentType === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                                        leftIcon={<FileText className="w-4 h-4 text-white/40" />}
                                        error={errors.document?.message}
                                        {...documentRegister}
                                        onChange={(e) => {
                                            e.target.value = documentType === 'PF' ? maskCPF(e.target.value) : maskCNPJ(e.target.value);
                                            documentRegister.onChange(e); 
                                        }}
                                        className="bg-[#111113]/50 backdrop-blur-md border-white/10 text-white placeholder:text-white/30 h-14 rounded-xl focus:border-[#FF5E00] shadow-inner"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">E-mail Corporativo *</label>
                                    <Input
                                        type="email"
                                        placeholder="seu@empresa.com"
                                        leftIcon={<Mail className="w-4 h-4 text-white/40" />}
                                        error={errors.email?.message}
                                        {...register('email')}
                                        className="bg-[#111113]/50 backdrop-blur-md border-white/10 text-white placeholder:text-white/30 h-14 rounded-xl focus:border-[#FF5E00] shadow-inner"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">WhatsApp *</label>
                                    <Input
                                        placeholder="(00) 00000-0000"
                                        leftIcon={<Phone className="w-4 h-4 text-white/40" />}
                                        error={errors.phone?.message}
                                        {...phoneRegister}
                                        onChange={(e) => {
                                            e.target.value = maskPhone(e.target.value);
                                            phoneRegister.onChange(e); 
                                        }}
                                        className="bg-[#111113]/50 backdrop-blur-md border-white/10 text-white placeholder:text-white/30 h-14 rounded-xl focus:border-[#FF5E00] shadow-inner"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">
                                        {documentType === 'PJ' ? 'Razão Social / Nome Fantasia *' : 'Empresa (Opcional)'}
                                    </label>
                                    <Input
                                        placeholder="Nome da sua marca"
                                        leftIcon={<Building className="w-4 h-4 text-white/40" />}
                                        error={errors.companyName?.message}
                                        {...register('companyName')}
                                        className="bg-[#111113]/50 backdrop-blur-md border-white/10 text-white placeholder:text-white/30 h-14 rounded-xl focus:border-[#FF5E00] shadow-inner"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">Senha *</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        leftIcon={<Lock className="w-4 h-4 text-white/40" />}
                                        error={errors.password?.message}
                                        {...register('password')}
                                        className="bg-[#111113]/50 backdrop-blur-md border-white/10 text-white placeholder:text-white/30 h-14 rounded-xl focus:border-[#FF5E00] shadow-inner"
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            {/* RECAPTCHA E BOTÃO */}
                            <div className="flex flex-col sm:flex-row items-center gap-5 pt-4 mt-2">
                                <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0">
                                    <ReCAPTCHA
                                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""}
                                        onChange={(token) => setCaptchaToken(token)}
                                        theme="dark"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex-1 bg-white hover:bg-gray-200 text-[#0A0A0B] font-black uppercase tracking-widest text-[13px] h-16 rounded-none transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.99]"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Criar Conta <Send className="w-4 h-4" /></>}
                                </button>
                            </div>

                        </form>
                    )}
                </div>

            </div>
        </div>
    );
}