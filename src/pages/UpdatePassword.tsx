import { useState, FormEvent } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Tela de redefinição de senha.
 * Acessada unicamente através do link seguro enviado para o e-mail do usuário (contendo o ?token=).
 */
export function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { updatePassword } = useAuth();
    
    // Captura o token diretamente da URL (ex: /atualizar-senha?token=eyJhb...)
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!token) {
            addToast('Token de segurança ausente. Por favor, solicite um novo link de recuperação.', 'error');
            return;
        }

        if (password.length < 6) {
            addToast('A nova senha deve ter pelo menos 6 caracteres.', 'error');
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
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0B] relative p-4 overflow-hidden">
            
            {/* Background elements para manter o padrão visual da T3 */}
            <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
                <div className="w-[600px] h-[600px] bg-brand-neon/5 rounded-full blur-[120px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="w-full max-w-[420px] bg-[#111113]/80 backdrop-blur-2xl border border-white/5 rounded-[24px] p-8 shadow-2xl relative z-10 animate-fade-in">
                
                <div className="flex justify-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-brand-surface border border-white/5 flex items-center justify-center shadow-inner">
                        <ShieldCheck className="w-7 h-7 text-brand-neon" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                        Criar Nova Senha
                    </h1>
                    <p className="text-sm text-brand-muted leading-relaxed">
                        Digite sua nova senha abaixo para recuperar o acesso à plataforma T3 OOH.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Input
                            label="Nova Senha"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mínimo de 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            leftIcon={<Lock className="w-4 h-4 text-brand-muted" />}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-[38px] text-brand-muted hover:text-white transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="relative">
                        <Input
                            label="Confirmar Nova Senha"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Repita a nova senha"
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

                <div className="mt-8 text-center border-t border-white/5 pt-6">
                    <Link 
                        to="/login" 
                        className="inline-flex items-center gap-2 text-sm font-medium text-brand-muted hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para o Login
                    </Link>
                </div>
            </div>
        </div>
    );
}