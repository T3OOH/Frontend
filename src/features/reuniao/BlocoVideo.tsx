import { useEffect, useRef } from 'react';
import { MicOff, Monitor, Pin } from 'lucide-react';
import { Avatar } from './Avatar';
import { useNivelAudio } from './audio';

export interface DadosBloco {
    chave: string;
    pessoaId: string;
    nome: string;
    tipo: 'camera' | 'tela';
    stream: MediaStream | null;
    /** Câmera ligada (ou tela sendo compartilhada): mostra o vídeo; senão, as iniciais. */
    comVideo: boolean;
    mic: boolean;
    eu: boolean;
}

interface Props {
    bloco: DadosBloco;
    fixado: boolean;
    destaque?: boolean;
    pequeno?: boolean;
    /** Esconde o vídeo (própria tela em destaque: evita o efeito espelho). */
    ocultarVideo?: boolean;
    onClick: () => void;
    onPararTela?: () => void;
}

export function BlocoVideo({ bloco, fixado, destaque, pequeno, ocultarVideo, onClick, onPararTela }: Props) {
    const ref = useRef<HTMLVideoElement>(null);
    const { falando } = useNivelAudio(bloco.tipo === 'camera' ? bloco.stream : null);
    const anel = bloco.tipo === 'camera' && falando && bloco.mic;
    const mostrarVideo = bloco.comVideo && !ocultarVideo;

    useEffect(() => {
        const v = ref.current;
        if (!v) return;
        if (v.srcObject !== bloco.stream) v.srcObject = bloco.stream;
        if (bloco.stream) v.play().catch(() => {});
    }, [bloco.stream, mostrarVideo]);

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
            aria-label={`${bloco.nome}${bloco.tipo === 'tela' ? ' (tela)' : ''}${fixado ? ', fixado' : ''}`}
            data-falando={anel ? 'sim' : 'nao'}
            data-bloco={bloco.chave}
            className={`group relative min-h-0 min-w-0 overflow-hidden bg-ink-850 cursor-pointer outline-none transition-shadow duration-150 focus-visible:ring-2 focus-visible:ring-white/60 ${pequeno ? 'shrink-0 w-44 h-28 lg:w-full lg:h-auto lg:aspect-video' : 'w-full h-full'}`}
        >
            {mostrarVideo && (
                <video
                    ref={ref}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full ${bloco.tipo === 'tela' ? 'object-contain bg-ink-950' : 'object-cover'} ${bloco.eu && bloco.tipo === 'camera' ? '-scale-x-100' : ''}`}
                />
            )}

            {!mostrarVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
                    {bloco.tipo === 'camera' && <Avatar id={bloco.pessoaId} nome={bloco.nome} tamanho={pequeno ? 44 : destaque ? 120 : 88} />}
                    {bloco.tipo === 'tela' && (
                        <>
                            <Monitor className="w-10 h-10 text-ink-400" aria-hidden="true" />
                            <p className="text-sm text-ink-300">Você está compartilhando sua tela</p>
                            {onPararTela && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onPararTela(); }}
                                    className="mt-1 px-4 py-2 bg-white text-ink-950 text-xs font-bold uppercase tracking-widest hover:bg-ink-100"
                                >
                                    Parar compartilhamento
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

            <div className={`pointer-events-none absolute inset-0 transition-shadow duration-150 ${anel ? 'shadow-[inset_0_0_0_3px_#FF5E00]' : 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'}`} aria-hidden="true" />

            <div className="absolute left-2 bottom-2 max-w-[calc(100%-1rem)] flex items-center gap-1.5 bg-ink-950/75 px-2 py-1 text-xs text-white">
                {bloco.tipo === 'camera' && !bloco.mic && <MicOff className="w-3.5 h-3.5 text-red-400 shrink-0" aria-label="Microfone desligado" />}
                {bloco.tipo === 'tela' && <Monitor className="w-3.5 h-3.5 text-brand-neon shrink-0" aria-hidden="true" />}
                <span className="truncate">{bloco.nome}{bloco.eu && bloco.tipo === 'camera' && bloco.nome !== 'Você' ? ' (você)' : ''}{bloco.tipo === 'tela' && !bloco.eu ? ' · tela' : ''}</span>
            </div>

            <div className={`absolute right-2 top-2 p-1.5 bg-ink-950/75 text-white transition-opacity ${fixado ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`} title={fixado ? 'Desafixar' : 'Fixar em destaque'}>
                <Pin className={`w-3.5 h-3.5 ${fixado ? 'text-brand-neon' : ''}`} aria-hidden="true" />
            </div>
        </div>
    );
}
