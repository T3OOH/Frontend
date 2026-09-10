import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, User, Mail, Phone, Building, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import { contactSchema, ContactFormData } from '@/schemas/contact.schema';
import { Link } from 'react-router-dom';

/**
 * Domain constants for WhatsApp routing.
 */
const ATTENDANTS = [
    { id: 'victor', name: 'Victor Hugo', fullName: 'Victor Hugo Dourado', phone: '556293206010' },
    { id: 'lucas', name: 'Lucas Dourado', fullName: 'Lucas Dourado', phone: '556492832807' }
];

/**
 * Contact Component
 * Handles the landing page for user inquiries. Routes the submitted data directly 
 * to a selected commercial representative via WhatsApp API.
 * 
 * UI/UX Implementation:
 * - Employs a split-screen layout (Hero information vs. Data collection).
 * - Follows the B2B Flat Premium design system (solid backgrounds, sharp corners, clear typography).
 * - Removed excessive glassmorphism and drop-shadows to prioritize form legibility.
 */
export function Contact() {
    const [selectedAttendant, setSelectedAttendant] = useState(ATTENDANTS[0]);

    /**
     * Form state management and validation using React Hook Form and Zod.
     */
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
    });

    /**
     * Payload formatting and URL generation for WhatsApp redirection.
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
        <div className="relative min-h-[100dvh] w-full flex items-center bg-[#0A0A0B] overflow-x-hidden">
            
            {/* Background Layer: Image with gradient overlays for text contrast optimization */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <img 
                    src="/Cidadet3.png" 
                    alt="Cidade T3" 
                    className="w-full h-full object-cover opacity-30 mix-blend-luminosity" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-[#0A0A0B]/95 to-[#0A0A0B]/80" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent" />
            </div>

            {/* Main Content Container: Constrained width, responsive row/col flex layout */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-28 lg:py-0 flex flex-col lg:flex-row items-center lg:items-stretch gap-16 lg:gap-24 h-full pt-[120px]">
                
                {/* Left Column: Brand Positioning & Hero Text */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center">
                    <img 
                        src="/t3d 2.png" 
                        alt="T3 OOH Logo" 
                        className="h-24 md:h-32 lg:h-40 w-auto object-contain mb-8 origin-left opacity-90"
                    />
                    
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
                        Fale com um<br />Especialista
                    </h1>
                    
                    <p className="text-base md:text-lg text-[#8F8F91] leading-relaxed mb-10 max-w-lg font-medium">
                        Impacto visual ininterrupto. Gerencie a exibição da sua marca nos pontos de maior fluxo da cidade. Insira seus dados e inicie o atendimento imediato.
                    </p>

                    <div className="flex items-center gap-4">
                        <Link to="/mapa" className="inline-flex">
                            <Button 
                                variant="ghost" 
                                className="border border-white/10 bg-[#111113] text-white hover:bg-white/5 hover:border-white/20 rounded-sm px-8 py-6 uppercase tracking-widest text-xs font-bold transition-all"
                                rightIcon={<ArrowRight className="w-4 h-4 text-[#FF5E00]" />}
                            >
                                Explorar Inventário
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Right Column: Data Collection Form */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center pb-12 lg:pb-0">
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-lg mx-auto lg:max-w-none flex flex-col gap-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F91] ml-0.5">Nome Completo *</label>
                                <Input
                                    placeholder="Ex: João Silva"
                                    leftIcon={<User className="w-4 h-4 text-[#8F8F91]" />}
                                    error={errors.name?.message}
                                    {...register('name')}
                                    className="bg-[#111113] border-white/10 text-white placeholder:text-[#8F8F91]/50 h-12 rounded-sm focus:border-[#FF5E00] transition-colors shadow-sm"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F91] ml-0.5">E-mail Corporativo *</label>
                                <Input
                                    type="email"
                                    placeholder="seu@empresa.com"
                                    leftIcon={<Mail className="w-4 h-4 text-[#8F8F91]" />}
                                    error={errors.email?.message}
                                    {...register('email')}
                                    className="bg-[#111113] border-white/10 text-white placeholder:text-[#8F8F91]/50 h-12 rounded-sm focus:border-[#FF5E00] transition-colors shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F91] ml-0.5">Telefone / WhatsApp *</label>
                                <Input
                                    placeholder="(62) 99999-9999"
                                    leftIcon={<Phone className="w-4 h-4 text-[#8F8F91]" />}
                                    error={errors.phone?.message}
                                    {...register('phone')}
                                    className="bg-[#111113] border-white/10 text-white placeholder:text-[#8F8F91]/50 h-12 rounded-sm focus:border-[#FF5E00] transition-colors shadow-sm"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F91] ml-0.5">Empresa / Marca</label>
                                <Input
                                    placeholder="Nome da sua marca"
                                    leftIcon={<Building className="w-4 h-4 text-[#8F8F91]" />}
                                    error={errors.company?.message}
                                    {...register('company')}
                                    className="bg-[#111113] border-white/10 text-white placeholder:text-[#8F8F91]/50 h-12 rounded-sm focus:border-[#FF5E00] transition-colors shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Routing Selection: Sales Representative */}
                        <div className="flex flex-col gap-1.5 pt-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F91] ml-0.5">Direcionamento Comercial *</label>
                            <div className="grid grid-cols-2 gap-4">
                                {ATTENDANTS.map((att) => (
                                    <button
                                        key={att.id}
                                        type="button"
                                        onClick={() => setSelectedAttendant(att)}
                                        className={`py-3 px-4 rounded-sm border flex items-center justify-center gap-3 transition-colors ${
                                            selectedAttendant.id === att.id 
                                            ? 'bg-[#FF5E00]/10 border-[#FF5E00] text-[#FF5E00]' 
                                            : 'bg-[#111113] border-white/10 text-[#8F8F91] hover:border-white/30 hover:text-white'
                                        }`}
                                    >
                                        <MessageCircle className={`w-4 h-4 shrink-0 ${selectedAttendant.id === att.id ? 'text-[#FF5E00]' : 'text-[#8F8F91]'}`} />
                                        <span className="text-xs font-bold truncate tracking-wide">{att.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F91] ml-0.5">Especificações (Opcional)</label>
                            <Textarea
                                placeholder="Descreva os objetivos da campanha, rotas de interesse ou dúvidas pontuais..."
                                error={errors.message?.message}
                                {...register('message')}
                                rows={4}
                                className="bg-[#111113] border-white/10 text-white placeholder:text-[#8F8F91]/50 rounded-sm focus:border-[#FF5E00] shadow-sm resize-none transition-colors"
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full bg-[#25D366] hover:bg-[#1eb858] text-[#0A0A0B] font-black border-none uppercase tracking-widest text-xs h-14 rounded-sm transition-colors"
                                rightIcon={<Send className="w-4 h-4" />}
                            >
                                Iniciar Atendimento Via WhatsApp
                            </Button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}