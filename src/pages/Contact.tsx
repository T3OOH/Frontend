import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, User, Mail, Phone, Building } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import { contactSchema, ContactFormData } from '@/schemas/contact.schema';

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
        reset(); // Limpa o formulário após o sucesso
    };

    return (
        <section className="min-h-screen flex items-center justify-center py-24 px-4 relative overflow-hidden">
            {/* Efeito visual sutil */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-neon/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

            <div className="w-full max-w-lg glass-panel p-8 rounded-2xl relative z-10">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                        Fale com um Especialista
                    </h2>
                    <p className="text-brand-muted">
                        Preencha os dados abaixo e retornaremos rapidamente.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <Input
                        label="Nome Completo"
                        placeholder="Ex: João Silva"
                        leftIcon={<User className="w-4 h-4" />}
                        error={errors.name?.message}
                        {...register('name')}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input
                            label="E-mail"
                            type="email"
                            placeholder="seu@email.com"
                            leftIcon={<Mail className="w-4 h-4" />}
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        <Input
                            label="Telefone / WhatsApp"
                            placeholder="(11) 99999-9999"
                            leftIcon={<Phone className="w-4 h-4" />}
                            error={errors.phone?.message}
                            {...register('phone')}
                        />
                    </div>

                    <Input
                        label="Empresa (Opcional)"
                        placeholder="Nome da sua marca"
                        leftIcon={<Building className="w-4 h-4" />}
                        error={errors.company?.message}
                        {...register('company')}
                    />

                    <Textarea
                        label="Mensagem"
                        placeholder="Detalhe o seu projeto ou necessidade de campanha..."
                        error={errors.message?.message}
                        {...register('message')}
                    />

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full mt-4"
                        isLoading={isSubmitting}
                        rightIcon={<Send className="w-5 h-5" />}
                    >
                        Enviar Mensagem
                    </Button>
                </form>
            </div>
        </section>
    );
}