import { FormEvent, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, Check, Loader2 } from 'lucide-react';

import { api } from '@/lib/axios';
import { useToast } from '@/contexts/ToastContext';
import { Seo } from '@/components/Seo';
import type { LedScene } from '@/components/led/LedScreen';
import { CtaBand, btnOnOrange } from '@/components/CtaBand';
import { SOLUTION_APPLICATIONS } from '@/lib/solution';
import { btnDark, btnGhost, btnPrimary, eyebrow } from '@/lib/ui';
import { CustomSelect } from '@/components/CustomSelect';

interface PortfolioItem { image: string; alt: string }

// Mesmas opções do CRM (lib/solution.ts)
const APPLICATIONS = SOLUTION_APPLICATIONS;

const SPECS = [
    { label: 'Indoor', value: 'Pixel fino e alta taxa de atualização, para quem vê a tela de perto.' },
    { label: 'Outdoor', value: 'Brilho alto e gabinete resistente a sol e chuva, para fachadas e vias.' },
    { label: 'Modular', value: 'Gabinetes encaixáveis que montam telas em praticamente qualquer formato.' },
    { label: 'Estrutura', value: 'Totens, painéis embutidos em marcenaria, fachadas e estruturas metálicas.' },
];

const STEPS = [
    { title: 'Entendemos o espaço', text: 'Você conta onde a tela vai ficar e para que ela serve.' },
    { title: 'Desenhamos a solução', text: 'Definimos tamanho, pixel, estrutura e a especificação técnica.' },
    { title: 'Proposta', text: 'Você recebe o escopo e o investimento detalhados.' },
    { title: 'Instalação', text: 'Com a aprovação, cuidamos da fixação, instalação e configuração.' },
];

const CTA_SCENES: LedScene[] = [
    { type: 'ticker', text: 'T3 SOLUTION  •  PAINÉIS DE LED SOB MEDIDA  •  PROJETO, INSTALAÇÃO E SUPORTE', hold: 12000 },
    { type: 'logo', hold: 2600 },
];

const EMPTY_FORM = { name: '', phone: '', email: '', company: '', application: '', message: '' };

const field = 'w-full border border-white/15 bg-ink-900 px-4 py-3.5 text-sm text-ink-100 placeholder:text-ink-500 transition-colors focus:border-brand-neon focus:outline-none';
const label = 'mb-2 block text-sm text-ink-300';
const spring = { type: 'spring', stiffness: 100, damping: 20 } as const;

export function Solution() {
    const { addToast } = useToast();
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        api.get('/solution/portfolio', { signal: controller.signal })
            .then((res) => {
                const items = Array.isArray(res.data) ? res.data : [];
                setPortfolio(items.filter((i: { url?: string }) => i.url).map((i: { url: string; alt?: string }) => ({ image: i.url, alt: i.alt || 'Projeto da T3 Solution' })));
            })
            .catch(() => { /* sem portfólio, a seção some */ });
        return () => controller.abort();
    }, []);

    const set = (key: keyof typeof EMPTY_FORM) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            // Vira um negócio da linha T3 Solution na fila do CRM, com a aplicação escolhida
            await api.post('/crm/deals/solution', { name: form.name, phone: form.phone, email: form.email, company: form.company || undefined, application: form.application, message: form.message.trim() || undefined });
            setSent(true);
            setForm(EMPTY_FORM);
        } catch (error: unknown) {
            const details = (error as { response?: { data?: { details?: { message?: string }[] } } }).response?.data?.details;
            addToast(details?.[0]?.message || 'Não foi possível enviar sua mensagem. Tente novamente.', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <Seo title="T3 Solution" description="Painéis de LED sob medida para casas, empresas, comércio e empreendimentos: projeto, instalação e suporte com a T3 Solution." path="/solution" />

            {/* ============================ HERO ============================ */}
            {/* O fundo da página é o vídeo da casa com o telão da T3 Solution (MainLayout) */}
            <section className="mx-auto flex max-w-[1400px] items-center px-4 pb-20 pt-12 md:px-8 lg:min-h-[calc(100dvh-5rem)] lg:pb-24">
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                    <img src="/t3-solution-3d.webp" alt="T3 Solution" className="mb-10 h-auto w-56 md:w-72" />
                    <h1 className="text-[2.6rem] font-light uppercase leading-[0.95] tracking-tight text-ink-100 sm:text-6xl xl:text-7xl">
                        Telas de LED<br />do tamanho<br /><span className="text-brand-neon">do seu projeto.</span>
                    </h1>
                    <p className="mt-8 max-w-[48ch] text-base leading-relaxed text-ink-300 md:text-lg">
                        Projeto, fornecimento e instalação de painéis de LED para casas, empresas, lojas e empreendimentos.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-3">
                        <a href="#orcamento" className={btnPrimary}>Pedir orçamento <ArrowDown className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /></a>
                        <a href="#aplicacoes" className={btnGhost}>Onde aplicar</a>
                    </div>
                </motion.div>
            </section>

            {/* ============================ APLICAÇÕES ============================ */}
            <section id="aplicacoes" className="scroll-mt-20 border-t border-white/[0.08] bg-ink-950">
                <div className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
                    <div className="mb-14 grid grid-cols-1 items-end gap-6 md:grid-cols-[1fr_auto]">
                        <div>
                            <p className={`mb-4 ${eyebrow}`}>Aplicações</p>
                            <h2 className="text-4xl font-light uppercase leading-[0.95] tracking-tight text-ink-100 md:text-6xl">Uma tela para<br />cada espaço</h2>
                        </div>
                    </div>
                    <ul className="grid grid-cols-1 border-t border-white/[0.08] md:grid-cols-2">
                        {APPLICATIONS.map((item, i) => (
                            <motion.li
                                key={item.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ ...spring, delay: (i % 2) * 0.06 }}
                                className={`group grid grid-cols-[3.5rem_1fr] gap-4 border-b border-white/[0.08] py-8 md:py-10 ${i % 2 === 1 ? 'md:border-l md:pl-10' : 'md:pr-10'}`}
                            >
                                <span className="font-mono text-sm text-ink-500 transition-colors group-hover:text-brand-neon">0{i + 1}</span>
                                <div>
                                    <h3 className="text-2xl font-medium uppercase tracking-tight text-ink-100 md:text-3xl">{item.title}</h3>
                                    <p className="mt-3 max-w-[48ch] leading-relaxed text-ink-400">{item.text}</p>
                                </div>
                            </motion.li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ============================ PORTFÓLIO ============================ */}
            {portfolio.length > 0 && (
                <section className="border-t border-white/[0.08] bg-ink-950">
                    <div className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-24">
                        <p className={`mb-4 ${eyebrow}`}>Portfólio</p>
                        <h2 className="mb-12 text-4xl font-light uppercase leading-none tracking-tight text-ink-100 md:text-6xl">Projetos entregues</h2>
                        <div className={`grid grid-cols-1 gap-2 ${portfolio.length > 1 ? 'md:grid-cols-[1.4fr_1fr]' : ''}`}>
                            {portfolio.slice(0, 5).map((item, i) => (
                                <motion.figure
                                    key={item.image}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-60px' }}
                                    transition={{ ...spring, delay: i * 0.06 }}
                                    className={`group relative overflow-hidden bg-ink-900 ${i === 0 && portfolio.length > 2 ? 'md:row-span-2' : ''}`}
                                >
                                    <img src={item.image} alt={item.alt} loading="lazy" className="h-full max-h-[640px] w-full object-cover transition duration-700 group-hover:scale-[1.02]" />
                                    <figcaption className="absolute bottom-0 left-0 bg-ink-950 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-300">{item.alt}</figcaption>
                                </motion.figure>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ============================ ESPECIFICAÇÕES + PROCESSO (seção clara) ============================ */}
            <section className="bg-[#F4F1EC] text-ink-950">
                <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-14 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                    <div className="lg:sticky lg:top-28 lg:self-start">
                        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-500">Especificação</p>
                        <h2 className="text-4xl font-light uppercase leading-[0.95] tracking-tight md:text-6xl">O painel certo<br />para o ambiente</h2>
                        <p className="mt-6 max-w-[42ch] leading-relaxed text-ink-700">
                            A tela é configurada a partir da distância de quem vai olhar, da luz do lugar e da estrutura disponível.
                        </p>
                    </div>
                    <dl className="border-t border-ink-950/15">
                        {SPECS.map((spec) => (
                            <div key={spec.label} className="grid grid-cols-1 gap-2 border-b border-ink-950/15 py-8 sm:grid-cols-[10rem_1fr] sm:gap-6">
                                <dt className="text-2xl font-medium uppercase tracking-tight">{spec.label}</dt>
                                <dd className="max-w-[52ch] leading-relaxed text-ink-700">{spec.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div className="mx-auto max-w-[1400px] px-4 pb-20 md:px-8 md:pb-28">
                    <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-500">Como funciona</p>
                    <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {STEPS.map((step, i) => (
                            <motion.li
                                key={step.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ ...spring, delay: i * 0.07 }}
                                className={`border-t-2 pt-6 ${i === 0 ? 'border-brand-neon' : 'border-ink-950/20'}`}
                            >
                                <span className="font-mono text-4xl font-light text-brand-neon">0{i + 1}</span>
                                <h3 className="mt-4 text-xl font-medium uppercase tracking-tight">{step.title}</h3>
                                <p className="mt-2 leading-relaxed text-ink-700">{step.text}</p>
                            </motion.li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ============================ ORÇAMENTO ============================ */}
            <section id="orcamento" className="scroll-mt-20 bg-ink-950">
                <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-14 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                    <div>
                        <p className={`mb-4 ${eyebrow}`}>Orçamento</p>
                        <h2 className="text-4xl font-light uppercase leading-[0.95] tracking-tight text-ink-100 md:text-6xl">Conte sobre<br />o seu espaço</h2>
                        <p className="mt-6 max-w-[42ch] leading-relaxed text-ink-400">
                            Medidas aproximadas, fotos do local e o uso da tela ajudam a chegar mais rápido na proposta.
                            A equipe da T3 Solution responde pelo WhatsApp informado.
                        </p>
                    </div>

                    {sent ? (
                        <div role="status" className="flex flex-col items-start justify-center border border-white/10 p-8 md:p-12">
                            <span className="flex h-12 w-12 items-center justify-center bg-brand-neon text-ink-950"><Check className="h-6 w-6" strokeWidth={2} aria-hidden="true" /></span>
                            <h3 className="mt-6 text-3xl font-light uppercase tracking-tight text-ink-100">Pedido recebido</h3>
                            <p className="mt-3 max-w-[44ch] leading-relaxed text-ink-400">A equipe vai analisar o projeto e falar com você em breve.</p>
                            <button type="button" onClick={() => setSent(false)} className={`mt-8 ${btnGhost}`}>Enviar outro pedido</button>
                        </div>
                    ) : (
                        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label htmlFor="sol-name" className={label}>Nome completo</label>
                                <input id="sol-name" required autoComplete="name" value={form.name} onChange={set('name')} className={field} />
                            </div>
                            <div>
                                <label htmlFor="sol-phone" className={label}>WhatsApp</label>
                                <input id="sol-phone" required type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="(62) 9 0000-0000" className={field} />
                            </div>
                            <div>
                                <label htmlFor="sol-email" className={label}>E-mail</label>
                                <input id="sol-email" required type="email" autoComplete="email" value={form.email} onChange={set('email')} className={field} />
                            </div>
                            <div>
                                <label htmlFor="sol-company" className={label}>Empresa <span className="text-ink-500">(opcional)</span></label>
                                <input id="sol-company" autoComplete="organization" value={form.company} onChange={set('company')} className={field} />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="sol-app" className={label}>Onde a tela vai ficar</label>
                                <div className="relative">
                                    <CustomSelect tone="site" id="sol-app" required value={form.application} onChange={(v) => set('application')({ target: { value: v } })} placeholder="Selecione"
                                        options={APPLICATIONS.map((a) => ({ value: a.title, label: a.title }))} />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="sol-msg" className={label}>Detalhes do projeto <span className="text-ink-500">(opcional)</span></label>
                                <textarea id="sol-msg" rows={5} value={form.message} onChange={set('message')} placeholder="Local, medidas aproximadas, uso da tela" className={`${field} resize-none`} />
                            </div>
                            <div className="md:col-span-2">
                                <button type="submit" disabled={sending} className={`${btnPrimary} w-full md:w-auto`}>
                                    {sending ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Enviando</> : <>Enviar pedido <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /></>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </section>

            {/* ============================ CHAMADA FINAL ============================ */}
            <CtaBand title={<>Quer anunciar<br />nos telões?</>} scenes={CTA_SCENES}>
                <Link to="/mapa" className={btnDark}>
                    Ver a rede T3 OOH <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </Link>
                <Link to="/contato" className={btnOnOrange}>Falar com o comercial</Link>
            </CtaBand>
        </>
    );
}
