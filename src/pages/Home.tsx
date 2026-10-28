import { useEffect, useMemo, useRef, useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowUpRight, MapPin, Search } from 'lucide-react';

import { Seo } from '@/components/Seo';
import { LedWall } from '@/components/led/LedWall';
import { LedScreen, LedScene } from '@/components/led/LedScreen';
import { panelsService, PanelData } from '@/services/panels.service';
import { parseImpacts, formatImpacts } from '@/lib/impacts';

/** Desconto do plano de 12 meses (mesma regra do backend). */
const ANNUAL_DISCOUNT = 0.3;

const CTA_SCENES: LedScene[] = [
    { type: 'ticker', text: 'SEU ANÚNCIO NOS TELÕES DA T3  •  PLANO ANUAL COM ATÉ 30% DE DESCONTO', hold: 12000 },
    { type: 'logo', hold: 2600 },
];

const spring = { type: 'spring', stiffness: 100, damping: 20 } as const;

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

const STEPS = [
    {
        title: 'Escolha os pontos',
        text: 'Filtre por cidade e avenida, veja fotos reais de cada painel e a estimativa de impactos por dia.',
    },
    {
        title: 'Monte o pacote',
        text: 'Adicione os painéis ao orçamento. Contratos de 3, 6 e 12 meses têm desconto progressivo de até 30%.',
    },
    {
        title: 'Entre no ar',
        text: 'O pedido chega ao comercial com os valores calculados. A gente confirma a disponibilidade e agenda a veiculação.',
    },
];

export function Home() {
    const navigate = useNavigate();
    const [panels, setPanels] = useState<PanelData[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [query, setQuery] = useState('');

    // Frase grande que desliza na horizontal conforme a rolagem
    const statementRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: statementRef, offset: ['start end', 'end start'] });
    const lineA = useTransform(scrollYProgress, [0, 1], ['8%', '-14%']);
    const lineB = useTransform(scrollYProgress, [0, 1], ['-12%', '6%']);

    useEffect(() => {
        let active = true;
        panelsService.getAllPanels()
            .then((data) => { if (active) { setPanels(data); setStatus('ready'); } })
            .catch(() => { if (active) setStatus('error'); });
        return () => { active = false; };
    }, []);

    const available = useMemo(() => panels.filter((p) => p.status === 'AVAILABLE'), [panels]);
    const stats = useMemo(() => {
        const cities = new Set(available.map((p) => p.city).filter(Boolean));
        const impacts = available.reduce((sum, p) => sum + parseImpacts(p.impacts), 0);
        const prices = available.map((p) => Number(p.price)).filter((v) => v > 0);
        return {
            count: available.length,
            cities: cities.size,
            impacts,
            fromPrice: prices.length ? Math.min(...prices) * (1 - ANNUAL_DISCOUNT) : 0,
        };
    }, [available]);
    const featured = available.slice(0, 5);
    const ready = status === 'ready';

    const onSearch = (e: FormEvent) => {
        e.preventDefault();
        navigate(query.trim() ? `/mapa?q=${encodeURIComponent(query.trim())}` : '/mapa');
    };

    return (
        <>
            <Seo
                title="T3 OOH | Mídia OOH e painéis de LED"
                description="Anuncie nos telões de LED da T3 em Goiânia e região. Veja os pontos no mapa, monte seu pacote e solicite o orçamento."
                path="/"
            />

            {/* ============================ HERO (sobre a cidade) ============================ */}
            <section className="relative">
                <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-4 pb-16 pt-12 md:px-8 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-4 lg:pb-24">
                    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="max-w-xl">
                        <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-400">
                            Mídia OOH <span className="text-brand-neon">/</span> Goiânia e região
                        </p>

                        <h1 className="text-[2.75rem] font-light uppercase leading-[0.95] tracking-tight text-ink-100 sm:text-6xl xl:text-7xl">
                            Sua marca<br />na cidade<br /><span className="text-brand-neon">que não para.</span>
                        </h1>

                        <p className="mt-8 max-w-[46ch] text-base leading-relaxed text-ink-300">
                            Painéis de LED nos corredores mais movimentados de Goiânia e do interior de Goiás.
                            Escolha os pontos no mapa e receba o orçamento com os valores do plano.
                        </p>

                        <form onSubmit={onSearch} role="search" className="mt-8 flex max-w-lg border border-white/15 bg-ink-950/70 backdrop-blur-sm focus-within:border-white/40">
                            <label htmlFor="hero-search" className="sr-only">Buscar painéis por cidade ou avenida</label>
                            <Search className="ml-4 mt-[15px] h-4 w-4 shrink-0 text-ink-400" strokeWidth={1.75} aria-hidden="true" />
                            <input
                                id="hero-search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cidade, bairro ou avenida"
                                className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                            />
                            <button type="submit" className="bg-brand-neon px-5 text-sm font-semibold text-ink-950 hover:bg-brand-neonHover">Buscar</button>
                        </form>

                        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
                            <Link to="/mapa" className="group inline-flex items-center gap-2 font-medium text-ink-100 hover:text-brand-neon">
                                Ver painéis no mapa
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.75} aria-hidden="true" />
                            </Link>
                            <Link to="/contato" className="text-ink-400 underline-offset-4 hover:text-ink-100 hover:underline">Falar com o comercial</Link>
                        </div>
                    </motion.div>

                    <LedWall />
                </div>
            </section>

            {/* ============================ NÚMEROS ============================ */}
            <section aria-label="A rede T3 em números" className="border-y border-white/[0.08] bg-ink-950">
                <dl className="mx-auto grid max-w-[1400px] grid-cols-2 px-4 md:grid-cols-4 md:px-8">
                    {[
                        { label: 'painéis disponíveis', value: ready ? String(stats.count) : '—' },
                        { label: stats.cities === 1 ? 'cidade atendida' : 'cidades atendidas', value: ready ? String(stats.cities) : '—' },
                        { label: 'impactos estimados por dia', value: ready && stats.impacts ? formatImpacts(stats.impacts) : '—' },
                        { label: 'a partir de, por mês no plano anual', value: ready && stats.fromPrice ? formatCurrency(stats.fromPrice) : '—' },
                    ].map((item, i) => (
                        <div key={item.label} className={`flex flex-col-reverse border-white/[0.08] py-8 md:px-8 ${i > 0 ? 'md:border-l' : 'md:pl-0'} ${i % 2 === 1 ? 'border-l pl-4 md:pl-8' : ''}`}>
                            <dt className="mt-2 text-xs uppercase tracking-[0.14em] text-ink-400">{item.label}</dt>
                            <dd className="font-mono text-3xl font-light text-ink-100 md:text-4xl">{item.value}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* ============================ PONTOS EM DESTAQUE ============================ */}
            <section className="bg-ink-950">
                <div className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
                    <div className="mb-12 grid grid-cols-1 items-end gap-6 md:grid-cols-[1fr_auto]">
                        <div>
                            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-400">Inventário</p>
                            <h2 className="text-4xl font-light uppercase leading-none tracking-tight text-ink-100 md:text-6xl">Pontos em destaque</h2>
                        </div>
                        <Link to="/servicos" className="group inline-flex items-center gap-2 text-sm font-medium text-ink-100 hover:text-brand-neon">
                            Ver catálogo completo
                            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden="true" />
                        </Link>
                    </div>

                    {status === 'loading' && (
                        <div className="grid grid-cols-1 gap-px bg-white/[0.06] md:grid-cols-[1.35fr_1fr_1fr] md:grid-rows-2" aria-busy="true" aria-label="Carregando painéis">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div key={i} className={`animate-pulse bg-ink-900 ${i === 0 ? 'aspect-[4/3] md:row-span-2 md:aspect-auto' : 'aspect-[4/3]'}`} />
                            ))}
                        </div>
                    )}

                    {status === 'error' && (
                        <p className="border border-white/10 p-10 text-ink-300">
                            Não foi possível carregar os painéis agora. <Link to="/mapa" className="text-ink-100 underline underline-offset-4">Abra o mapa</Link> ou tente novamente em instantes.
                        </p>
                    )}

                    {ready && featured.length === 0 && (
                        <p className="border border-dashed border-white/15 p-10 text-ink-300">
                            Nenhum painel disponível no momento. <Link to="/contato" className="text-ink-100 underline underline-offset-4">Fale com o comercial</Link> para saber das próximas liberações.
                        </p>
                    )}

                    {ready && featured.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.35fr_1fr_1fr] md:grid-rows-2">
                            {featured.map((panel, i) => {
                                const price = Number(panel.price) || 0;
                                return (
                                    <motion.div
                                        key={panel.id}
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: '-60px' }}
                                        transition={{ ...spring, delay: i * 0.06 }}
                                        className={i === 0 ? 'md:row-span-2' : ''}
                                    >
                                        <Link to={`/servicos?panelId=${panel.id}`} className="group relative block h-full min-h-[280px] overflow-hidden bg-ink-900">
                                            <img
                                                src={panel.images?.[0] || '/placeholder.svg'}
                                                alt={`Painel ${panel.name}`}
                                                loading="lazy"
                                                className="absolute inset-0 h-full w-full object-cover grayscale-[35%] transition duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
                                            <span className="absolute left-0 top-0 bg-ink-950 px-3 py-1.5 font-mono text-[11px] text-ink-300">0{i + 1}</span>
                                            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                                                <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-ink-300">
                                                    <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                                                    {[panel.city, panel.state].filter(Boolean).join(' · ') || 'Localização a confirmar'}
                                                </p>
                                                <h3 className={`mt-2 font-medium tracking-tight text-ink-100 ${i === 0 ? 'text-2xl md:text-3xl' : 'text-lg'} line-clamp-2`}>
                                                    {panel.name}
                                                </h3>
                                                <p className="mt-3 font-mono text-sm text-ink-300">
                                                    {price > 0
                                                        ? <><span className="text-brand-neon">{formatCurrency(price * (1 - ANNUAL_DISCOUNT))}</span>/mês no plano anual</>
                                                        : 'Valor sob consulta'}
                                                </p>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ============================ FRASE SOBRE A CIDADE ============================ */}
            <section ref={statementRef} aria-label="Manifesto" className="relative overflow-hidden py-28 md:py-44">
                <motion.p style={{ x: lineA }} className="whitespace-nowrap text-[13vw] font-light uppercase leading-[0.9] tracking-tighter text-ink-100 md:text-[9vw]">
                    Cada avenida
                </motion.p>
                <motion.p style={{ x: lineB }} className="whitespace-nowrap text-right text-[13vw] font-light uppercase leading-[0.9] tracking-tighter md:text-[9vw]">
                    <span className="text-brand-neon">é uma vitrine.</span>
                </motion.p>
            </section>

            {/* ============================ COMO FUNCIONA (seção clara) ============================ */}
            <section className="bg-[#F4F1EC] text-ink-950">
                <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-14 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                    <div className="lg:sticky lg:top-28 lg:self-start">
                        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-500">Como funciona</p>
                        <h2 className="text-4xl font-light uppercase leading-[0.95] tracking-tight md:text-6xl">Do mapa<br />ao telão</h2>
                        <p className="mt-6 max-w-[42ch] leading-relaxed text-ink-700">
                            O orçamento é calculado pela plataforma com os preços oficiais de cada ponto. Sem planilha, sem idas e vindas por e-mail.
                        </p>
                        <Link to="/mapa" className="mt-8 inline-flex items-center gap-2 bg-ink-950 px-6 py-3.5 text-sm font-semibold text-ink-100 transition-colors hover:bg-ink-800 active:translate-y-px">
                            Começar pelo mapa <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                        </Link>
                    </div>
                    <ol className="border-t border-ink-950/15">
                        {STEPS.map((step, i) => (
                            <motion.li
                                key={step.title}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ ...spring, delay: i * 0.08 }}
                                className="grid grid-cols-[4rem_1fr] gap-4 border-b border-ink-950/15 py-10 md:grid-cols-[7rem_1fr] md:py-12"
                            >
                                <span className="font-mono text-3xl font-light text-brand-neon md:text-5xl">0{i + 1}</span>
                                <div>
                                    <h3 className="text-2xl font-medium uppercase tracking-tight md:text-3xl">{step.title}</h3>
                                    <p className="mt-3 max-w-[54ch] leading-relaxed text-ink-700">{step.text}</p>
                                </div>
                            </motion.li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ============================ CHAMADA FINAL (seção laranja) ============================ */}
            <section className="bg-brand-neon text-ink-950">
                <div className="bg-ink-950 p-2">
                    <LedScreen scenes={CTA_SCENES} cols={240} rows={18} label="Letreiro de LED" className="block h-14 w-full md:h-20" />
                </div>
                <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-end gap-10 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[1fr_auto]">
                    <h2 className="text-5xl font-semibold uppercase leading-[0.9] tracking-tighter md:text-8xl">
                        Pronto para<br />aparecer?
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/mapa" className="inline-flex items-center gap-2 bg-ink-950 px-6 py-4 text-sm font-semibold text-ink-100 transition-colors hover:bg-ink-800 active:translate-y-px">
                            Montar meu pacote <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                        </Link>
                        <Link to="/contato" className="inline-flex items-center border border-ink-950/40 px-6 py-4 text-sm font-semibold text-ink-950 transition-colors hover:border-ink-950 active:translate-y-px">
                            Falar com o comercial
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}

