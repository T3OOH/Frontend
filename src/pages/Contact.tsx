import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, User, Mail, Phone, Building, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import { contactSchema, ContactFormData } from '@/schemas/contact.schema';
import { Link } from 'react-router-dom';

const ATTENDANTS = [
    { id: 'victor', name: 'Victor Hugo', fullName: 'Victor Hugo Dourado', phone: '556293206010' },
    { id: 'lucas', name: 'Lucas Dourado', fullName: 'Lucas Dourado', phone: '556492832807' }
];

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
        // Container principal que ocupa a tela toda. Blindado no escuro absoluto.
        <div className="relative min-h-[100dvh] w-full flex items-center bg-[#0A0A0B] overflow-x-hidden">
            
            {/* BACKGROUND IMERSIVO */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <img 
                    src="/Cidadet3.png" 
                    alt="Cidade T3" 
                    className="w-full h-full object-cover opacity-50" 
                />
                {/* Degradês para garantir a leitura do texto sobre a imagem */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-[#0A0A0B]/80 to-[#0A0A0B]/40 lg:to-[#0A0A0B]/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[#FF5E00]/5 mix-blend-overlay" />
            </div>

            {/* CONTAINER CENTRALIZADO */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-28 lg:py-0 flex flex-col lg:flex-row items-center lg:items-stretch gap-16 lg:gap-24 h-full pt-[120px]">
                
                {/* COLUNA ESQUERDA: TEXTO HEROICO */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center">
                    {/* A logo agora utiliza a formatação solicitada ("gigante") */}
                    <img 
                        src="/t3d 2.png" 
                        alt="T3 OOH Logo" 
                        className="h-24 md:h-32 lg:h-48 w-auto object-contain mb-8 origin-left drop-shadow-[0_0_30px_rgba(255,94,0,0.3)]"
                    />
                    
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6">
                        Fale com um<br />Especialista
                    </h1>
                    
                    <p className="text-base md:text-lg text-[#8F8F91] leading-relaxed mb-10 max-w-lg">
                        Impacto visual ininterrupto. Gerencie a exibição da sua marca nos pontos de maior fluxo da cidade. Insira seus dados ao lado e escolha um consultor para iniciar o atendimento imediato via WhatsApp.
                    </p>

                    {/* Botão similar ao "Saber Mais" do seu exemplo */}
                    <div className="flex items-center gap-4">
                        <Link to="/mapa" className="inline-flex">
                            <Button 
                                variant="ghost" 
                                className="border border-white/20 text-white hover:bg-white/10 hover:border-white/40 rounded-none px-8 py-6 uppercase tracking-widest text-xs font-bold transition-all"
                                rightIcon={<ArrowRight className="w-4 h-4" />}
                            >
                                Explorar Mapa
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* COLUNA DIREITA: FORMULÁRIO */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center">
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-lg mx-auto lg:max-w-none flex flex-col gap-5">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-white/70 ml-1">Nome Completo *</label>
                                <Input
                                    placeholder="Ex: João Silva"
                                    leftIcon={<User className="w-4 h-4 text-white/40" />}
                                    error={errors.name?.message}
                                    {...register('name')}
                                    className="bg-[#111113]/60 backdrop-blur-xl border-white/10 text-white placeholder:text-white/30 h-14 rounded-xl focus:border-[#FF5E00] shadow-2xl"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-white/70 ml-1">E-mail Corporativo *</label>
                                <Input
                                    type="email"
                                    placeholder="seu@empresa.com"
                                    leftIcon={<Mail className="w-4 h-4 text-white/40" />}
                                    error={errors.email?.message}
                                    {...register('email')}
                                    className="bg-[#111113]/60 backdrop-blur-xl border-white/10 text-white placeholder:text-white/30 h-14 rounded-xl focus:border-[#FF5E00] shadow-2xl"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-white/70 ml-1">Telefone / WhatsApp *</label>
                                <Input
                                    placeholder="(62) 99999-9999"
                                    leftIcon={<Phone className="w-4 h-4 text-white/40" />}
                                    error={errors.phone?.message}
                                    {...register('phone')}
                                    className="bg-[#111113]/60 backdrop-blur-xl border-white/10 text-white placeholder:text-white/30 h-14 rounded-xl focus:border-[#FF5E00] shadow-2xl"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-white/70 ml-1">Empresa (Opcional)</label>
                                <Input
                                    placeholder="Nome da sua marca"
                                    leftIcon={<Building className="w-4 h-4 text-white/40" />}
                                    error={errors.company?.message}
                                    {...register('company')}
                                    className="bg-[#111113]/60 backdrop-blur-xl border-white/10 text-white placeholder:text-white/30 h-14 rounded-xl focus:border-[#FF5E00] shadow-2xl"
                                />
                            </div>
                        </div>

                        {/* Seleção de Consultor */}
                        <div className="flex flex-col gap-2 pt-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-white/70 ml-1">Escolha um Consultor *</label>
                            <div className="grid grid-cols-2 gap-4">
                                {ATTENDANTS.map((att) => (
                                    <button
                                        key={att.id}
                                        type="button"
                                        onClick={() => setSelectedAttendant(att)}
                                        className={`py-4 px-4 rounded-xl border flex items-center justify-center gap-3 transition-all backdrop-blur-xl shadow-2xl active:scale-95 ${
                                            selectedAttendant.id === att.id 
                                            ? 'bg-[#FF5E00]/20 border-[#FF5E00]/50 text-[#FF5E00] shadow-[0_0_20px_rgba(255,94,0,0.15)]' 
                                            : 'bg-[#111113]/60 border-white/10 text-[#8F8F91] hover:border-white/30 hover:text-white'
                                        }`}
                                    >
                                        <MessageCircle className={`w-5 h-5 shrink-0 ${selectedAttendant.id === att.id ? 'text-[#FF5E00]' : 'text-white/40'}`} />
                                        <span className="text-sm font-bold truncate">{att.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-white/70 ml-1">Mensagem</label>
                            <Textarea
                                placeholder="Conte um pouco sobre sua necessidade ou deixe uma dúvida..."
                                error={errors.message?.message}
                                {...register('message')}
                                rows={4}
                                className="bg-[#111113]/60 backdrop-blur-xl border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#FF5E00] shadow-2xl resize-none"
                            />
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full bg-white hover:bg-gray-200 text-[#0A0A0B] font-black border-none uppercase tracking-widest text-sm h-14 rounded-none shadow-[0_4px_20px_rgba(255,255,255,0.1)] shrink-0 transition-all active:scale-[0.98]"
                                rightIcon={<Send className="w-4 h-4" />}
                            >
                                Enviar Mensagem
                            </Button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}