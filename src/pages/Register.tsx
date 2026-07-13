import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { registerSchema, RegisterFormData } from '@/schemas/register.schema';
import { authService } from '@/services/auth.service';

export function Register() {
    const navigate = useNavigate();
    const [apiError, setApiError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        setApiError(''); 
        
        try {
            await authService.register(data);
            setIsSuccess(true);
            
            // Aguarda 2 segundos para o usuário ler a mensagem de sucesso e o joga pro login
            setTimeout(() => {
                navigate('/login');
            }, 2500);

        } catch (error: any) {
            const backendError = error.response?.data;
            
            // 👇 Isso vai forçar o navegador a imprimir o erro em formato de texto legível
            console.error("Erro detalhado:", JSON.stringify(backendError, null, 2));
            
            if (backendError?.details) {
                // Pegando qual campo falhou e a mensagem
                const campo = backendError.details[0].path[0];
                const mensagem = backendError.details[0].message;
                alert(`Erro no campo [${campo}]: ${mensagem}`);
            } else if (backendError?.error) {
                alert(`Erro: ${backendError.error}`);
            } else {
                alert("Falha na comunicação com o servidor.");
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
                        <h2 className="text-3xl font-bold text-brand-text mb-2 tracking-tight">Crie sua Conta</h2>
                        <p className="text-brand-muted text-sm">
                            Preencha seus dados. O acesso ao painel de gestão será liberado após a aprovação de um administrador.
                        </p>
                    </div>

                    {isSuccess ? (
                        <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                            <div>
                                <h3 className="text-lg font-bold text-green-500 mb-1">Cadastro realizado!</h3>
                                <p className="text-sm text-brand-muted">Redirecionando você para a tela de login...</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {apiError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
                                    {apiError}
                                </div>
                            )}

                            <Input
                                label="Nome Completo"
                                type="text"
                                placeholder="Seu nome"
                                leftIcon={<User className="w-5 h-5" />}
                                error={errors.name?.message}
                                {...register('name')}
                            />

                            <Input
                                label="E-mail"
                                type="email"
                                placeholder="voce@exemplo.com.br"
                                leftIcon={<Mail className="w-5 h-5" />}
                                error={errors.email?.message}
                                {...register('email')}
                            />

                            <Input
                                label="Senha"
                                type="password"
                                placeholder="••••••••"
                                leftIcon={<Lock className="w-5 h-5" />}
                                error={errors.password?.message}
                                {...register('password')}
                            />

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full mt-2"
                                isLoading={isSubmitting}
                                rightIcon={<UserPlus className="w-5 h-5" />}
                            >
                                Criar Conta
                            </Button>

                            <div className="text-center pt-4 border-t border-brand-border/50">
                                <p className="text-sm text-brand-muted">
                                    Já tem uma conta?{' '}
                                    <Link to="/login" className="font-medium text-brand-neon hover:text-brand-neonHover transition-colors">
                                        Faça login
                                    </Link>
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <div className="hidden lg:flex lg:w-1/2 relative bg-brand-surface overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2000&auto=format&fit=crop"
                    alt="Abstract Digital Grid"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-black to-transparent w-32" />

                <div className="absolute bottom-16 left-16 right-16 z-10">
                    <div className="glass-panel p-8 rounded-xl border-l-4 border-l-brand-neon inline-block max-w-lg">
                        <h3 className="text-2xl font-bold text-brand-text mb-2">
                            Ambiente Restrito.
                        </h3>
                        <p className="text-brand-muted">
                            Após realizar o cadastro, aguarde a liberação do seu perfil de Gestor ou Administrador pela equipe responsável.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}