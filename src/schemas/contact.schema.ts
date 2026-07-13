import { z } from 'zod';

export const contactSchema = z.object({
    name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
    email: z.string().email("Digite um e-mail válido"),
    phone: z.string().min(10, "Telefone inválido (Ex: 11999999999)"),
    company: z.string().optional(),
    message: z.string().min(15, "A mensagem deve ter no mínimo 15 caracteres"),
});

export type ContactFormData = z.infer<typeof contactSchema>;