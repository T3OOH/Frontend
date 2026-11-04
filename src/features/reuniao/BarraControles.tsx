import { useState } from 'react';
import { Camera, CameraOff, MessageSquare, Mic, MicOff, MonitorUp, MonitorOff, PhoneOff, Power, Settings, Users } from 'lucide-react';
import { Dica } from './Dica';

interface Props {
    mic: boolean;
    cam: boolean;
    tela: boolean;
    painel: 'chat' | 'participantes' | null;
    naoLidas: number;
    totalParticipantes: number;
    ehAnfitriao: boolean;
    onMic: () => void;
    onCam: () => void;
    onTela: () => void;
    onConfig: () => void;
    onPainel: (p: 'chat' | 'participantes') => void;
    onSair: () => void;
    onEncerrar: () => void;
}

const base = 'relative h-12 w-12 flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white';
const neutro = `${base} bg-ink-800 hover:bg-ink-700 text-white`;
const ativo = `${base} bg-brand-neon text-ink-950 hover:bg-brand-neonHover`;
const desligado = `${base} bg-white text-ink-950 hover:bg-ink-100`;

export function BarraControles(p: Props) {
    const [confirmando, setConfirmando] = useState(false);

    return (
        <>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-ink-900/95 border border-ink-700 p-2 shadow-panel max-w-[calc(100%-1rem)]" role="toolbar" aria-label="Controles da chamada">
                <Dica texto={p.mic ? 'Desligar microfone' : 'Ligar microfone'} atalho="Ctrl+D">
                    <button type="button" onClick={p.onMic} className={p.mic ? neutro : desligado} aria-pressed={!p.mic} aria-label={p.mic ? 'Desligar microfone' : 'Ligar microfone'}>
                        {p.mic ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-600" />}
                    </button>
                </Dica>
                <Dica texto={p.cam ? 'Desligar câmera' : 'Ligar câmera'} atalho="Ctrl+E">
                    <button type="button" onClick={p.onCam} className={p.cam ? neutro : desligado} aria-pressed={!p.cam} aria-label={p.cam ? 'Desligar câmera' : 'Ligar câmera'}>
                        {p.cam ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5 text-red-600" />}
                    </button>
                </Dica>
                <Dica texto={p.tela ? 'Parar de compartilhar' : 'Compartilhar tela'}>
                    <button type="button" onClick={p.onTela} className={p.tela ? ativo : neutro} aria-pressed={p.tela} aria-label={p.tela ? 'Parar de compartilhar a tela' : 'Compartilhar tela'}>
                        {p.tela ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
                    </button>
                </Dica>
                <Dica texto="Configurações de dispositivos">
                    <button type="button" onClick={p.onConfig} className={neutro} aria-label="Configurações de dispositivos">
                        <Settings className="w-5 h-5" />
                    </button>
                </Dica>

                <span className="w-px h-8 bg-ink-700 mx-1" aria-hidden="true" />

                <Dica texto={p.painel === 'chat' ? 'Fechar chat' : 'Abrir chat'}>
                    <button type="button" onClick={() => p.onPainel('chat')} className={p.painel === 'chat' ? ativo : neutro} aria-pressed={p.painel === 'chat'} aria-label="Chat da chamada">
                        <MessageSquare className="w-5 h-5" />
                        {p.naoLidas > 0 && (
                            <span data-testid="nao-lidas" className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-brand-neon text-ink-950 text-[11px] font-bold flex items-center justify-center border-2 border-ink-900">
                                {p.naoLidas > 99 ? '99+' : p.naoLidas}
                            </span>
                        )}
                    </button>
                </Dica>
                <Dica texto={p.painel === 'participantes' ? 'Fechar participantes' : 'Participantes'}>
                    <button type="button" onClick={() => p.onPainel('participantes')} className={p.painel === 'participantes' ? ativo : neutro} aria-pressed={p.painel === 'participantes'} aria-label="Participantes">
                        <Users className="w-5 h-5" />
                        <span className="absolute -bottom-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-ink-950 text-white text-[11px] font-semibold flex items-center justify-center border border-ink-700">{p.totalParticipantes}</span>
                    </button>
                </Dica>

                <span className="w-px h-8 bg-ink-700 mx-1" aria-hidden="true" />

                <Dica texto="Sair da chamada">
                    <button type="button" onClick={p.onSair} className={`${base} bg-red-600 hover:bg-red-500 text-white`} aria-label="Sair da chamada">
                        <PhoneOff className="w-5 h-5" />
                    </button>
                </Dica>
                {p.ehAnfitriao && (
                    <Dica texto="Encerrar para todos">
                        <button type="button" onClick={() => setConfirmando(true)} className={`${base} bg-ink-800 text-red-400 hover:bg-red-600 hover:text-white`} aria-label="Encerrar para todos">
                            <Power className="w-5 h-5" />
                        </button>
                    </Dica>
                )}
            </div>

            {confirmando && (
                <div className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="enc-titulo">
                    <div className="w-full max-w-sm bg-ink-900 border border-ink-700 p-6">
                        <h2 id="enc-titulo" className="text-lg font-semibold text-white">Encerrar para todos?</h2>
                        <p className="mt-2 text-sm text-ink-300">A chamada termina para todos os participantes e não poderá ser retomada.</p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" autoFocus onClick={() => setConfirmando(false)} className="px-4 py-2.5 bg-ink-800 hover:bg-ink-700 text-white text-xs font-bold uppercase tracking-widest">Cancelar</button>
                            <button type="button" onClick={() => { setConfirmando(false); p.onEncerrar(); }} className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-widest">Encerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
