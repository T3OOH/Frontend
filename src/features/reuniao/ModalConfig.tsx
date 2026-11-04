import { X } from 'lucide-react';
import { SeletoresDispositivos } from './SeletoresDispositivos';
import type { Dispositivos, DispositivosEscolhidos } from './tipos';

interface Props {
    dispositivos: Dispositivos;
    escolhidos: DispositivosEscolhidos;
    onMic: (id: string) => void;
    onCam: (id: string) => void;
    onSaida: (id: string) => void;
    onFechar: () => void;
}

export function ModalConfig({ onFechar, ...resto }: Props) {
    return (
        <div className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="cfg-titulo" onClick={onFechar}>
            <div className="w-full max-w-md bg-ink-900 border border-ink-700 p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h2 id="cfg-titulo" className="text-lg font-semibold text-white">Dispositivos</h2>
                    <button type="button" onClick={onFechar} aria-label="Fechar" className="p-1.5 text-ink-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <SeletoresDispositivos {...resto} />
                <p className="mt-4 text-xs text-ink-500">Ao trocar o microfone ou a câmera, a chamada continua sem interrupção.</p>
            </div>
        </div>
    );
}
