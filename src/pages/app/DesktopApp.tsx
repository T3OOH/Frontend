import { useState } from 'react';
import { BarChart3, Bell, FileSpreadsheet, KanbanSquare, Lock, MessagesSquare, MonitorDown, MousePointerClick, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { CrmPage, Panel, Badge } from '@/components/app/ui';
import { eyebrowCrm } from '@/components/app/tokens';
import { DesktopDownload } from './DesktopDownload';

/**
 * O download só abre no lançamento. Até lá a página apresenta o app (fotos reais das telas,
 * com dados fictícios) para a gestão conhecer e decidir a implantação.
 */
const DOWNLOAD_LIBERADO = false;

const TELAS = [
    { id: 'painel', label: 'Painel do gestor', img: '/app-desktop/painel.webp', text: 'Receita, funil, previsão ponderada e ocupação dos painéis das duas linhas, num só lugar.' },
    { id: 'negocios', label: 'CRM em kanban', img: '/app-desktop/negocios.webp', text: 'Cada negócio num cartão: arraste entre as etapas, filtre por linha, consultor ou situação.' },
    { id: 'chat', label: 'Chat com o cliente', img: '/app-desktop/chat.webp', text: 'Conversa em tempo real com quem pediu orçamento, ligada ao negócio e com nota interna.' },
    { id: 'agenda', label: 'Agenda', img: '/app-desktop/agenda.webp', text: 'Ligações, visitas e follow-ups da equipe, com o que está atrasado em destaque.' },
    { id: 'relatorios', label: 'Relatórios', img: '/app-desktop/relatorios.webp', text: 'Vendas, funil, ocupação e tráfego em Excel ou PDF com um clique, e a previsão dos próximos meses.' },
] as const;

const GANHOS = [
    { icon: Zap, title: 'Abre e já está pronto', text: 'Janela própria, sem abas e sem login a cada manhã. O comercial começa o dia direto no funil.' },
    { icon: KanbanSquare, title: 'O funil inteiro à vista', text: 'Negócios da T3 OOH e da T3 Solution lado a lado, com valor por etapa e previsão ponderada.' },
    { icon: MessagesSquare, title: 'Resposta mais rápida', text: 'O chat fica aberto junto do CRM. Quem pediu orçamento recebe resposta enquanto ainda está interessado.' },
    { icon: FileSpreadsheet, title: 'Reunião em um clique', text: 'Planilhas e PDFs de vendas, funil e ocupação saem prontos para a reunião, sem montar nada à mão.' },
    { icon: RefreshCw, title: 'Sempre atualizado', text: 'Como um jogo: baixa a versão nova em segundo plano, avisa e instala quando você fecha o app.' },
    { icon: Lock, title: 'Seguro', text: 'Só a equipe entra, a sessão fica criptografada no computador e tudo passa pelo registro de auditoria.' },
];

const ANTES_DEPOIS = [
    ['Várias abas do navegador abertas o dia todo', 'Uma janela com painel, CRM, chat e agenda'],
    ['Montar planilha à mão para a reunião', 'Excel e PDF prontos com um clique'],
    ['Cliente esperando resposta no site', 'Chat em tempo real ao lado do negócio'],
    ['Previsão de vendas "de cabeça"', 'Previsão ponderada pela etapa de cada negócio'],
    ['Atualizar o sistema é com o suporte', 'Atualiza sozinho, como um jogo'],
];

const INSTALAR = [
    { icon: MousePointerClick, title: 'Clique em instalar', text: 'Um arquivo só. Abra e ele instala sozinho em menos de um minuto, sem pedir senha de administrador.' },
    { icon: MonitorDown, title: 'Atalho na área de trabalho', text: 'O T3 Gestor aparece na área de trabalho e no menu Iniciar, com o ícone da T3.' },
    { icon: Sparkles, title: 'Entre e pronto', text: 'Mesmo e-mail e senha do site. Marque "Manter conectado" e ele abre direto nas próximas vezes.' },
];

/** Janela de app em volta da foto, para parecer o programa aberto no computador. */
function Janela({ src, alt, titulo = 'T3 Gestor' }: { src: string; alt: string; titulo?: string }) {
    return (
        <figure className="overflow-hidden border border-brand-border bg-[#0b0b0c] shadow-[0_30px_80px_-30px_rgba(255,94,0,0.35)]">
            <div className="flex items-center gap-2 border-b border-brand-border bg-[#141416] px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a3e]" aria-hidden="true" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a3e]" aria-hidden="true" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a3e]" aria-hidden="true" />
                <span className="ml-2 font-mono text-[11px] text-[#8a8a90]">{titulo}</span>
            </div>
            <img src={src} alt={alt} width={1600} height={1012} loading="lazy" decoding="async" className="block h-auto w-full" />
        </figure>
    );
}

export function DesktopApp() {
    const [tela, setTela] = useState<(typeof TELAS)[number]['id']>('negocios');
    if (DOWNLOAD_LIBERADO) return <DesktopDownload />;
    const atual = TELAS.find((t) => t.id === tela) ?? TELAS[0];

    return (
        <CrmPage
            eyebrow="Em breve · app desktop"
            title="T3 Gestor para computador"
            description="Todo o comercial e a gestão da T3 OOH e da T3 Solution numa janela própria: painel, CRM, chat, agenda e relatórios. Conheça as telas reais do app."
            actions={<Badge tone="accent">Lançamento em breve</Badge>}
        >
            {/* ============================ DESTAQUE ============================ */}
            <section className="grid items-center gap-8 border border-brand-border bg-brand-surface p-6 md:p-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
                <div className="flex flex-col gap-5">
                    <p className={eyebrowCrm}>Feito para a equipe da T3</p>
                    <h2 className="text-3xl font-light uppercase leading-tight tracking-tight text-brand-text md:text-4xl">
                        Menos abas.<br /><span className="text-brand-neon">Mais negócios fechados.</span>
                    </h2>
                    <p className="text-sm leading-relaxed text-brand-muted md:text-base">
                        O T3 Gestor junta o que hoje fica espalhado pelo navegador: o funil de vendas, o chat com quem pediu orçamento,
                        a agenda da equipe e os relatórios da reunião. Abre em segundos, usa o mesmo acesso do site e se atualiza sozinho.
                    </p>
                    <ul className="grid grid-cols-3 gap-px border border-brand-border bg-brand-border text-center">
                        {[['1 janela', 'no lugar de várias abas'], ['1 clique', 'para Excel e PDF'], ['0 suporte', 'para atualizar']].map(([n, t]) => (
                            <li key={n} className="bg-brand-background px-2 py-4">
                                <p className="font-mono text-lg text-brand-neon md:text-xl">{n}</p>
                                <p className="mt-1 text-[11px] leading-snug text-brand-muted">{t}</p>
                            </li>
                        ))}
                    </ul>
                </div>
                <Janela src="/app-desktop/painel.webp" alt="Painel do gestor do T3 Gestor com receita, funil e ocupação" titulo="T3 Gestor · Painel" />
            </section>

            {/* ============================ TELAS ============================ */}
            <Panel title="Conheça as telas">
                <div className="flex flex-col gap-5 p-5">
                    <div role="tablist" aria-label="Telas do app" className="flex flex-wrap gap-2">
                        {TELAS.map((t) => (
                            <button key={t.id} type="button" role="tab" aria-selected={tela === t.id} onClick={() => setTela(t.id)}
                                className={`border px-3 py-1.5 text-sm transition-colors ${tela === t.id ? 'border-brand-neon bg-brand-neon/10 text-brand-neon' : 'border-brand-border text-brand-muted hover:border-brand-muted hover:text-brand-text'}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-brand-muted">{atual.text}</p>
                    <Janela key={atual.id} src={atual.img} alt={`${atual.label} no T3 Gestor`} titulo={`T3 Gestor · ${atual.label}`} />
                    <p className="text-xs text-brand-muted">Fotos do app de verdade, com dados fictícios.</p>
                </div>
            </Panel>

            {/* ============================ GANHOS ============================ */}
            <section aria-labelledby="ganhos" className="flex flex-col gap-4">
                <h2 id="ganhos" className="text-lg font-light uppercase tracking-tight text-brand-text">Como ele melhora o dia a dia</h2>
                <ul className="grid gap-px border border-brand-border bg-brand-border sm:grid-cols-2 lg:grid-cols-3">
                    {GANHOS.map(({ icon: Icon, title, text }) => (
                        <li key={title} className="flex flex-col gap-3 bg-brand-surface p-6">
                            <Icon className="h-6 w-6 text-brand-neon" strokeWidth={1.5} aria-hidden="true" />
                            <p className="text-sm font-medium text-brand-text">{title}</p>
                            <p className="text-sm leading-relaxed text-brand-muted">{text}</p>
                        </li>
                    ))}
                </ul>
            </section>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                {/* ============================ ANTES E DEPOIS ============================ */}
                <Panel title="Antes e depois">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-brand-border text-left text-xs uppercase tracking-wider text-brand-muted">
                                <th scope="col" className="px-5 py-3 font-normal">Hoje</th>
                                <th scope="col" className="px-5 py-3 font-normal text-brand-neon">Com o T3 Gestor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {ANTES_DEPOIS.map(([antes, depois]) => (
                                <tr key={antes}>
                                    <td className="px-5 py-3.5 text-brand-muted">{antes}</td>
                                    <td className="px-5 py-3.5 text-brand-text">{depois}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Panel>

                {/* ============================ ATUALIZAÇÃO ============================ */}
                <Panel title="Atualiza sozinho, como um jogo">
                    <div className="flex flex-col gap-4 p-5">
                        <img src="/app-desktop/atualizacao-painel.webp" alt="Janela de atualização baixando a versão nova em segundo plano" width={720} height={669} loading="lazy" decoding="async" className="mx-auto block h-auto w-full max-w-sm border border-brand-border" />
                        <p className="flex gap-3 text-sm text-brand-muted">
                            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-brand-neon" strokeWidth={1.75} aria-hidden="true" />
                            Quando sai versão nova, o app baixa em segundo plano, mostra o andamento e avisa no Windows. Pronta, é só reiniciar, ou ela instala quando você fechar o app.
                        </p>
                    </div>
                </Panel>
            </div>

            {/* ============================ INSTALAR ============================ */}
            <Panel title="Instalar é como instalar um jogo">
                <ol className="grid gap-px bg-brand-border md:grid-cols-3">
                    {INSTALAR.map(({ icon: Icon, title, text }, i) => (
                        <li key={title} className="flex flex-col gap-3 bg-brand-surface p-6">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-2xl font-light text-brand-neon">0{i + 1}</span>
                                <Icon className="h-5 w-5 text-brand-muted" strokeWidth={1.75} aria-hidden="true" />
                            </div>
                            <p className="text-sm font-medium text-brand-text">{title}</p>
                            <p className="text-sm leading-relaxed text-brand-muted">{text}</p>
                        </li>
                    ))}
                </ol>
            </Panel>

            {/* ============================ CHAMADA ============================ */}
            <section className="flex flex-col items-start gap-5 border border-brand-neon/40 bg-brand-neon/10 p-6 md:flex-row md:items-center md:justify-between md:p-8">
                <div className="flex gap-4">
                    <BarChart3 className="mt-1 h-7 w-7 shrink-0 text-brand-neon" strokeWidth={1.5} aria-hidden="true" />
                    <div>
                        <p className="text-lg font-light uppercase tracking-tight text-brand-text">Quer o T3 Gestor na sua equipe?</p>
                        <p className="mt-1 max-w-2xl text-sm text-brand-muted">
                            O app está pronto e em fase final de testes. Fale com <span className="text-brand-text">Felipe Rabello</span> para combinar a implantação, o treinamento da equipe e a data de lançamento.
                        </p>
                    </div>
                </div>
                <Badge tone="accent">Download liberado no lançamento</Badge>
            </section>
        </CrmPage>
    );
}
