import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, User, Mail, Phone, Building, ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import { contactSchema, ContactFormData } from '@/schemas/contact.schema';
import { Link } from 'react-router-dom';

const ATTENDANTS = [
    { id: 'victor', name: 'Victor Hugo', fullName: 'Victor Hugo Dourado', phone: '556293206010' },
    { id: 'lucas', name: 'Lucas Dourado', fullName: 'Lucas Dourado', phone: '556492832807' }
];

/**
 * Componente de Contato / Fale com um Especialista.
 * Implementa integração direta com WhatsApp formatando a mensagem e dados do lead.
 * Possui layouts distintos e otimizados para Desktop (Split Screen estático) 
 * e Mobile (App Pattern com rolagem).
 */
export function Contact() {
    const [selectedAttendant, setSelectedAttendant] = useState(ATTENDANTS[0]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
    });

    /**
     * Formata os dados do formulário e redireciona para a API nativa do WhatsApp.
     * @param data - Dados validados do formulário de contato.
     */
    const onSubmit = (data: ContactFormData) => {
        const text = `Olá, ${selectedAttendant.name}! Meu nome é *${data.name}*.
Gostaria de falar sobre um orçamento/contato.

*Meus Dados:*
E-mail: ${data.email}
Telefone: ${data.phone}
${data.company ? `Empresa: ${data.company}\n` : ''}
*Mensagem:*
${data.message || 'Gostaria de mais informações sobre os painéis de LED.'}`;

        const encodedText = encodeURIComponent(text);
        const whatsappUrl = `https://wa.me/${selectedAttendant.phone}?text=${encodedText}`;
        
        window.open(whatsappUrl, '_blank');
        reset();
    };

    return (
        <div className="h-[100dvh] w-full flex bg-[#0A0A0B] overflow-hidden">
            
            {/* ========================================================= */}
            {/* DESKTOP LAYOUT (SPLIT SCREEN FIXO SEM SCROLL)               */}
            {/* ========================================================= */}
            
            <div className="hidden lg:flex w-[45%] h-full flex-col relative z-20 bg-[#0A0A0B] border-r border-white/5">
                
                {/* HEADER FIXO */}
                <div className="px-8 py-6 shrink-0">
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

                {/* ÁREA DO CARD - Espaçamentos otimizados para não gerar scroll */}
                <div className="flex-1 flex items-center justify-center px-6 pb-6 overflow-hidden">
                    
                    <div className="w-full max-w-[440px] bg-[#111113] border border-white/5 rounded-[24px] p-6 xl:p-8 shadow-2xl flex flex-col">
                        
                        <div className="flex justify-center mb-3 xl:mb-4 shrink-0">
                            <img 
                                src="/t3d 2.png" 
                                alt="T3 Logo" 
                                className="h-10 xl:h-12 w-auto object-contain drop-shadow-[0_0_20px_rgba(255,94,0,0.2)]" 
                            />
                        </div>

                        <div className="mb-4 text-left shrink-0">
                            <h2 className="text-xl xl:text-2xl font-bold text-white tracking-tight mb-1">
                                Fale com um Especialista
                            </h2>
                            <p className="text-[#8F8F91] text-xs xl:text-sm leading-relaxed">
                                Insira seus dados abaixo e escolha um consultor para iniciar o atendimento no WhatsApp.
                            </p>
                        </div>

                        <div className="w-full">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5 xl:space-y-3">
                                <Input
                                    label="Nome Completo *"
                                    placeholder="Ex: João Silva"
                                    leftIcon={<User className="w-4 h-4 text-[#8F8F91]" />}
                                    error={errors.name?.message}
                                    {...register('name')}
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="E-mail Corporativo *"
                                        type="email"
                                        placeholder="seu@empresa.com.br"
                                        leftIcon={<Mail className="w-4 h-4 text-[#8F8F91]" />}
                                        error={errors.email?.message}
                                        {...register('email')}
                                    />
                                    <Input
                                        label="Telefone / WhatsApp *"
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

                                {/* Seleção de Consultor Compacta */}
                                <div className="flex flex-col gap-1.5 pt-1">
                                    <label className="text-[11px] xl:text-xs font-medium text-brand-muted">Escolha um Consultor *</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {ATTENDANTS.map((att) => (
                                            <button
                                                key={att.id}
                                                type="button"
                                                onClick={() => setSelectedAttendant(att)}
                                                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all active:scale-95 ${
                                                    selectedAttendant.id === att.id 
                                                    ? 'bg-brand-neon/10 border-brand-neon text-brand-neon shadow-[0_0_15px_rgba(255,94,0,0.15)]' 
                                                    : 'bg-[#0A0A0B] border-white/5 text-brand-muted hover:border-white/20'
                                                }`}
                                            >
                                                <MessageCircle className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
                                                <span className="text-[11px] xl:text-xs font-bold line-clamp-1">{att.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Textarea
                                    label="Mensagem"
                                    placeholder="Conte um pouco sobre sua necessidade..."
                                    error={errors.message?.message}
                                    {...register('message')}
                                    rows={2}
                                />

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold border-none uppercase tracking-wide text-xs xl:text-sm h-11 xl:h-12 shadow-[0_4px_15px_rgba(37,211,102,0.3)] shrink-0 transition-colors"
                                        rightIcon={<Send className="w-4 h-4" />}
                                    >
                                        Enviar via WhatsApp
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* COLUNA DIREITA (IMAGEM DESKTOP) */}
            <div className="hidden lg:flex flex-1 relative z-10 flex-col justify-end items-end p-12 pb-16">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-[#0A0A0B]/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-[#0A0A0B]/30 z-10" />
                    <img src="/Cidadet3.png" alt="Background Cidade T3" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                    <div className="absolute inset-0 bg-[#FF5E00]/5 mix-blend-overlay z-10" />
                </div>

                <div className="w-[480px] bg-[#111113]/90 backdrop-blur-xl border border-white/5 rounded-[24px] p-8 shadow-2xl relative z-20">
                    <h3 className="text-xl font-bold text-white mb-2">Impacto visual ininterrupto.</h3>
                    <p className="text-[#8F8F91] text-sm leading-relaxed">
                        Gerencie a exibição da sua marca nos pontos de maior fluxo da cidade com métricas auditáveis em tempo real. Uma plataforma completa de OOH para estruturar e impulsionar suas campanhas com inteligência de dados.
                    </p>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MOBILE LAYOUT (APP PATTERN NATIVO)                          */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full h-full relative z-20 bg-[#0A0A0B]">
                
                {/* 1. App Bar Fixa no Topo */}
                <div className="sticky top-0 z-50 bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-brand-border/20 px-4 py-3 flex items-center justify-between shadow-sm pt-[env(safe-area-inset-top,12px)]">
                    <Link to="/" className="flex items-center gap-3 text-white active:opacity-70 transition-opacity">
                        <div className="w-9 h-9 rounded-full bg-[#111113] flex items-center justify-center border border-brand-border/40 shadow-sm">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-[15px] tracking-wide">Voltar</span>
                    </Link>
                    <img src="/t3d 2.png" alt="T3 Logo" className="h-6 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,94,0,0.3)]" />
                </div>

                {/* 2. Área de Rolagem do Formulário */}
                <div className="flex-1 overflow-y-auto px-5 pt-8 pb-[120px] custom-scrollbar">
                    
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-white tracking-tight mb-2 leading-tight">
                            Fale com um Especialista
                        </h2>
                        <p className="text-brand-muted text-[13px] leading-relaxed">
                            Preencha seus dados e escolha o consultor desejado para iniciar o atendimento imediato via WhatsApp.
                        </p>
                    </div>

                    <form id="mobile-contact-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <Input
                            label="Nome Completo *"
                            placeholder="Ex: João Silva"
                            leftIcon={<User className="w-4 h-4 text-brand-muted" />}
                            error={errors.name?.message}
                            {...register('name')}
                            className="bg-[#111113] h-12 text-sm"
                        />
                        <Input
                            label="E-mail Corporativo *"
                            type="email"
                            placeholder="seu@empresa.com.br"
                            leftIcon={<Mail className="w-4 h-4 text-brand-muted" />}
                            error={errors.email?.message}
                            {...register('email')}
                            className="bg-[#111113] h-12 text-sm"
                        />
                        <Input
                            label="Telefone / WhatsApp *"
                            placeholder="(62) 99999-9999"
                            leftIcon={<Phone className="w-4 h-4 text-brand-muted" />}
                            error={errors.phone?.message}
                            {...register('phone')}
                            className="bg-[#111113] h-12 text-sm"
                        />
                        <Input
                            label="Empresa (Opcional)"
                            placeholder="Nome da sua marca"
                            leftIcon={<Building className="w-4 h-4 text-brand-muted" />}
                            error={errors.company?.message}
                            {...register('company')}
                            className="bg-[#111113] h-12 text-sm"
                        />

                        {/* Seleção de Consultor Mobile */}
                        <div className="flex flex-col gap-2 pt-2">
                            <label className="text-[13px] font-medium text-brand-muted">Escolha um Consultor *</label>
                            <div className="grid grid-cols-2 gap-3">
                                {ATTENDANTS.map((att) => (
                                    <button
                                        key={att.id}
                                        type="button"
                                        onClick={() => setSelectedAttendant(att)}
                                        className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${
                                            selectedAttendant.id === att.id 
                                            ? 'bg-brand-neon/10 border-brand-neon text-brand-neon shadow-[0_0_15px_rgba(255,94,0,0.15)]' 
                                            : 'bg-[#111113] border-white/5 text-brand-muted hover:border-white/20'
                                        }`}
                                    >
                                        <MessageCircle className="w-6 h-6 shrink-0" />
                                        <span className="text-xs font-bold line-clamp-1">{att.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Textarea
                            label="Sua Mensagem"
                            placeholder="Conte um pouco sobre sua necessidade ou deixe uma dúvida..."
                            error={errors.message?.message}
                            {...register('message')}
                            rows={3}
                            className="bg-[#111113] text-sm resize-none mt-2"
                        />
                    </form>
                </div>

                {/* 3. Bottom Action Bar Fixa (Botão de Enviar) */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0B]/95 backdrop-blur-2xl border-t border-brand-border/20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-50 pb-safe">
                    <Button
                        type="submit"
                        form="mobile-contact-form"
                        size="lg"
                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black uppercase tracking-widest text-[13px] h-14 rounded-2xl shadow-[0_10px_25px_rgba(37,211,102,0.3)] active:scale-[0.98] transition-all border-none"
                        rightIcon={<Send className="w-4 h-4" />}
                    >
                        Enviar via WhatsApp
                    </Button>
                </div>
            </div>

        </div>
    );
}