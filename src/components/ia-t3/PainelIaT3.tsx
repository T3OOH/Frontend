import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, UserRound } from 'lucide-react';
import { assistenteService, Destino, InicioIa, MensagemIa, Tema } from '@/services/assistente.service';
import { apiErrorMessage } from '@/lib/upload';

/** Item da conversa na tela: mensagem, sugestão de encaminhar ou confirmação. */
type Item =
    | { tipo: 'msg'; de: 'visitante' | 'ia'; texto: string }
    | { tipo: 'encaminhar'; destino: Destino; motivo: string }
    | { tipo: 'ok'; texto: string };

interface Estado { tema: string | null; itens: Item[] }
const CHAVE = '@t3:ia-t3';
const ler = (): Estado => {
    try { return JSON.parse(sessionStorage.getItem(CHAVE) || '') as Estado; } catch { return { tema: null, itens: [] }; }
};
const salvar = (e: Estado) => { try { sessionStorage.setItem(CHAVE, JSON.stringify(e)); } catch { /* sem storage */ } };

const caixa = 'w-full border border-white/15 bg-ink-900 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:border-brand-neon focus:outline-none';

/**
 * Chat da IA T3: o visitante escolhe o assunto (caixas), lê as respostas prontas ou escreve a
 * dúvida para a IA. Se a IA não resolver, oferece falar com o comercial, a gestão ou o suporte
 * técnico (formulário curto). A conversa fica na aba (sessionStorage) até fechar o navegador.
 */
export default function PainelIaT3({ aberto, onFechar, noMapa }: { aberto: boolean; onFechar: () => void; noMapa: boolean }) {
    const [inicio, setInicio] = useState<InicioIa | null>(null);
    const [erroInicio, setErroInicio] = useState(false);
    const [estado, setEstado] = useState<Estado>(ler);
    const [texto, setTexto] = useState('');
    const [pensando, setPensando] = useState(false);
    const [form, setForm] = useState<{ destino: Destino; motivo: string } | null>(null);
    const fim = useRef<HTMLDivElement>(null);
    const campo = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!aberto || inicio) return;
        assistenteService.inicio().then(setInicio).catch(() => setErroInicio(true));
    }, [aberto, inicio]);
    useEffect(() => { salvar(estado); fim.current?.scrollIntoView({ block: 'end' }); }, [estado, pensando, form]);
    // Esc fecha o chat
    useEffect(() => {
        if (!aberto) return;
        const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar(); };
        window.addEventListener('keydown', tecla);
        return () => window.removeEventListener('keydown', tecla);
    }, [aberto, onFechar]);

    const tema: Tema | undefined = inicio?.temas.find((t) => t.id === estado.tema);
    const mensagens = (itens: Item[]): MensagemIa[] => itens.filter((i): i is Extract<Item, { tipo: 'msg' }> => i.tipo === 'msg').map(({ de, texto: t }) => ({ de, texto: t }));
    const add = (...novos: Item[]) => setEstado((e) => ({ ...e, itens: [...e.itens, ...novos] }));

    const escolherTema = (t: Tema) => {
        setEstado({ tema: t.id, itens: [{ tipo: 'msg', de: 'visitante', texto: t.titulo }, { tipo: 'msg', de: 'ia', texto: t.id === 'outro' ? 'Conte sua dúvida que eu tento ajudar.' : 'Veja as perguntas mais comuns ou escreva a sua.' }] });
        setForm(null);
        setTimeout(() => campo.current?.focus(), 50);
    };

    const enviar = async (e?: FormEvent) => {
        e?.preventDefault();
        const pergunta = texto.trim();
        if (!pergunta || !tema || pensando) return;
        setTexto('');
        const itens: Item[] = [...estado.itens, { tipo: 'msg', de: 'visitante', texto: pergunta }];
        setEstado((s) => ({ ...s, itens }));
        setPensando(true);
        try {
            const r = await assistenteService.perguntar(tema.id, mensagens(itens));
            add({ tipo: 'msg', de: 'ia', texto: r.resposta }, ...(r.encaminhar !== 'nenhum' ? [{ tipo: 'encaminhar' as const, destino: r.encaminhar, motivo: r.motivo }] : []));
        } catch (error) {
            add({ tipo: 'msg', de: 'ia', texto: apiErrorMessage(error, 'Não consegui responder agora. Posso te passar para a nossa equipe.') }, { tipo: 'encaminhar', destino: tema.destino, motivo: 'Falha ao falar com a IA' });
        } finally {
            setPensando(false);
        }
    };

    return (
        <section
            role="dialog"
            aria-label="Chat de dúvidas da IA T3"
            hidden={!aberto}
            className={`fixed right-4 z-[10000] flex w-[calc(100vw-2rem)] max-w-sm flex-col border border-white/15 bg-ink-950 text-ink-100 shadow-[0_24px_60px_rgba(0,0,0,0.6)] lg:bottom-28 lg:right-8 ${noMapa ? 'bottom-[15.5rem] h-[min(60vh,520px)]' : 'bottom-24 h-[min(72vh,600px)]'}`}
        >
            <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                {estado.tema && (
                    <button type="button" onClick={() => { setEstado({ tema: null, itens: [] }); setForm(null); }} className="-ml-1 p-1 text-ink-400 hover:text-ink-100" aria-label="Trocar de assunto" title="Trocar de assunto">
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                )}
                <img src="/t3-logo-160.webp" alt="" width={28} height={28} className="h-7 w-7" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight">{inicio?.nome ?? 'IA T3'}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">Assistente da T3 LED</p>
                </div>
                <button type="button" onClick={onFechar} className="p-1 text-sm text-ink-400 hover:text-ink-100" aria-label="Fechar">Fechar</button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
                {erroInicio && <p className="text-sm text-ink-300">Não foi possível abrir o chat agora. Use a página de contato ou tente de novo em instantes.</p>}
                {!inicio && !erroInicio && <p className="animate-pulse text-sm text-ink-400">Abrindo…</p>}

                {inicio && (
                    <>
                        <Balao de="ia">{inicio.saudacao}</Balao>
                        {!estado.tema && (
                            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Assunto da dúvida">
                                {inicio.temas.map((t) => (
                                    <button key={t.id} type="button" onClick={() => escolherTema(t)} className="border border-white/15 px-3 py-2.5 text-left text-sm text-ink-100 transition-colors hover:border-brand-neon hover:text-brand-neon">
                                        {t.titulo}
                                    </button>
                                ))}
                            </div>
                        )}
                        {estado.itens.map((item, i) =>
                            item.tipo === 'msg' ? <Balao key={i} de={item.de}>{item.texto}</Balao>
                                : item.tipo === 'ok' ? <p key={i} className="border border-brand-neon/40 bg-brand-neon/10 px-3 py-2 text-sm text-ink-100">{item.texto}</p>
                                : (
                                    <div key={i} className="flex flex-wrap gap-2">
                                        <button type="button" onClick={() => setForm({ destino: item.destino, motivo: item.motivo })} className="bg-brand-neon px-3 py-2 text-sm font-semibold text-ink-950 hover:brightness-110">
                                            {inicio.destinos[item.destino].titulo}
                                        </button>
                                    </div>
                                ))}
                        {tema && !form && tema.respostas.length > 0 && (
                            <div className="flex flex-col gap-1.5" role="group" aria-label="Perguntas comuns">
                                {tema.respostas.filter((r) => !estado.itens.some((it) => it.tipo === 'msg' && it.texto === r.pergunta)).map((r) => (
                                    <button key={r.pergunta} type="button" onClick={() => add({ tipo: 'msg', de: 'visitante', texto: r.pergunta }, { tipo: 'msg', de: 'ia', texto: r.resposta })} className="border border-white/10 px-3 py-2 text-left text-sm text-ink-200 hover:border-white/30">
                                        {r.pergunta}
                                    </button>
                                ))}
                            </div>
                        )}
                        {pensando && <Balao de="ia"><span className="animate-pulse">Pensando…</span></Balao>}
                        {form && tema && (
                            <FormEncaminhar
                                destino={form.destino}
                                titulo={inicio.destinos[form.destino].titulo}
                                texto={inicio.destinos[form.destino].texto}
                                onCancelar={() => setForm(null)}
                                onEnviar={async (dados) => {
                                    const r = await assistenteService.encaminhar({ ...dados, destino: form.destino, tema: tema.id, motivo: form.motivo, mensagens: mensagens(estado.itens) });
                                    setForm(null);
                                    add({ tipo: 'ok', texto: `Pronto! Protocolo #${r.protocolo}. ${inicio.destinos[form.destino].texto} Responderemos pelo WhatsApp informado.` });
                                }}
                            />
                        )}
                    </>
                )}
                <div ref={fim} />
            </div>

            {tema && !form && (
                <footer className="border-t border-white/10 p-3">
                    <form onSubmit={enviar} className="flex items-end gap-2">
                        <label htmlFor="ia-t3-texto" className="sr-only">Sua dúvida</label>
                        <textarea
                            id="ia-t3-texto"
                            ref={campo}
                            rows={1}
                            maxLength={1000}
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void enviar(); } }}
                            placeholder="Escreva sua dúvida…"
                            className={`${caixa} max-h-28 resize-none`}
                        />
                        <button type="submit" disabled={!texto.trim() || pensando} className="flex h-10 w-10 shrink-0 items-center justify-center bg-brand-neon text-ink-950 disabled:opacity-40" aria-label="Enviar">
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                    <button type="button" onClick={() => setForm({ destino: tema.destino, motivo: 'Pediu para falar com uma pessoa' })} className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-100">
                        <UserRound className="h-3.5 w-3.5" /> Falar com uma pessoa
                    </button>
                </footer>
            )}
        </section>
    );
}

function Balao({ de, children }: { de: 'visitante' | 'ia'; children: React.ReactNode }) {
    return (
        <div className={`flex ${de === 'visitante' ? 'justify-end' : 'justify-start'}`}>
            <p className={`max-w-[85%] whitespace-pre-line px-3 py-2 text-sm leading-relaxed ${de === 'visitante' ? 'bg-brand-neon text-ink-950' : 'border border-white/10 bg-ink-900 text-ink-100'}`}>{children}</p>
        </div>
    );
}

function FormEncaminhar({ destino, titulo, texto, onCancelar, onEnviar }: {
    destino: Destino;
    titulo: string;
    texto: string;
    onCancelar: () => void;
    onEnviar: (d: { nome: string; telefone: string; email?: string; empresa?: string; site?: string }) => Promise<void>;
}) {
    const [d, setD] = useState({ nome: '', telefone: '', email: '', empresa: '', site: '' });
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');
    const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => setD((x) => ({ ...x, [k]: e.target.value }));

    const enviar = async (e: FormEvent) => {
        e.preventDefault();
        setErro('');
        setEnviando(true);
        try {
            await onEnviar({ nome: d.nome, telefone: d.telefone, email: d.email || undefined, empresa: d.empresa || undefined, site: d.site || undefined });
        } catch (error) {
            setErro(apiErrorMessage(error, 'Não foi possível enviar agora. Tente de novo.'));
        } finally {
            setEnviando(false);
        }
    };

    return (
        <form onSubmit={enviar} className="space-y-2 border border-white/15 bg-ink-900 p-3">
            <p className="text-sm font-semibold">{titulo}</p>
            <p className="text-xs text-ink-400">{texto} A conversa vai junto.</p>
            <input aria-label="Seu nome" required maxLength={120} value={d.nome} onChange={set('nome')} placeholder="Seu nome" className={caixa} autoComplete="name" />
            <input aria-label="WhatsApp" required minLength={8} maxLength={30} value={d.telefone} onChange={set('telefone')} placeholder="WhatsApp com DDD" className={caixa} inputMode="tel" autoComplete="tel" />
            <input aria-label="E-mail (opcional)" type="email" maxLength={160} value={d.email} onChange={set('email')} placeholder="E-mail (opcional)" className={caixa} autoComplete="email" />
            {destino === 'comercial' && <input aria-label="Empresa (opcional)" maxLength={120} value={d.empresa} onChange={set('empresa')} placeholder="Empresa (opcional)" className={caixa} autoComplete="organization" />}
            {/* Campo-isca: escondido de pessoas */}
            <input tabIndex={-1} aria-hidden="true" autoComplete="off" value={d.site} onChange={set('site')} name="site" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
            {erro && <p className="text-xs text-red-400" role="alert">{erro}</p>}
            <div className="flex gap-2 pt-1">
                <button type="submit" disabled={enviando} className="bg-brand-neon px-3 py-2 text-sm font-semibold text-ink-950 disabled:opacity-50">{enviando ? 'Enviando…' : 'Enviar'}</button>
                <button type="button" onClick={onCancelar} className="px-3 py-2 text-sm text-ink-300 hover:text-ink-100">Agora não</button>
            </div>
        </form>
    );
}
