import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

import { api } from '@/lib/axios';
import { Seo } from '@/components/Seo';
import { CtaBand, btnOnOrange } from '@/components/CtaBand';
import { btnDark, eyebrow } from '@/lib/ui';
import { sentenceCase } from '@/lib/text';

interface TeamMember { id?: string; name: string; role: string; bio?: string; image?: string }
interface Brand { id?: string; name: string; logo?: string }

/** Usado só se a API não responder: os sócios, sem foto. */
const FALLBACK_TEAM: TeamMember[] = [
    { name: 'Victor Hugo Dourado', role: 'Sócio-fundador', bio: 'Relacionamento com anunciantes e expansão da rede.' },
    { name: 'João Guerin', role: 'Sócio-fundador', bio: 'Estratégia comercial e operação das campanhas.' },
    { name: 'Natan Campos', role: 'Sócio-fundador', bio: 'Tecnologia e engenharia da T3 Solution.' },
];

const PRINCIPLES = [
    { title: 'Pontos de fluxo', text: 'Telões em cruzamentos e avenidas onde o trânsito para e o olhar fica na tela.' },
    { title: 'Preço claro', text: 'O valor de cada ponto está no site. Descontos de 15%, 20% e 30% para contratos de 3, 6 e 12 meses.' },
    { title: 'Comprovação', text: 'Checking fotográfico da veiculação e relatório com a estimativa de impactos de cada painel.' },
    { title: 'Gente perto', text: 'Atendimento direto com quem opera os painéis, em Goiânia, pelo WhatsApp.' },
];

const parseList = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];
    if (typeof value === 'string') {
        try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    }
    return [];
};

const spring = { type: 'spring', stiffness: 100, damping: 20 } as const;

const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('');

export function Info() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready'>('loading');

    useEffect(() => {
        let active = true;
        api.get('/institutional')
            .then((res) => {
                if (!active) return;
                const fetched = parseList<TeamMember>(res.data?.team);
                setTeam(fetched.length ? fetched : FALLBACK_TEAM);
                setBrands(parseList<Brand>(res.data?.brands).filter((b) => b.logo || b.name));
            })
            .catch(() => { if (active) setTeam(FALLBACK_TEAM); })
            .finally(() => { if (active) setStatus('ready'); });
        return () => { active = false; };
    }, []);

    return (
        <>
            <Seo title="Sobre a T3" description="Conheça a T3 OOH, nossa equipe e as marcas que anunciam na nossa rede de painéis de LED em Goiânia." path="/sobre" />

            {/* ============================ HERO (sobre o vídeo da cidade) ============================ */}
            <section className="mx-auto max-w-[1400px] px-4 pb-20 pt-12 md:px-8 md:pb-28 lg:pt-20">
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="max-w-3xl">
                    <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-400">
                        Sobre a T3 <span className="text-brand-neon">/</span> Goiânia · GO
                    </p>
                    <h1 className="text-[2.75rem] font-light uppercase leading-[0.95] tracking-tight text-ink-100 sm:text-6xl xl:text-7xl">
                        Feita em Goiânia.<br /><span className="text-brand-neon">Vista pela cidade.</span>
                    </h1>
                    <p className="mt-8 max-w-[52ch] text-base leading-relaxed text-ink-300 md:text-lg">
                        A T3 opera telões de LED nos corredores de maior fluxo de Goiânia e do interior de Goiás.
                        A gente cuida do ponto, da tela e da veiculação, e você acompanha tudo pela plataforma.
                    </p>
                </motion.div>
            </section>

            {/* ============================ O QUE FAZEMOS ============================ */}
            <section className="border-t border-white/[0.08] bg-ink-950">
                <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-14 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                    <div className="lg:sticky lg:top-28 lg:self-start">
                        <p className={`mb-4 ${eyebrow}`}>O que fazemos</p>
                        <h2 className="text-4xl font-light uppercase leading-[0.95] tracking-tight text-ink-100 md:text-6xl">
                            A tela certa<br />no ponto<br /><span className="text-brand-neon">certo.</span>
                        </h2>
                        <p className="mt-6 max-w-[44ch] leading-relaxed text-ink-400">
                            Mídia exterior digital com a precisão de uma campanha on-line: ponto escolhido no mapa,
                            preço calculado na hora e comprovação de cada veiculação.
                        </p>
                    </div>
                    <ol className="border-t border-white/[0.08]">
                        {PRINCIPLES.map((item, i) => (
                            <motion.li
                                key={item.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ ...spring, delay: i * 0.06 }}
                                className="grid grid-cols-[4rem_1fr] gap-4 border-b border-white/[0.08] py-9 md:grid-cols-[7rem_1fr] md:py-11"
                            >
                                <span className="font-mono text-3xl font-light text-brand-neon md:text-4xl">0{i + 1}</span>
                                <div>
                                    <h3 className="text-2xl font-medium uppercase tracking-tight text-ink-100">{item.title}</h3>
                                    <p className="mt-3 max-w-[54ch] leading-relaxed text-ink-400">{item.text}</p>
                                </div>
                            </motion.li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ============================ AS DUAS FRENTES ============================ */}
            <section aria-label="Empresas do grupo" className="grid grid-cols-1 gap-px border-t border-white/[0.08] bg-white/[0.08] md:grid-cols-2">
                {[
                    { to: '/mapa', tag: 'T3 OOH', title: 'Anuncie nos telões da cidade', text: 'Rede de painéis de LED em avenidas de Goiânia e região, com contratos mensais.', img: '/cidade-t3-noite.webp', cta: 'Ver pontos no mapa' },
                    { to: '/solution', tag: 'T3 Solution', title: 'Tenha um painel de LED seu', text: 'Projeto, fornecimento e instalação de telas para fachadas, empresas, lojas e casas.', img: '/cidade-t3.webp', cta: 'Conhecer a T3 Solution' },
                ].map((item) => (
                    <Link key={item.to} to={item.to} className="group relative isolate flex min-h-[420px] flex-col justify-end overflow-hidden bg-ink-950 p-6 md:min-h-[520px] md:p-10">
                        <img src={item.img} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40 grayscale-[40%] transition duration-700 group-hover:scale-[1.03] group-hover:opacity-60 group-hover:grayscale-0" />
                        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent" />
                        <p className={eyebrow}>{item.tag}</p>
                        <h2 className="mt-4 max-w-[16ch] text-3xl font-light uppercase leading-[0.95] tracking-tight text-ink-100 md:text-5xl">{item.title}</h2>
                        <p className="mt-4 max-w-[44ch] leading-relaxed text-ink-300">{item.text}</p>
                        <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-ink-100 group-hover:text-brand-neon">
                            {item.cta}
                            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden="true" />
                        </span>
                    </Link>
                ))}
            </section>

            {/* ============================ EQUIPE (seção clara) ============================ */}
            <section className="bg-[#F4F1EC] text-ink-950">
                <div className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
                    <div className="mb-14 grid grid-cols-1 items-end gap-6 md:grid-cols-[1fr_auto]">
                        <div>
                            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-500">Equipe</p>
                            <h2 className="text-4xl font-light uppercase leading-[0.95] tracking-tight md:text-6xl">Quem está<br />por trás das telas</h2>
                        </div>
                        <p className="max-w-[36ch] leading-relaxed text-ink-700">Quem fundou a T3 e conduz a rede de painéis e os projetos da T3 Solution.</p>
                    </div>

                    {status === 'loading' ? (
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Carregando equipe">
                            {[0, 1, 2].map((i) => <div key={i} className="aspect-[4/5] animate-pulse bg-ink-950/10" />)}
                        </div>
                    ) : (
                        <ul className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                            {team.map((member, i) => (
                                <motion.li
                                    key={member.id ?? member.name}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-60px' }}
                                    transition={{ ...spring, delay: i * 0.08 }}
                                    className={`group ${i % 3 === 1 ? 'lg:mt-16' : ''}`}
                                >
                                    <div className="relative aspect-[4/5] overflow-hidden bg-ink-950">
                                        {member.image ? (
                                            <img
                                                src={member.image}
                                                alt={`Foto de ${member.name}`}
                                                loading="lazy"
                                                className="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
                                            />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center font-mono text-6xl font-light text-ink-500" aria-hidden="true">{initials(member.name)}</span>
                                        )}
                                        <span className="absolute left-0 top-0 bg-[#F4F1EC] px-3 py-1.5 font-mono text-[11px] text-ink-700">0{i + 1}</span>
                                    </div>
                                    <h3 className="mt-5 text-2xl font-medium uppercase tracking-tight">{member.name}</h3>
                                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-brand-neon">{member.role}</p>
                                    {member.bio && <p className="mt-4 max-w-[40ch] border-t border-ink-950/15 pt-4 leading-relaxed text-ink-700">{sentenceCase(member.bio)}</p>}
                                </motion.li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            {/* ============================ MARCAS ============================ */}
            {brands.length > 0 && (
                <section className="bg-ink-950">
                    <div className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-24">
                        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className={`mb-4 ${eyebrow}`}>Quem anuncia</p>
                                <h2 className="text-3xl font-light uppercase leading-none tracking-tight text-ink-100 md:text-5xl">Marcas na rede T3</h2>
                            </div>
                        </div>
                        <ul className="grid grid-cols-2 border-l border-t border-white/[0.08] sm:grid-cols-3 lg:grid-cols-5">
                            {brands.map((brand) => (
                                <li key={brand.id ?? brand.name} className="group flex h-32 items-center justify-center border-b border-r border-white/[0.08] bg-ink-950 p-6 md:h-40">
                                    {brand.logo
                                        ? <img src={brand.logo} alt={brand.name} loading="lazy" className="max-h-16 w-auto max-w-full object-contain opacity-70 grayscale transition group-hover:opacity-100 group-hover:grayscale-0" />
                                        : <span className="text-center text-sm uppercase tracking-[0.14em] text-ink-400">{brand.name}</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {/* ============================ CHAMADA FINAL ============================ */}
            <CtaBand title={<>Sua marca<br />na rua?</>}>
                <Link to="/mapa" className={btnDark}>
                    Ver painéis no mapa <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </Link>
                <Link to="/contato" className={btnOnOrange}>Falar com o comercial</Link>
            </CtaBand>
        </>
    );
}
