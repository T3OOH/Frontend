import { useMemo, useState } from 'react';
import { BlocoVideo, type DadosBloco } from './BlocoVideo';
import type { Estado, Participante, UsuarioSala } from './tipos';

interface Props {
    eu: UsuarioSala;
    estadoEu: Estado;
    streamLocal: MediaStream | null;
    telaLocal: MediaStream | null;
    participantes: Participante[];
    onPararTela: () => void;
}

function colunas(n: number) {
    if (n <= 1) return 1;
    if (n <= 4) return 2;
    if (n <= 6) return 3;
    return 4;
}

export function GradeVideos({ eu, estadoEu, streamLocal, telaLocal, participantes, onPararTela }: Props) {
    const [fixado, setFixado] = useState<string | null>(null);

    const blocos = useMemo(() => {
        const lista: DadosBloco[] = [];
        for (const p of participantes) {
            lista.push({ chave: `cam:${p.socketId}`, pessoaId: p.user.id, nome: p.user.name, tipo: 'camera', stream: p.camStream, comVideo: p.estado.cam && !!p.camStream, mic: p.estado.mic, eu: false });
            if (p.estado.tela && p.telaStream) {
                lista.push({ chave: `tela:${p.socketId}`, pessoaId: p.user.id, nome: p.user.name, tipo: 'tela', stream: p.telaStream, comVideo: true, mic: true, eu: false });
            }
        }
        const meus: DadosBloco[] = [{ chave: 'cam:eu', pessoaId: eu.id, nome: eu.name, tipo: 'camera', stream: streamLocal, comVideo: estadoEu.cam, mic: estadoEu.mic, eu: true }];
        if (telaLocal) meus.push({ chave: 'tela:eu', pessoaId: eu.id, nome: eu.name, tipo: 'tela', stream: telaLocal, comVideo: true, mic: true, eu: true });
        return [...lista, ...meus];
    }, [participantes, eu, estadoEu.cam, estadoEu.mic, streamLocal, telaLocal]);

    // Destaque: o que o usuário fixou; senão, a tela de alguém (a minha só se for a única)
    const destaque = useMemo(() => {
        const escolhido = fixado && blocos.find((b) => b.chave === fixado);
        if (escolhido) return escolhido;
        return blocos.find((b) => b.tipo === 'tela' && !b.eu) ?? blocos.find((b) => b.tipo === 'tela') ?? null;
    }, [fixado, blocos]);

    const alternar = (chave: string) => setFixado((f) => (f === chave ? null : chave));

    if (destaque) {
        const outros = blocos.filter((b) => b.chave !== destaque.chave);
        return (
            <div className="w-full h-full flex flex-col lg:flex-row gap-2 p-2 pb-24 min-h-0">
                <div className="flex-1 min-h-0 min-w-0">
                    <BlocoVideo
                        key={destaque.chave}
                        bloco={destaque}
                        destaque
                        fixado={fixado === destaque.chave}
                        ocultarVideo={destaque.tipo === 'tela' && destaque.eu}
                        onClick={() => alternar(destaque.chave)}
                        onPararTela={destaque.eu ? onPararTela : undefined}
                    />
                </div>
                {outros.length > 0 && (
                    <div className="flex lg:flex-col gap-2 overflow-auto shrink-0 lg:w-56 lg:h-full">
                        {outros.map((b) => (
                            <BlocoVideo key={b.chave} bloco={b} pequeno fixado={fixado === b.chave} onClick={() => alternar(b.chave)} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const cols = colunas(blocos.length);
    const linhas = Math.ceil(blocos.length / cols);
    return (
        <div
            className="w-full h-full grid gap-2 p-2 pb-24"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${linhas}, minmax(0, 1fr))` }}
        >
            {blocos.map((b) => (
                <BlocoVideo key={b.chave} bloco={b} fixado={false} onClick={() => alternar(b.chave)} />
            ))}
        </div>
    );
}
