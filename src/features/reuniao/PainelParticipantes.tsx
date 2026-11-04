import { Camera, CameraOff, Mic, MicOff, MonitorUp } from 'lucide-react';
import { Avatar } from './Avatar';
import type { Estado, Participante, UsuarioSala } from './tipos';

interface Props {
    eu: UsuarioSala;
    estadoEu: Estado;
    participantes: Participante[];
    anfitriaoId?: string;
}

function Linha({ id, nome, estado, voce, anfitriao }: { id: string; nome: string; estado: Estado; voce?: boolean; anfitriao?: boolean }) {
    return (
        <li className="flex items-center gap-3 px-4 py-2.5">
            <Avatar id={id} nome={nome} tamanho={32} />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{nome}{voce ? ' (você)' : ''}</p>
                {anfitriao && <p className="text-[11px] uppercase tracking-widest text-brand-neon">Anfitrião</p>}
            </div>
            <div className="flex items-center gap-2 text-ink-400">
                {estado.tela && <MonitorUp className="w-4 h-4 text-brand-neon" aria-label="Compartilhando a tela" />}
                {estado.cam ? <Camera className="w-4 h-4" aria-label="Câmera ligada" /> : <CameraOff className="w-4 h-4 text-ink-500" aria-label="Câmera desligada" />}
                {estado.mic ? <Mic className="w-4 h-4" aria-label="Microfone ligado" /> : <MicOff className="w-4 h-4 text-red-400" aria-label="Microfone desligado" />}
            </div>
        </li>
    );
}

export function PainelParticipantes({ eu, estadoEu, participantes, anfitriaoId }: Props) {
    return (
        <ul className="overflow-y-auto h-full py-2" data-testid="lista-participantes">
            <Linha id={eu.id} nome={eu.name} estado={estadoEu} voce anfitriao={eu.id === anfitriaoId} />
            {participantes.map((p) => (
                <Linha key={p.socketId} id={p.user.id} nome={p.user.name} estado={p.estado} anfitriao={p.user.id === anfitriaoId} />
            ))}
        </ul>
    );
}
