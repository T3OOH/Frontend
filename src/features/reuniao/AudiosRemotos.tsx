import { useEffect, useRef } from 'react';
import type { Participante } from './tipos';

type ElementoComSaida = HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };

function Saida({ stream, saidaId }: { stream: MediaStream; saidaId: string }) {
    const ref = useRef<ElementoComSaida>(null);

    useEffect(() => {
        const a = ref.current;
        if (!a) return;
        if (a.srcObject !== stream) a.srcObject = stream;
        a.play().catch(() => {});
    }, [stream]);

    useEffect(() => {
        const a = ref.current;
        if (a?.setSinkId) a.setSinkId(saidaId || 'default').catch(() => {});
    }, [saidaId]);

    return <audio ref={ref} autoPlay />;
}

/** O áudio de todos toca por aqui (sempre montado), independente de quem está em destaque. */
export function AudiosRemotos({ participantes, saidaId }: { participantes: Participante[]; saidaId: string }) {
    return (
        <div className="hidden" aria-hidden="true">
            {participantes.map((p) => (
                <span key={p.socketId}>
                    {p.camStream && <Saida stream={p.camStream} saidaId={saidaId} />}
                    {p.telaStream && <Saida stream={p.telaStream} saidaId={saidaId} />}
                </span>
            ))}
        </div>
    );
}
