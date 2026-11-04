import { useEffect, useState } from 'react';

let ctx: AudioContext | null = null;

/** Um único AudioContext para todos os medidores de nível da chamada. */
export function contextoAudio(): AudioContext | null {
    try {
        if (!ctx || ctx.state === 'closed') ctx = new AudioContext();
        return ctx;
    } catch { return null; }
}

/** Chamar dentro de um clique: libera o áudio no navegador. */
export function liberarAudio() {
    const c = contextoAudio();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function fecharContextoAudio() {
    if (ctx && ctx.state !== 'closed') ctx.close().catch(() => {});
    ctx = null;
}

/**
 * Nível de áudio de uma stream (0 a 10), calculado localmente com AnalyserNode.
 * `falando` segura o estado por 350 ms para o anel não piscar entre sílabas.
 */
export function useNivelAudio(stream: MediaStream | null, ativo = true) {
    const [nivel, setNivel] = useState(0);
    const [falando, setFalando] = useState(false);

    useEffect(() => {
        const c = contextoAudio();
        if (!ativo || !stream || !c || stream.getAudioTracks().length === 0) {
            setNivel(0); setFalando(false);
            return;
        }
        let fonte: MediaStreamAudioSourceNode;
        try { fonte = c.createMediaStreamSource(stream); } catch { return; }
        const analisador = c.createAnalyser();
        analisador.fftSize = 512;
        fonte.connect(analisador);
        const dados = new Uint8Array(analisador.fftSize);
        let ultimoAlto = 0;
        let nivelAtual = 0;
        let falandoAtual = false;
        const id = window.setInterval(() => {
            analisador.getByteTimeDomainData(dados);
            let soma = 0;
            for (let i = 0; i < dados.length; i++) { const v = (dados[i] - 128) / 128; soma += v * v; }
            const rms = Math.sqrt(soma / dados.length);
            const agora = performance.now();
            if (rms > 0.02) ultimoAlto = agora;
            const n = Math.min(10, Math.round(rms * 40));
            const f = agora - ultimoAlto < 350;
            if (n !== nivelAtual) { nivelAtual = n; setNivel(n); }
            if (f !== falandoAtual) { falandoAtual = f; setFalando(f); }
        }, 80);
        return () => {
            window.clearInterval(id);
            try { fonte.disconnect(); } catch { /* já desconectado */ }
            setNivel(0); setFalando(false);
        };
    }, [stream, ativo]);

    return { nivel, falando };
}
