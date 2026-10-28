import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { COMPANY_CNPJ, COMPANY_NAME } from '@/lib/company';
import { ATTENDANTS } from '@/lib/contacts';

const formatPhone = (digits: string) => {
    const local = digits.replace(/^55/, '');
    return `(${local.slice(0, 2)}) ${local.slice(2, local.length - 4)}-${local.slice(-4)}`;
};

const COLUMNS = [
    {
        title: 'Plataforma',
        links: [
            { label: 'Mapa de painéis', to: '/mapa' },
            { label: 'Catálogo', to: '/servicos' },
            { label: 'T3 Solution', to: '/solution' },
            { label: 'Entrar', to: '/login' },
        ],
    },
    {
        title: 'Empresa',
        links: [
            { label: 'Sobre a T3', to: '/sobre' },
            { label: 'Contato', to: '/contato' },
            { label: 'Política de Privacidade', to: '/privacidade' },
            { label: 'Termos de Uso', to: '/termos' },
        ],
    },
];

export function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="mt-auto border-t border-white/[0.06] bg-ink-950">
            <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-4 py-16 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:px-8 md:py-20">
                <div className="max-w-sm">
                    <img src="/t3-logo.webp" alt="T3 OOH" className="h-10 w-auto" />
                    <p className="mt-5 text-sm leading-relaxed text-ink-400">
                        Painéis de LED e mídia exterior em Goiânia e no interior de Goiás. Escolha os pontos no mapa e receba o orçamento com os valores do plano.
                    </p>
                    <div className="mt-6 flex gap-4 text-sm">
                        <a href="https://www.instagram.com/t3led/" target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-1 text-ink-300 hover:text-ink-100 md:min-h-0">
                            Instagram <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        </a>
                        <a href="https://www.linkedin.com/company/agencia-t3/" target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-1 text-ink-300 hover:text-ink-100 md:min-h-0">
                            LinkedIn <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                    {COLUMNS.map((col) => (
                        <nav key={col.title} aria-label={col.title}>
                            <h2 className="text-sm font-medium text-ink-100">{col.title}</h2>
                            <ul className="mt-4 space-y-3">
                                {col.links.map((link) => (
                                    <li key={link.to}>
                                        <Link to={link.to} className="text-sm text-ink-400 transition-colors hover:text-ink-100">{link.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                    <div className="col-span-2 sm:col-span-1">
                        <h2 className="text-sm font-medium text-ink-100">Atendimento</h2>
                        <ul className="mt-4 space-y-3 text-sm text-ink-400">
                            {ATTENDANTS.map((a) => (
                                <li key={a.id}>
                                    <a href={`https://wa.me/${a.phone}`} target="_blank" rel="noreferrer" className="hover:text-ink-100">
                                        <span className="block text-ink-300">{a.name}</span>
                                        <span className="font-mono text-xs">{formatPhone(a.phone)}</span>
                                    </a>
                                </li>
                            ))}
                            <li>
                                <a href="mailto:contato@t3comunicacao.com" className="hover:text-ink-100">contato@t3comunicacao.com</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="border-t border-white/[0.06]">
                <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-6 text-xs text-ink-500 md:flex-row md:items-center md:justify-between md:px-8">
                    <p>© {year} {COMPANY_NAME}. Todos os direitos reservados.</p>
                    {COMPANY_CNPJ && <p className="font-mono">CNPJ {COMPANY_CNPJ} · Goiânia, GO</p>}
                </div>
            </div>
        </footer>
    );
}
