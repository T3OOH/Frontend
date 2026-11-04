import { useId } from 'react';
import type { Dispositivos, DispositivosEscolhidos } from './tipos';

interface Props {
    dispositivos: Dispositivos;
    escolhidos: DispositivosEscolhidos;
    onMic: (id: string) => void;
    onCam: (id: string) => void;
    onSaida: (id: string) => void;
}

const nomeDe = (d: MediaDeviceInfo, i: number, rotulo: string) => d.label || `${rotulo} ${i + 1}`;

function Campo({ rotulo, itens, valor, onChange, vazio }: { rotulo: string; itens: MediaDeviceInfo[]; valor: string; onChange: (id: string) => void; vazio: string }) {
    const id = useId();
    const atual = itens.some((d) => d.deviceId === valor) ? valor : (itens[0]?.deviceId ?? '');
    return (
        <div>
            <label htmlFor={id} className="block text-[11px] font-mono uppercase tracking-widest text-ink-400 mb-1.5">{rotulo}</label>
            <select
                id={id}
                value={atual}
                disabled={itens.length === 0}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-ink-800 border border-ink-700 focus:border-brand-neon outline-none px-3 py-2.5 text-sm text-white disabled:text-ink-500"
            >
                {itens.length === 0 && <option value="">{vazio}</option>}
                {itens.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{nomeDe(d, i, rotulo)}</option>)}
            </select>
        </div>
    );
}

export function SeletoresDispositivos({ dispositivos, escolhidos, onMic, onCam, onSaida }: Props) {
    const temSaida = typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;
    return (
        <div className="space-y-4">
            <Campo rotulo="Microfone" itens={dispositivos.mics} valor={escolhidos.micId} onChange={onMic} vazio="Nenhum microfone encontrado" />
            <Campo rotulo="Câmera" itens={dispositivos.cams} valor={escolhidos.camId} onChange={onCam} vazio="Nenhuma câmera encontrada" />
            {temSaida && <Campo rotulo="Alto-falante" itens={dispositivos.saidas} valor={escolhidos.saidaId} onChange={onSaida} vazio="Padrão do sistema" />}
        </div>
    );
}
