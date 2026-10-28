import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building, CheckCircle2, Loader2, User } from 'lucide-react';
import { Input } from '@/components/Input';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { motion } from 'framer-motion';
import ReCAPTCHA from 'react-google-recaptcha';
import { Captcha, RECAPTCHA_SITE_KEY } from '@/components/Captcha';
import { z } from 'zod';
import { Seo } from '@/components/Seo';
import { AuthShell, authInput } from '@/components/AuthShell';
import { btnPrimary } from '@/lib/ui';

// ==========================================
// SCHEMA DE VALIDAÇÃO (Com regras de segurança)
// ==========================================
const registerSchema = z.object({
    personType: z.enum(['PF', 'PJ']),
    name: z.string().min(3, 'Mínimo de 3 caracteres').trim(),
    document: z.string().min(14, 'Documento inválido'), // Valida o tamanho mínimo com a máscara
    email: z.string().email('E-mail inválido').trim().toLowerCase(),
    phone: z.string().min(14, 'WhatsApp inválido'),
    companyName: z.string().optional(),
    password: z.string()
        .min(8, 'Mínimo de 8 caracteres')
        .regex(/[A-Z]/, 'Pelo menos uma letra maiúscula')
        .regex(/[a-z]/, 'Pelo menos uma letra minúscula')
        .regex(/[0-9]/, 'Pelo menos um número'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

// ==========================================
// MÁSCARAS DE INPUT
// ==========================================
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
    const captchaRef = useRef<ReCAPTCHA>(null);

    // Redireciona se já estiver logado
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

    // ==========================================
    // SUBMIT COM SANITIZAÇÃO
    // ==========================================
    const onSubmit = async (data: RegisterFormData) => {
        if (!captchaToken) {
            toast.error('Por favor, confirme que você não é um robô.');
            return;
        }

        // Validação estrita da Razão Social para PJ
        if (documentType === 'PJ' && (!data.companyName || !data.companyName.trim())) {
            toast.error('Para contas empresariais, a Razão Social é obrigatória.');
            return;
        }

        // SANITIZAÇÃO: Remove máscaras antes de enviar ao banco
        const cleanDocument = data.document.replace(/\D/g, '');
        const cleanPhone = data.phone.replace(/\D/g, '');

        // Validação de segurança de tamanho real
        if (documentType === 'PF' && cleanDocument.length !== 11) {
            toast.error('O CPF deve ter exatamente 11 números válidos.');
            return;
        }
        if (documentType === 'PJ' && cleanDocument.length !== 14) {
            toast.error('O CNPJ deve ter exatamente 14 números válidos.');
            return;
        }

        try {
            // Payload 100% explícito baseado na model User do Prisma
            const payload = {
                name: data.name,
                email: data.email,
                password: data.password,
                phone: cleanPhone,
                document: cleanDocument,
                personType: data.personType,
                companyName: documentType === 'PJ' ? data.companyName?.trim() : undefined,
                captchaToken
            };

            await authService.register(payload as any);
            
            setIsSuccess(true);
            toast.success("Conta criada! Você já pode entrar.");
            setTimeout(() => { navigate('/login'); }, 3000);
        } catch (error: any) {
            // O token do reCAPTCHA é de uso único: exige nova verificação
            captchaRef.current?.reset();
            setCaptchaToken(null);
            const backendError = error.response?.data;
            if (backendError?.details) toast.error(`Erro: ${backendError.details[0].message}`);
            else if (backendError?.error) toast.error(`Erro: ${backendError.error}`);
            else toast.error("Falha na comunicação com o servidor.");
        }
    };

    return (
        <>
            <Seo title="Criar conta" description="Crie sua conta na plataforma T3 OOH para solicitar orçamentos e acompanhar pedidos." path="/cadastro" noIndex />
            <AuthShell
                wide
                eyebrow="Cadastro"
                title={<>Criar sua<br />conta</>}
                subtitle="Com a conta você salva orçamentos, acompanha pedidos e fala direto com o comercial."
                footer={<>Já tem conta? <Link to="/login" className="text-ink-100 underline underline-offset-4 hover:text-brand-neon">Entrar</Link></>}
            >
                {isSuccess ? (
                    <motion.div
                        role="status"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-l-2 border-brand-neon bg-ink-900 p-6"
                    >
                        <p className="flex items-center gap-2 font-medium text-ink-100">
                            <CheckCircle2 className="h-5 w-5 text-brand-neon" strokeWidth={1.75} aria-hidden="true" /> Conta criada
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-ink-400">Você já pode entrar com seu e-mail e senha. Redirecionando para o login…</p>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
                        <fieldset>
                            <legend className="mb-2 text-sm font-medium text-ink-300">Tipo de conta</legend>
                            <div className="grid grid-cols-2 border border-white/10" role="radiogroup">
                                {(['PF', 'PJ'] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        role="radio"
                                        aria-checked={documentType === type}
                                        onClick={() => handleToggleType(type)}
                                        className={`flex h-12 items-center justify-center gap-2 text-sm transition-colors ${
                                            documentType === type ? 'bg-ink-100 font-medium text-ink-950' : 'text-ink-400 hover:text-ink-100'
                                        }`}
                                    >
                                        {type === 'PF'
                                            ? <><User className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Pessoa física</>
                                            : <><Building className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Empresa</>}
                                    </button>
                                ))}
                            </div>
                        </fieldset>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Input
                                id="cad-nome"
                                label={documentType === 'PF' ? 'Nome completo' : 'Nome do responsável'}
                                autoComplete="name"
                                error={errors.name?.message}
                                className={authInput}
                                {...register('name')}
                            />
                            <Input
                                id="cad-documento"
                                label={documentType === 'PF' ? 'CPF' : 'CNPJ'}
                                inputMode="numeric"
                                placeholder={documentType === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                                error={errors.document?.message}
                                className={authInput}
                                {...documentRegister}
                                onChange={(e) => {
                                    e.target.value = documentType === 'PF' ? maskCPF(e.target.value) : maskCNPJ(e.target.value);
                                    documentRegister.onChange(e);
                                }}
                            />
                            <Input
                                id="cad-email"
                                label="E-mail"
                                type="email"
                                placeholder="voce@empresa.com.br"
                                autoComplete="email"
                                error={errors.email?.message}
                                className={authInput}
                                {...register('email')}
                            />
                            <Input
                                id="cad-whatsapp"
                                label="WhatsApp"
                                type="tel"
                                inputMode="tel"
                                placeholder="(62) 99999-0000"
                                autoComplete="tel"
                                error={errors.phone?.message}
                                className={authInput}
                                {...phoneRegister}
                                onChange={(e) => {
                                    e.target.value = maskPhone(e.target.value);
                                    phoneRegister.onChange(e);
                                }}
                            />
                            <Input
                                id="cad-empresa"
                                label={documentType === 'PJ' ? 'Razão social ou nome fantasia' : 'Empresa (opcional)'}
                                autoComplete="organization"
                                error={errors.companyName?.message}
                                className={authInput}
                                {...register('companyName')}
                            />
                            <div className="flex flex-col gap-1.5">
                                <Input
                                    id="cad-senha"
                                    label="Senha"
                                    type="password"
                                    autoComplete="new-password"
                                    error={errors.password?.message}
                                    className={authInput}
                                    {...register('password')}
                                />
                                {!errors.password && <p className="text-xs text-ink-500">8 ou mais caracteres, com uma letra maiúscula e um número.</p>}
                            </div>
                        </div>

                        <Captcha ref={captchaRef} onChange={(token) => setCaptchaToken(token)} />

                        <button type="submit" disabled={isSubmitting || !RECAPTCHA_SITE_KEY} className={`${btnPrimary} mt-2 h-12 w-full`}>
                            {isSubmitting
                                ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Criando conta…</>
                                : <>Criar conta <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /></>}
                        </button>
                        <p className="text-xs leading-relaxed text-ink-500">
                            Ao criar a conta, você concorda com os <Link to="/termos" className="underline underline-offset-2 hover:text-ink-100">Termos de Uso</Link> e
                            a <Link to="/privacidade" className="underline underline-offset-2 hover:text-ink-100">Política de Privacidade</Link>.
                        </p>
                    </form>
                )}
            </AuthShell>
        </>
    );
}
