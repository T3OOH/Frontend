import { useEffect, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import type { MeetingMessage } from './tipos';
import { hora } from './util';

interface Props {
    mensagens: MeetingMessage[];
    euId: string;
    onEnviar: (texto: string) => Promise<boolean>;
}

export function PainelChat({ mensagens, euId, onEnviar }: Props) {
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [falhou, setFalhou] = useState(false);
    const fim = useRef<HTMLDivElement>(null);

    useEffect(() => { fim.current?.scrollIntoView({ block: 'end' }); }, [mensagens.length]);

    const enviar = async () => {
        const t = texto.trim();
        if (!t || enviando) return;
        setEnviando(true);
        setFalhou(false);
        const ok = await onEnviar(t);
        setEnviando(false);
        if (ok) setTexto(''); else setFalhou(true);
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" data-testid="lista-chat">
                {mensagens.length === 0 && (
                    <p className="text-sm text-ink-400 text-center mt-8">Nenhuma mensagem ainda. As mensagens do chat ficam salvas na reunião.</p>
                )}
                {mensagens.map((m, i) => {
                    const anterior = mensagens[i - 1];
                    const seguida = anterior && anterior.sender.id === m.sender.id && new Date(m.createdAt).getTime() - new Date(anterior.createdAt).getTime() < 120_000;
                    return (
                        <div key={m.id} className={seguida ? '-mt-2' : ''}>
                            {!seguida && (
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-sm font-semibold ${m.sender.id === euId ? 'text-brand-neon' : 'text-white'}`}>{m.sender.name}</span>
                                    <span className="text-[11px] font-mono text-ink-500">{hora(m.createdAt)}</span>
                                </div>
                            )}
                            <p className="text-sm text-ink-100 whitespace-pre-wrap break-words">{m.texto}</p>
                        </div>
                    );
                })}
                <div ref={fim} />
            </div>
            <div className="p-3 border-t border-ink-700">
                {falhou && <p className="text-xs text-red-400 mb-2" role="alert">Não foi possível enviar. Tente novamente.</p>}
                <div className="flex items-end gap-2">
                    <textarea
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); enviar(); } }}
                        rows={1}
                        maxLength={2000}
                        placeholder="Escreva uma mensagem"
                        aria-label="Mensagem"
                        className="flex-1 resize-none max-h-28 bg-ink-800 border border-ink-700 focus:border-brand-neon outline-none px-3 py-2.5 text-sm text-white placeholder:text-ink-500"
                    />
                    <button type="button" onClick={enviar} disabled={!texto.trim() || enviando} aria-label="Enviar mensagem" className="h-10 w-10 shrink-0 flex items-center justify-center bg-brand-neon text-ink-950 hover:bg-brand-neonHover disabled:opacity-40 disabled:hover:bg-brand-neon">
                        <SendHorizontal className="w-4 h-4" />
                    </button>
                </div>
                <p className="mt-1.5 text-[11px] text-ink-500">Enter envia, Shift+Enter quebra a linha</p>
            </div>
        </div>
    );
}
