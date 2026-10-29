import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, MessageCircle, Send } from 'lucide-react';
import { contactSchema, ContactFormData } from '@/schemas/contact.schema';
import { ATTENDANTS } from '@/lib/contacts';
import { COMPANY_CNPJ, COMPANY_NAME } from '@/lib/company';
import { Seo } from '@/components/Seo';
import { api } from '@/lib/axios';
import { btnGhost, btnPrimary, eyebrow } from '@/lib/ui';

const spring = { type: 'spring', stiffness: 100, damping: 20 } as const;

/** "556293206010" → "(62) 9320-6010"; "5562993206010" → "(62) 99320-6010". */
const formatPhone = (digits: string) => {
    const local = digits.replace(/^55/, '');
    const ddd = local.slice(0, 2);
    const rest = local.slice(2);
    return `(${ddd}) ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
};

const field = (invalid: boolean) =>
    `w-full border bg-ink-900 px-4 py-3.5 text-sm text-ink-100 placeholder:text-ink-500 transition-colors focus:outline-none ${invalid ? 'border-red-500 focus:border-red-500' : 'border-white/15 focus:border-brand-neon'}`;

export function Contact() {
    const [attendantId, setAttendantId] = useState(ATTENDANTS[0].id);
    const [sent, setSent] = useState(false);
    const attendant = ATTENDANTS.find((a) => a.id === attendantId) ?? ATTENDANTS[0];

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
    });

    const onSubmit = (data: ContactFormData) => {
        const contact = [`E-mail: ${data.email}`, `Telefone: ${data.phone}`, data.company && `Empresa: ${data.company}`].filter(Boolean).join('\n');
        const text = `Olá, ${attendant.name}! Meu nome é *${data.name}*.\n\n${contact}\n\n${data.message}`;
        window.open(`https://wa.me/${attendant.phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
        // Registra o lead (com a origem) para a gestão; o WhatsApp abre de qualquer jeito
        api.post('/contacts', {
            name: data.name.trim(),
            email: data.email.trim(),
            phone: data.phone.trim(),
            company: data.company?.trim() || undefined,
            message: `[WhatsApp: ${attendant.name}] ${data.message.trim()}`.slice(0, 3000),
        }).catch(() => { /* o contato já seguiu pelo WhatsApp */ });
        setSent(true);
        reset();
    };

    const Error = ({ id, message }: { id: string; message?: string }) =>
        message ? <p id={id} role="alert" className="mt-2 text-sm text-red-400">{message}</p> : null;

    return (
        <>
            <Seo title="Contato" description="Fale com o time comercial da T3 OOH pelo WhatsApp ou formulário e planeje sua campanha em mídia exterior." path="/contato" />

            <section className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-4 pb-20 pt-12 md:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:pb-28 lg:pt-20">
                {/* ============================ CANAIS ============================ */}
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                    <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-400">
                        Contato <span className="text-brand-neon">/</span> Goiânia · GO
                    </p>
                    <h1 className="text-[2.75rem] font-light uppercase leading-[0.95] tracking-tight text-ink-100 sm:text-6xl xl:text-7xl">
                        Fale com<br /><span className="text-brand-neon">o comercial.</span>
                    </h1>
                    <p className="mt-8 max-w-[44ch] text-base leading-relaxed text-ink-300">
                        Conte o que você quer anunciar e para quem. A conversa continua no WhatsApp, com quem cuida da sua região.
                    </p>

                    <ul className="mt-10 border-t border-white/[0.08]">
                        {ATTENDANTS.map((a) => (
                            <li key={a.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] py-5">
                                <div>
                                    <p className="text-lg font-medium text-ink-100">{a.fullName}</p>
                                    <p className="mt-1 font-mono text-sm text-ink-400">{formatPhone(a.phone)}</p>
                                </div>
                                <a href={`https://wa.me/${a.phone}?text=${encodeURIComponent(`Olá, ${a.name}! Quero saber mais sobre os painéis da T3.`)}`} target="_blank" rel="noopener noreferrer" className={btnGhost}>
                                    <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Chamar no WhatsApp
                                </a>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-10 flex flex-wrap items-center gap-6 text-sm">
                        <Link to="/mapa" className="group inline-flex items-center gap-2 font-medium text-ink-100 hover:text-brand-neon">
                            Ver painéis no mapa <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.75} aria-hidden="true" />
                        </Link>
                        <Link to="/solution" className="group inline-flex items-center gap-1.5 text-ink-400 hover:text-ink-100">
                            Painel de LED para o seu espaço <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                        </Link>
                    </div>
                </motion.div>

                {/* ============================ FORMULÁRIO ============================ */}
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }} className="self-start border border-white/[0.08] bg-ink-950/95 backdrop-blur-sm">
                    <div className="border-b border-white/[0.08] px-6 py-5 md:px-8">
                        <p className={eyebrow}>Mensagem</p>
                        <h2 className="mt-2 text-2xl font-light uppercase tracking-tight text-ink-100">Monte seu pedido</h2>
                    </div>

                    {sent ? (
                        <div role="status" className="p-6 md:p-8">
                            <p className="text-2xl font-light uppercase tracking-tight text-ink-100">Mensagem pronta</p>
                            <p className="mt-3 max-w-[48ch] leading-relaxed text-ink-400">
                                Abrimos o WhatsApp de {attendant.name} com o seu texto. É só tocar em enviar por lá. Se a janela não abriu, verifique se o navegador bloqueou pop-ups.
                            </p>
                            <button type="button" onClick={() => setSent(false)} className={`mt-6 ${btnGhost}`}>Escrever outra mensagem</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 md:p-8">
                            <div>
                                <label htmlFor="ct-name" className="mb-2 block text-sm text-ink-300">Nome completo</label>
                                <input id="ct-name" autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'ct-name-err' : undefined} {...register('name')} className={field(Boolean(errors.name))} />
                                <Error id="ct-name-err" message={errors.name?.message} />
                            </div>
                            <div>
                                <label htmlFor="ct-email" className="mb-2 block text-sm text-ink-300">E-mail</label>
                                <input id="ct-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'ct-email-err' : undefined} {...register('email')} className={field(Boolean(errors.email))} />
                                <Error id="ct-email-err" message={errors.email?.message} />
                            </div>
                            <div>
                                <label htmlFor="ct-phone" className="mb-2 block text-sm text-ink-300">WhatsApp</label>
                                <input id="ct-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(62) 9 0000-0000" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'ct-phone-err' : undefined} {...register('phone')} className={field(Boolean(errors.phone))} />
                                <Error id="ct-phone-err" message={errors.phone?.message} />
                            </div>
                            <div>
                                <label htmlFor="ct-company" className="mb-2 block text-sm text-ink-300">Empresa ou marca <span className="text-ink-500">(opcional)</span></label>
                                <input id="ct-company" autoComplete="organization" {...register('company')} className={field(false)} />
                            </div>

                            <fieldset className="md:col-span-2">
                                <legend className="mb-2 text-sm text-ink-300">Falar com</legend>
                                <div className="grid grid-cols-1 gap-px border border-white/15 bg-white/15 sm:grid-cols-2">
                                    {ATTENDANTS.map((a) => (
                                        <label key={a.id} className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-sm transition-colors ${attendantId === a.id ? 'bg-ink-850 text-ink-100 shadow-[inset_0_-2px_0_rgb(255,94,0)]' : 'bg-ink-900 text-ink-400 hover:text-ink-100'}`}>
                                            <input type="radio" name="attendant" value={a.id} checked={attendantId === a.id} onChange={() => setAttendantId(a.id)} className="sr-only" />
                                            <span>{a.fullName}</span>
                                            <span className="font-mono text-xs text-ink-500">{formatPhone(a.phone)}</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>

                            <div className="md:col-span-2">
                                <label htmlFor="ct-msg" className="mb-2 block text-sm text-ink-300">Sobre a campanha</label>
                                <textarea id="ct-msg" rows={5} placeholder="O que vai anunciar, em quais regiões, a partir de quando" aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'ct-msg-err' : 'ct-msg-hint'} {...register('message')} className={`${field(Boolean(errors.message))} resize-none`} />
                                {errors.message ? <Error id="ct-msg-err" message={errors.message.message} /> : <p id="ct-msg-hint" className="mt-2 text-xs text-ink-500">Pelo menos 15 caracteres.</p>}
                            </div>

                            <div className="flex flex-col gap-4 md:col-span-2 md:flex-row md:items-center md:justify-between">
                                <p className="text-xs text-ink-500">Seus dados vão só na mensagem do WhatsApp. Nada é publicado.</p>
                                <button type="submit" disabled={isSubmitting} className={btnPrimary}>
                                    <Send className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Enviar para {attendant.name}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </section>

            {/* ============================ DADOS DA EMPRESA ============================ */}
            <section className="border-t border-white/[0.08] bg-ink-950">
                <dl className="mx-auto grid max-w-[1400px] grid-cols-1 gap-px px-4 md:grid-cols-3 md:px-8">
                    {[
                        ['Empresa', COMPANY_NAME],
                        ['CNPJ', COMPANY_CNPJ],
                        ['Atendimento', 'Goiânia e interior de Goiás'],
                    ].map(([k, v]) => (
                        <div key={k} className="py-8 md:pr-8">
                            <dt className={eyebrow}>{k}</dt>
                            <dd className="mt-2 font-mono text-ink-100">{v}</dd>
                        </div>
                    ))}
                </dl>
            </section>
        </>
    );
}
