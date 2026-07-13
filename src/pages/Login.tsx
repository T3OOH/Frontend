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

export function Login() {
    const navigate = useNavigate();
    const [apiError, setApiError] = useState('');
    
    const { signIn, isAuthenticated } = useAuth(); 

    // ✨ Fica observando a memória. Se a sessão for verdadeira, vai pro painel!
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setApiError(''); 
        
        try {
            const response = await authService.login(data);
            
            // Salva na RAM (Contexto). O useEffect ali em cima vai perceber e te redirecionar!
            signIn(response.token, response.user);

        } catch (error: any) {
            const backendError = error.response?.data;
            
            console.error("Erro detalhado do login:", backendError || error);
            
            if (backendError?.details) {
                // Se for um erro do Zod (validação de tamanho, formato, etc)
                alert(`Erro de Validação: ${backendError.details[0].message}`);
            } else if (backendError?.error) {
                // Se for um erro tratado, como "Credenciais inválidas"
                alert(`Erro: ${backendError.error}`);
            } else {
                alert("Falha no login. Verifique suas credenciais.");
            }
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-brand-black">
            <div className="w-full lg:w-1/2 flex flex-col relative px-6 py-10 sm:px-16 lg:px-24 justify-center">
                <div className="absolute top-8 left-6 sm:left-16 lg:left-24">
                    <Link to="/" className="text-brand-muted hover:text-brand-text flex items-center gap-2 transition-colors text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar ao Início
                    </Link>
                </div>

                <div className="w-full max-w-sm mx-auto mt-12 lg:mt-0">
                    <div className="mb-10">
                        <div className="flex items-center gap-1 mb-6">
                            <span className="text-3xl font-bold tracking-tighter text-brand-text">T3</span>
                            <span className="text-3xl font-bold tracking-tighter text-brand-neon">OOH</span>
                        </div>
                        <h2 className="text-3xl font-bold text-brand-text mb-2 tracking-tight">Acesso ao Sistema</h2>
                        <p className="text-brand-muted text-sm">
                            Insira suas credenciais corporativas para acessar e gerenciar o circuito de painéis.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {apiError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
                                {apiError}
                            </div>
                        )}

                        <Input
                            label="E-mail Corporativo"
                            type="email"
                            placeholder="admin@t3ooh.com.br"
                            leftIcon={<Mail className="w-5 h-5" />}
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        <div className="space-y-1">
                            <Input
                                label="Senha"
                                type="password"
                                placeholder="••••••••"
                                leftIcon={<Lock className="w-5 h-5" />}
                                error={errors.password?.message}
                                {...register('password')}
                            />
                            <div className="flex justify-end pt-1">
                                <Link to="#" className="text-sm font-medium text-brand-neon hover:text-brand-neonHover transition-colors">
                                    Esqueceu a senha?
                                </Link>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full mt-2"
                            isLoading={isSubmitting}
                            rightIcon={<LogIn className="w-5 h-5" />}
                        >
                            Entrar no Dashboard
                        </Button>

                        {/* 👈 Bloco de link para a página de Cadastro */}
                        <div className="text-center pt-6 mt-4 border-t border-brand-border/50">
                            <p className="text-sm text-brand-muted">
                                Não tem uma conta?{' '}
                                <Link to="/cadastro" className="font-medium text-brand-neon hover:text-brand-neonHover transition-colors">
                                    Cadastre-se
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            <div className="hidden lg:flex lg:w-1/2 relative bg-brand-surface overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1502899576159-f224dc2349fa?q=80&w=2000&auto=format&fit=crop"
                    alt="Cidade à noite com telões de LED luminosos"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-black to-transparent w-32" />

                <div className="absolute bottom-16 left-16 right-16 z-10">
                    <div className="glass-panel p-8 rounded-xl border-l-4 border-l-brand-neon inline-block max-w-lg">
                        <h3 className="text-2xl font-bold text-brand-text mb-2">
                            Impacto visual ininterrupto.
                        </h3>
                        <p className="text-brand-muted">
                            Gerencie a exibição da sua marca nos pontos de maior fluxo da cidade com métricas auditáveis em tempo real.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}