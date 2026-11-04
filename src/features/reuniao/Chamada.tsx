import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { AudiosRemotos } from './AudiosRemotos';
import { BarraControles } from './BarraControles';
import { GradeVideos } from './GradeVideos';
import { ModalConfig } from './ModalConfig';
import { PainelChat } from './PainelChat';
import { PainelParticipantes } from './PainelParticipantes';
import type { useReuniao } from './useReuniao';

type Reuniao = ReturnType<typeof useReuniao>;
type Painel = 'chat' | 'participantes' | null;

export function Chamada({ r }: { r: Reuniao }) {
    const { acoes, estado, eu, participantes, mensagens, meeting } = r;
    const [painel, setPainel] = useState<Painel>(null);
    const [config, setConfig] = useState(false);
    const [lidasAte, setLidasAte] = useState(0);

    // Painel do chat aberto: tudo o que chegou conta como lido
    useEffect(() => { if (painel === 'chat') setLidasAte(mensagens.length); }, [painel, mensagens.length]);

    const naoLidas = painel === 'chat' ? 0
        : mensagens.slice(Math.max(lidasAte, r.nHistorico)).filter((m) => m.sender.id !== eu.id).length;

    // Atalhos: Ctrl+D microfone, Ctrl+E câmera (o navegador usaria para favoritos e busca)
    useEffect(() => {
        const aoTeclar = (e: KeyboardEvent) => {
            if (!e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return;
            const k = e.key.toLowerCase();
            if (k === 'd') { e.preventDefault(); acoes.alternarMic(); }
            else if (k === 'e') { e.preventDefault(); acoes.alternarCam(); }
        };
        window.addEventListener('keydown', aoTeclar);
        return () => window.removeEventListener('keydown', aoTeclar);
        // eslint-disable-next-line
    }, []);

    const alternarPainel = (p: 'chat' | 'participantes') => setPainel((atual) => (atual === p ? null : p));

    return (
        <div className="fixed inset-0 bg-ink-950 text-ink-100 font-sans flex overflow-hidden">
            <div className="relative flex-1 min-w-0 flex flex-col">
                <header className="shrink-0 h-12 px-4 flex items-center justify-between border-b border-ink-800">
                    <h1 className="text-sm font-semibold text-white truncate">{meeting?.title}</h1>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-ink-400 shrink-0 ml-4">{participantes.length + 1} na chamada</span>
                </header>

                <main className="flex-1 min-h-0">
                    <GradeVideos
                        eu={eu}
                        estadoEu={estado}
                        streamLocal={r.streamLocal}
                        telaLocal={r.telaLocal}
                        participantes={participantes}
                        onPararTela={acoes.alternarTela}
                    />
                </main>

                {r.fase === 'reconectando' && (
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-ink-900 border border-brand-neon px-4 py-2.5 text-sm text-white" role="status">
                        <Loader2 className="w-4 h-4 animate-spin text-brand-neon" aria-hidden="true" />
                        Conexão perdida. Reconectando...
                    </div>
                )}
                {r.aviso && (
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-ink-900 border border-ink-600 px-4 py-2.5 text-sm text-white" role="alert">{r.aviso}</div>
                )}

                <BarraControles
                    mic={estado.mic}
                    cam={estado.cam}
                    tela={estado.tela}
                    painel={painel}
                    naoLidas={naoLidas}
                    totalParticipantes={participantes.length + 1}
                    ehAnfitriao={r.ehAnfitriao}
                    onMic={acoes.alternarMic}
                    onCam={acoes.alternarCam}
                    onTela={acoes.alternarTela}
                    onConfig={() => setConfig(true)}
                    onPainel={alternarPainel}
                    onSair={acoes.sair}
                    onEncerrar={acoes.encerrarParaTodos}
                />

                {config && (
                    <ModalConfig
                        dispositivos={r.dispositivos}
                        escolhidos={r.escolhidos}
                        onMic={acoes.trocarMic}
                        onCam={acoes.trocarCam}
                        onSaida={acoes.trocarSaida}
                        onFechar={() => setConfig(false)}
                    />
                )}
            </div>

            {painel && (
                <aside className="w-full sm:w-80 shrink-0 bg-ink-900 border-l border-ink-800 flex flex-col absolute sm:static inset-0 z-30" aria-label={painel === 'chat' ? 'Chat da chamada' : 'Participantes'}>
                    <div className="shrink-0 h-12 px-4 flex items-center justify-between border-b border-ink-800">
                        <h2 className="text-sm font-semibold text-white">{painel === 'chat' ? 'Chat da chamada' : `Participantes (${participantes.length + 1})`}</h2>
                        <button type="button" onClick={() => setPainel(null)} aria-label="Fechar painel" className="p-1.5 text-ink-400 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="flex-1 min-h-0">
                        {painel === 'chat'
                            ? <PainelChat mensagens={mensagens} euId={eu.id} onEnviar={acoes.enviarMensagem} />
                            : <PainelParticipantes eu={eu} estadoEu={estado} participantes={participantes} anfitriaoId={meeting?.host.id} />}
                    </div>
                </aside>
            )}

            <AudiosRemotos participantes={participantes} saidaId={r.escolhidos.saidaId} />
        </div>
    );
}
