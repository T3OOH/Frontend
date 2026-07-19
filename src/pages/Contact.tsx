import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, User, Mail, Phone, Building, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import { contactSchema, ContactFormData } from '@/schemas/contact.schema';
import { Link } from 'react-router-dom';

export function Contact() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
    });

    const onSubmit = async (data: ContactFormData) => {
        // Simulando envio ao backend
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log("Dados prontos para a API:", data);
        reset();
    };

    return (
        // Trava a tela inteira (h-screen) e tira qualquer scroll global (overflow-hidden)
        <div className="h-screen w-full flex bg-[#0A0A0B] overflow-hidden">
            
            {/* =========================================
                COLUNA ESQUERDA (FORMULÁRIO)
            ========================================= */}
            <div className="w-full lg:w-[45%] h-full flex flex-col relative z-20 bg-[#0A0A0B] border-r border-white/5">
                
                {/* HEADER FIXO - Protege o botão voltar de sobreposições */}
                <div className="p-6 md:p-8 shrink-0">
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-3 text-brand-muted hover:text-white transition-colors text-sm font-medium group"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#111113] flex items-center justify-center border border-white/10 group-hover:border-[#FF5E00]/50 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Voltar ao Início
                    </Link>
                </div>

                {/* ÁREA DO CARD - Centraliza o card no espaço restante */}
                <div className="flex-1 flex items-center justify-center px-6 pb-8 overflow-hidden">
                    
                    {/* Card Principal - Limita a altura máxima para caber na tela */}
                    <div className="w-full max-w-[440px] bg-[#111113] border border-white/5 rounded-[24px] p-6 md:p-8 shadow-2xl flex flex-col max-h-full">
                        
                        {/* Logo */}
                        <div className="flex justify-center mb-4 shrink-0">
                            <img 
                                src="/t3d 2.png" 
                                alt="T3 Logo" 
                                className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_20px_rgba(255,94,0,0.2)]" 
                            />
                        </div>

                        {/* Textos */}
                        <div className="mb-5 text-left shrink-0">
                            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1">
                                Fale com um Especialista
                            </h2>
                            <p className="text-[#8F8F91] text-xs md:text-sm leading-relaxed">
                                Insira seus dados corporativos abaixo para que nossa equipe entre em contato.
                            </p>
                        </div>

                        {/* Corpo do Form - Se a tela for minúscula, APENAS essa área ganha scroll interno */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pb-2">
                                <Input
                                    label="Nome Completo"
                                    placeholder="Ex: João Silva"
                                    leftIcon={<User className="w-4 h-4 text-[#8F8F91]" />}
                                    error={errors.name?.message}
                                    {...register('name')}
                                />

                                {/* Lado a Lado para poupar espaço vertical */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Input
                                        label="E-mail Corporativo"
                                        type="email"
                                        placeholder="seu@empresa.com.br"
                                        leftIcon={<Mail className="w-4 h-4 text-[#8F8F91]" />}
                                        error={errors.email?.message}
                                        {...register('email')}
                                    />

                                    <Input
                                        label="Telefone / WhatsApp"
                                        placeholder="(62) 99999-9999"
                                        leftIcon={<Phone className="w-4 h-4 text-[#8F8F91]" />}
                                        error={errors.phone?.message}
                                        {...register('phone')}
                                    />
                                </div>

                                <Input
                                    label="Empresa (Opcional)"
                                    placeholder="Nome da sua marca"
                                    leftIcon={<Building className="w-4 h-4 text-[#8F8F91]" />}
                                    error={errors.company?.message}
                                    {...register('company')}
                                />

                                <Textarea
                                    label="Mensagem"
                                    placeholder="Conte um pouco sobre sua necessidade..."
                                    error={errors.message?.message}
                                    {...register('message')}
                                    rows={2} // Força uma altura menor no textarea
                                />

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full bg-[#FF5E00] hover:bg-[#FF5E00]/90 text-white font-bold border-none uppercase tracking-wide text-sm h-12 shadow-[0_4px_15px_rgba(255,94,0,0.3)] shrink-0"
                                        isLoading={isSubmitting}
                                        rightIcon={<Send className="w-4 h-4" />}
                                    >
                                        Enviar Mensagem
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================
                COLUNA DIREITA (IMAGEM E CARD FLUTUANTE)
            ========================================= */}
            <div className="hidden lg:flex flex-1 relative z-10 flex-col justify-end items-end p-12 pb-16">
                
                {/* Imagem de Fundo (Cidadet3.png) */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    {/* Gradientes para mesclar com o lado esquerdo */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-[#0A0A0B]/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-[#0A0A0B]/30 z-10" />
                    
                    <img 
                        src="/Cidadet3.png" 
                        alt="Background Cidade T3" 
                        className="absolute inset-0 w-full h-full object-cover opacity-90"
                    />
                    
                    {/* Filtro Laranja Subliminar */}
                    <div className="absolute inset-0 bg-[#FF5E00]/5 mix-blend-overlay z-10" />
                </div>

                {/* Card Flutuante de Texto (Exatamente como no Login) */}
                <div className="w-[480px] bg-[#111113]/90 backdrop-blur-xl border border-white/5 rounded-[24px] p-8 shadow-2xl relative z-20">
                    <h3 className="text-xl font-bold text-white mb-2">Impacto visual ininterrupto.</h3>
                    <p className="text-[#8F8F91] text-sm leading-relaxed">
                        Gerencie a exibição da sua marca nos pontos de maior fluxo da cidade com métricas auditáveis em tempo real. Uma plataforma completa de OOH para estruturar e impulsionar suas campanhas com inteligência de dados.
                    </p>
                </div>
            </div>

        </div>
    );
}