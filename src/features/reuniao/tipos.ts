export type MeetingStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

export interface Meeting {
    id: string;
    title: string;
    status: MeetingStatus;
    scheduledAt: string | null;
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
    host: { id: string; name: string };
    participants: { id: string; name: string; email: string; role: string }[];
    isHost: boolean;
}

export interface MeetingMessage {
    id: string;
    meetingId: string;
    sender: { id: string; name: string };
    texto: string;
    createdAt: string;
}

export interface Estado {
    mic: boolean;
    cam: boolean;
    tela: boolean;
}

export interface UsuarioSala {
    id: string;
    name: string;
}

export interface ParticipanteServidor {
    socketId: string;
    user: UsuarioSala;
    estado: Estado;
}

/** Participante como a interface enxerga: dados do servidor + as mídias recebidas por WebRTC. */
export interface Participante extends ParticipanteServidor {
    camStream: MediaStream | null;
    telaStream: MediaStream | null;
}

export type Fase =
    | 'carregando'
    | 'erro'
    | 'espera'
    | 'entrando'
    | 'chamada'
    | 'reconectando'
    | 'cheia'
    | 'saiu'
    | 'encerrada';

export type ProblemaMidia = 'negada' | 'ausente' | 'ocupado' | 'indisponivel' | 'erro';

export interface Dispositivos {
    mics: MediaDeviceInfo[];
    cams: MediaDeviceInfo[];
    saidas: MediaDeviceInfo[];
}

export interface DispositivosEscolhidos {
    micId: string;
    camId: string;
    saidaId: string;
}
