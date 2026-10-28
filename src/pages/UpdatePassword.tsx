import { useState, FormEvent } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, ArrowLeft, Eye, EyeOff, Mail } from 'lucide-react';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { Seo } from '@/components/Seo';
import { AuthShell, authInput } from '@/components/AuthShell';

/**
 * Tela de redefinição de senha.
 * Sem ?token= na URL: solicita o link de recuperação por e-mail.
 * Com ?token= (link enviado por e-mail): define a nova senha.
 */
const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { updatePassword, sendPasswordResetEmail } = useAuth();
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    
    // Captura o token diretamente da URL (ex: /atualizar-senha?token=eyJhb...)
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const handleRequestLink = async (e: FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        try {
            setIsSubmitting(true);
            await sendPasswordResetEmail(email.trim());
            setEmailSent(true);
        } catch (error: any) {
            addToast(error.response?.data?.error || 'Não foi possível enviar o e-mail. Tente novamente.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!token) {
            addToast('Token de segurança ausente. Por favor, solicite um novo link de recuperação.', 'error');
            return;
        }

        if (!PASSWORD_RULE.test(password)) {
            addToast('A senha deve ter ao menos 8 caracteres, uma letra maiúscula e um número.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            addToast('As senhas digitadas não coincidem.', 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            // Chama a função do seu AuthContext repassando a senha e o token
            await updatePassword(password, token); 
            
            addToast('Sua senha foi atualizada com sucesso! Você já pode fazer login.', 'success');
            navigate('/login');
        } catch (error: any) {
            console.error('Erro ao atualizar senha:', error);
            addToast(error.response?.data?.error || 'O link expirou ou é inválido. Solicite a recuperação novamente.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
        <Seo title="Recuperar senha" description="Recupere o acesso à sua conta T3 OOH." path="/recuperar-senha" noIndex />
        <AuthShell
            eyebrow="Acesso"
            title={token ? <>Criar nova<br />senha</> : <>Recuperar<br />senha</>}
            subtitle={token
                ? 'Digite a nova senha para voltar a acessar a plataforma.'
                : 'Informe o e-mail da sua conta. Enviaremos um link válido por 15 minutos.'}
            footer={<Link to="/login" className="inline-flex items-center gap-1.5 hover:text-ink-100"><ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Voltar para o login</Link>}
        >
                {!token && (emailSent ? (
                    <p role="status" className="border-l-2 border-brand-neon bg-ink-900 p-5 text-sm leading-relaxed text-ink-300">
                        Se o e-mail estiver cadastrado, você receberá o link de recuperação em instantes. Verifique também a caixa de spam.
                    </p>
                ) : (
                    <form onSubmit={handleRequestLink} className="space-y-4">
                        <Input
                            className={authInput}
                            id="recover-email"
                            label="E-mail"
                            type="email"
                            autoComplete="email"
                            placeholder="voce@empresa.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            leftIcon={<Mail className="w-4 h-4 text-brand-muted" />}
                            required
                        />
                        <Button
                            type="submit"
                            size="lg"
                            disabled={isSubmitting}
                            className="w-full bg-brand-neon hover:bg-[#FF5E00]/90 text-[#0A0A0B] font-black uppercase tracking-widest h-12 border-none disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enviar link'}
                        </Button>
                    </form>
                ))}

                {token && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Input
                            className={authInput}
                            label="Nova Senha"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="8+ caracteres, 1 maiúscula e 1 número"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            leftIcon={<Lock className="w-4 h-4 text-brand-muted" />}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-[38px] text-brand-muted hover:text-white transition-colors"
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="relative">
                        <Input
                            className={authInput}
                            label="Confirmar Nova Senha"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Repita a nova senha"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            leftIcon={<Lock className="w-4 h-4 text-brand-muted" />}
                            required
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            size="lg"
                            disabled={isSubmitting || !token}
                            className="w-full bg-brand-neon hover:bg-[#FF5E00]/90 text-[#0A0A0B] font-black uppercase tracking-widest h-12 shadow-[0_4px_20px_rgba(255,94,0,0.25)] border-none transition-all disabled:opacity-50 disabled:shadow-none"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Redefinir Senha'}
                        </Button>
                    </div>
                </form>
                )}

        </AuthShell>
        </>
    );
}