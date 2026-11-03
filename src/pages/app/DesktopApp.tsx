import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, KeyRound, Loader2, MonitorDown, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/axios';
import { useToast } from '@/contexts/ToastContext';
import { CrmPage, Panel, Stat, Badge, EmptyState, Skeleton } from '@/components/app/ui';
import { crmBtn, eyebrowCrm, formatDate } from '@/components/app/tokens';

interface DesktopFile {
    id: number;
    name: string;
    size: number;
    platform: 'windows' | 'macos' | 'linux';
    kind: 'instalador' | 'portatil';
    /** SHA-256 do arquivo (hex); null se o GitHub não informou. */
    sha256?: string | null;
}

interface DesktopRelease {
    version: string;
    name: string;
    publishedAt: string;
    notes: string;
    files: DesktopFile[];
}

type Status = 'loading' | 'ready' | 'empty' | 'unconfigured' | 'error';

const PLATFORM: Record<DesktopFile['platform'], string> = { windows: 'Windows', macos: 'macOS', linux: 'Linux' };
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} MB`;

const STEPS = [
    { title: 'Baixe o arquivo', text: 'Use o botão de download. O link é pessoal e vale por poucos minutos.' },
    { title: 'Instale ou extraia', text: 'O instalador (.msi) instala só para o seu usuário, sem pedir senha de administrador. Com o .zip, extraia a pasta onde quiser, como em Documentos.' },
    { title: 'Abra o T3 Gestor', text: 'Pelo atalho do menu Iniciar ou pelo arquivo "T3 Gestor.exe" da pasta extraída.' },
    { title: 'Entre com a sua conta', text: 'Mesmo e-mail e senha do site. Marque "Manter conectado" para o app abrir direto nas próximas vezes.' },
];

const FEATURES = [
    { area: 'Visão geral', items: 'Painel do gestor com vendas, funil, previsão e ocupação dos painéis' },
    { area: 'CRM', items: 'Negócios em kanban, fila de leads, clientes e o projeto da T3 Solution' },
    { area: 'Atendimento', items: 'Chat em tempo real com os clientes e agenda da equipe' },
    { area: 'Catálogo', items: 'Painéis, pedidos, cupons e conteúdo do site' },
    { area: 'Gestão', items: 'Relatórios em Excel e PDF, tráfego do site, usuários e registro de auditoria' },
];

/**
 * Página privada da equipe para baixar o app desktop (T3 Gestor). A versão e os arquivos vêm
 * das releases privadas do app; cada download pede à API um link temporário.
 */
export function DesktopApp() {
    const { addToast } = useToast();
    const [release, setRelease] = useState<DesktopRelease | null>(null);
    const [status, setStatus] = useState<Status>('loading');
    const [busy, setBusy] = useState<number | null>(null);

    const load = useCallback(async () => {
        setStatus('loading');
        try {
            const { data } = await api.get<DesktopRelease>('/downloads/desktop');
            setRelease(data);
            setStatus(data.files.length ? 'ready' : 'empty');
        } catch (error: unknown) {
            const code = (error as { response?: { status?: number } }).response?.status;
            setStatus(code === 404 ? 'empty' : code === 503 ? 'unconfigured' : 'error');
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    // Arquivo principal: instalador do Windows; se não houver, a versão portátil (.zip)
    const main = useMemo(() => {
        const windows = release?.files.filter((f) => f.platform === 'windows') ?? [];
        return windows.find((f) => f.kind === 'instalador') ?? windows[0] ?? release?.files[0] ?? null;
    }, [release]);

    const download = async (file: DesktopFile) => {
        setBusy(file.id);
        try {
            const { data } = await api.get<{ url: string }>(`/downloads/desktop/arquivos/${file.id}/link`);
            window.location.assign(data.url);
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
            addToast(message || 'Não foi possível gerar o link agora. Tente de novo.', 'error');
        } finally {
            setBusy(null);
        }
    };

    const downloadButton = (file: DesktopFile, label: string, primary = true) => (
        <button type="button" onClick={() => download(file)} disabled={busy !== null} className={primary ? crmBtn.primary : crmBtn.secondary}>
            {busy === file.id
                ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Gerando link</>
                : <><Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> {label}</>}
        </button>
    );

    return (
        <CrmPage
            eyebrow="Ferramentas da equipe"
            title="T3 Gestor para computador"
            description="O app desktop da gestão e do comercial: painel, CRM, chat, agenda e catálogo numa janela própria, com o mesmo acesso do site."
            actions={<button type="button" onClick={load} className={crmBtn.secondary}><RefreshCw className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Atualizar</button>}
        >
            {status === 'loading' && (
                <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
            )}

            {status === 'empty' && (
                <EmptyState title="Ainda não há versão publicada" text="Assim que a primeira versão do app for publicada, o download aparece aqui para toda a equipe." />
            )}
            {status === 'unconfigured' && (
                <EmptyState title="Download ainda não configurado" text="O servidor ainda não tem acesso às versões do app. Fale com o administrador do sistema." />
            )}
            {status === 'error' && (
                <EmptyState
                    title="Não foi possível carregar o app"
                    text="Confira a internet e tente de novo em instantes."
                    action={<button type="button" onClick={load} className={crmBtn.secondary}><RefreshCw className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Tentar de novo</button>}
                />
            )}

            {status === 'ready' && release && main && (
                <>
                    {/* ============================ DOWNLOAD ============================ */}
                    <section className="grid gap-px border border-brand-border bg-brand-border lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                        <div className="flex flex-col gap-6 bg-brand-surface p-6 md:p-8">
                            <div className="flex items-center gap-4">
                                <span className="flex h-14 w-14 shrink-0 items-center justify-center bg-brand-neon text-ink-950">
                                    <MonitorDown className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
                                </span>
                                <div className="min-w-0">
                                    <p className={eyebrowCrm}>Versão {release.version}</p>
                                    <h2 className="mt-1 text-xl font-light uppercase tracking-tight text-brand-text md:text-2xl">{release.name}</h2>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {downloadButton(main, `Baixar para ${PLATFORM[main.platform]}`)}
                                <span className="text-xs text-brand-muted">{main.name} · {mb(main.size)}</span>
                            </div>
                            {main.sha256 && (
                                <p className="break-all font-mono text-[11px] leading-relaxed text-brand-muted" title="Confira com: Get-FileHash arquivo.msi">
                                    SHA-256 {main.sha256}
                                </p>
                            )}
                            {release.files.length > 1 && (
                                <div className="flex flex-col gap-2 border-t border-brand-border pt-5">
                                    <p className={eyebrowCrm}>Outros arquivos</p>
                                    <ul className="flex flex-col divide-y divide-brand-border">
                                        {release.files.filter((f) => f.id !== main.id).map((f) => (
                                            <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                                                <span className="min-w-0 text-sm text-brand-text">
                                                    {f.name}{' '}
                                                    <Badge tone="muted">{PLATFORM[f.platform]} · {f.kind === 'instalador' ? 'instalador' : 'portátil'}</Badge>
                                                </span>
                                                {downloadButton(f, mb(f.size), false)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-px bg-brand-border lg:grid-cols-1">
                            <Stat label="Versão" value={release.version} accent />
                            <Stat label="Publicada em" value={formatDate(release.publishedAt)} />
                            <Stat label="Tamanho" value={mb(main.size)} hint="Java já incluso: não precisa instalar nada além do app" />
                        </div>
                    </section>

                    {/* ============================ COMO INSTALAR ============================ */}
                    <Panel title="Como instalar">
                        <ol className="grid gap-px bg-brand-border sm:grid-cols-2 lg:grid-cols-4">
                            {STEPS.map((step, i) => (
                                <li key={step.title} className="flex flex-col gap-2 bg-brand-surface p-5">
                                    <span className="font-mono text-2xl font-light text-brand-neon">0{i + 1}</span>
                                    <p className="text-sm font-medium text-brand-text">{step.title}</p>
                                    <p className="text-sm text-brand-muted">{step.text}</p>
                                </li>
                            ))}
                        </ol>
                    </Panel>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* ============================ O QUE TEM ============================ */}
                        <Panel title="O que tem no app">
                            <dl className="divide-y divide-brand-border">
                                {FEATURES.map((f) => (
                                    <div key={f.area} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[8rem_1fr] sm:gap-4">
                                        <dt className="text-sm font-medium text-brand-text">{f.area}</dt>
                                        <dd className="text-sm text-brand-muted">{f.items}</dd>
                                    </div>
                                ))}
                            </dl>
                        </Panel>

                        {/* ============================ REQUISITOS E ACESSO ============================ */}
                        <Panel title="Requisitos e acesso">
                            <ul className="flex flex-col divide-y divide-brand-border text-sm">
                                <li className="flex gap-3 px-5 py-3.5">
                                    <MonitorDown className="mt-0.5 h-4 w-4 shrink-0 text-brand-muted" strokeWidth={1.75} aria-hidden="true" />
                                    <span className="text-brand-muted"><span className="text-brand-text">Windows 10 ou 11 (64 bits)</span>, internet e cerca de 250 MB livres.</span>
                                </li>
                                <li className="flex gap-3 px-5 py-3.5">
                                    <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-brand-muted" strokeWidth={1.75} aria-hidden="true" />
                                    <span className="text-brand-muted">Instalado pelo .msi, o app <span className="text-brand-text">se atualiza sozinho</span>: quando sai versão nova, aparece "Atualizar" na barra de cima. O arquivo é conferido (SHA-256) antes de instalar.</span>
                                </li>
                                <li className="flex gap-3 px-5 py-3.5">
                                    <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-brand-muted" strokeWidth={1.75} aria-hidden="true" />
                                    <span className="text-brand-muted">Entre com <span className="text-brand-text">e-mail e senha</span>. O botão do Google não funciona dentro do app: se sua conta só usa o Google, crie uma senha em Meu perfil → Segurança.</span>
                                </li>
                                <li className="flex gap-3 px-5 py-3.5">
                                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-muted" strokeWidth={1.75} aria-hidden="true" />
                                    <span className="text-brand-muted">Uso interno da equipe. O app aparece como um aparelho em <span className="text-brand-text">Meu perfil → Segurança</span>, onde a sessão pode ser encerrada a qualquer momento.</span>
                                </li>
                            </ul>
                        </Panel>
                    </div>

                    {release.notes.trim() && (
                        <Panel title={`Novidades da versão ${release.version}`}>
                            <p className="whitespace-pre-line px-5 py-4 text-sm leading-relaxed text-brand-muted">{release.notes}</p>
                        </Panel>
                    )}
                </>
            )}
        </CrmPage>
    );
}
