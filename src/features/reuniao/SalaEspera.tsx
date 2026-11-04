import { useEffect, useRef } from 'react';
import { Camera, CameraOff, Mic, MicOff, TriangleAlert } from 'lucide-react';
import { Avatar } from './Avatar';
import { useNivelAudio } from './audio';
import { SeletoresDispositivos } from './SeletoresDispositivos';
import type { Dispositivos, DispositivosEscolhidos, Estado, Meeting, ProblemaMidia, UsuarioSala } from './tipos';

interface Props {
    meeting: Meeting;
    eu: UsuarioSala;
    estado: Estado;
    streamLocal: MediaStream | null;
    temMic: boolean;
    temCam: boolean;
    pedindoMidia: boolean;
    problemas: { mic: ProblemaMidia | null; cam: ProblemaMidia | null };
    dispositivos: Dispositivos;
    escolhidos: DispositivosEscolhidos;
    onMic: () => void;
    onCam: () => void;
    onTrocarMic: (id: string) => void;
    onTrocarCam: (id: string) => void;
    onTrocarSaida: (id: string) => void;
    onEntrar: () => void;
}

function textoProblema(tipo: 'microfone' | 'câmera', p: ProblemaMidia): string {
    switch (p) {
        case 'negada': return `O navegador bloqueou o acesso ao ${tipo}. Libere a permissão no ícone ao lado do endereço e clique no botão para tentar de novo.`;
        case 'ausente': return `Nenhum ${tipo} foi encontrado neste computador.`;
        case 'ocupado': return `O ${tipo} está em uso por outro programa. Feche-o e tente de novo.`;
        case 'indisponivel': return `Este navegador não permite usar o ${tipo} nesta página (é preciso uma conexão segura).`;
        default: return `Não foi possível usar o ${tipo}.`;
    }
}

export function SalaEspera(p: Props) {
    const video = useRef<HTMLVideoElement>(null);
    const { nivel } = useNivelAudio(p.estado.mic ? p.streamLocal : null);

    useEffect(() => {
        const v = video.current;
        if (!v) return;
        v.srcObject = p.estado.cam ? p.streamLocal : null;
        if (p.estado.cam) v.play().catch(() => {});
    }, [p.streamLocal, p.estado.cam]);

    const convidados = [
        { id: p.meeting.host.id, name: p.meeting.host.name, anfitriao: true },
        ...p.meeting.participants.filter((u) => u.id !== p.meeting.host.id).map((u) => ({ id: u.id, name: u.name, anfitriao: false })),
    ];
    const semNada = !p.temMic && !p.temCam && !p.pedindoMidia;
    const aviso = [
        p.problemas.mic && textoProblema('microfone', p.problemas.mic),
        p.problemas.cam && textoProblema('câmera', p.problemas.cam),
    ].filter(Boolean) as string[];

    const botao = 'h-12 w-12 flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white';

    return (
        <div className="min-h-screen w-full bg-ink-950 text-ink-100 font-sans flex items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-5xl grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-8 items-start">
                <div>
                    <div className="relative aspect-video bg-ink-850 border border-ink-700 overflow-hidden">
                        {p.estado.cam ? (
                            <video ref={video} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" data-testid="previa" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <Avatar id={p.eu.id} nome={p.eu.name} tamanho={112} />
                                <p className="text-sm text-ink-400">{p.pedindoMidia ? 'Aguardando permissão do navegador' : 'Câmera desligada'}</p>
                            </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between bg-gradient-to-t from-ink-950/80 to-transparent">
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => { p.onMic(); }} aria-pressed={!p.estado.mic} aria-label={p.estado.mic ? 'Desligar microfone' : 'Ligar microfone'} className={`${botao} ${p.estado.mic ? 'bg-ink-800/90 hover:bg-ink-700 text-white' : 'bg-white text-ink-950 hover:bg-ink-100'}`}>
                                    {p.estado.mic ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-600" />}
                                </button>
                                <button type="button" onClick={() => { p.onCam(); }} aria-pressed={!p.estado.cam} aria-label={p.estado.cam ? 'Desligar câmera' : 'Ligar câmera'} className={`${botao} ${p.estado.cam ? 'bg-ink-800/90 hover:bg-ink-700 text-white' : 'bg-white text-ink-950 hover:bg-ink-100'}`}>
                                    {p.estado.cam ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5 text-red-600" />}
                                </button>
                            </div>
                            {p.estado.mic && (
                                <div className="flex items-end gap-0.5 h-6" aria-label="Nível do microfone" role="img">
                                    {Array.from({ length: 10 }, (_, i) => (
                                        <span key={i} className={`w-1 ${i < nivel ? 'bg-brand-neon' : 'bg-white/20'}`} style={{ height: `${30 + i * 7}%` }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {aviso.length > 0 && (
                        <div className="mt-4 border border-red-500/40 bg-red-500/10 p-4 space-y-2" role="alert">
                            {aviso.map((t) => (
                                <p key={t} className="flex gap-2 text-sm text-red-200"><TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />{t}</p>
                            ))}
                        </div>
                    )}
                    {semNada && <p className="mt-4 text-sm text-ink-300">Você vai entrar sem câmera e sem microfone, mas poderá ver, ouvir e usar o chat.</p>}
                    {!semNada && p.temMic !== p.temCam && !p.pedindoMidia && (
                        <p className="mt-4 text-sm text-ink-300">{p.temMic ? 'Você vai entrar só com áudio.' : 'Você vai entrar só com vídeo.'}</p>
                    )}
                </div>

                <div className="space-y-6">
                    <div>
                        <p className="text-[11px] font-mono uppercase tracking-widest text-brand-neon">{p.meeting.status === 'LIVE' ? 'Em andamento' : 'Reunião T3'}</p>
                        <h1 className="mt-1 text-3xl font-semibold text-white leading-tight break-words">{p.meeting.title}</h1>
                        <p className="mt-2 text-sm text-ink-400">Entrando como {p.eu.name}</p>
                    </div>

                    <div>
                        <p className="text-[11px] font-mono uppercase tracking-widest text-ink-400 mb-2">Convidados ({convidados.length})</p>
                        <ul className="flex flex-wrap gap-2">
                            {convidados.map((c) => (
                                <li key={c.id} className="flex items-center gap-2 bg-ink-850 border border-ink-700 pr-3">
                                    <Avatar id={c.id} nome={c.name} tamanho={28} />
                                    <span className="text-sm text-ink-100">{c.name}{c.anfitriao ? ' · anfitrião' : ''}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <SeletoresDispositivos
                        dispositivos={p.dispositivos}
                        escolhidos={p.escolhidos}
                        onMic={p.onTrocarMic}
                        onCam={p.onTrocarCam}
                        onSaida={p.onTrocarSaida}
                    />

                    <button
                        type="button"
                        onClick={p.onEntrar}
                        disabled={p.pedindoMidia}
                        className="w-full py-4 bg-brand-neon hover:bg-brand-neonHover text-ink-950 text-sm font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                    >
                        Entrar na chamada
                    </button>
                </div>
            </div>
        </div>
    );
}
