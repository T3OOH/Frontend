import { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_URL, criarCliente, mensagemDeErro, resolverCredencial, type Credencial } from './api';
import { fecharContextoAudio, liberarAudio } from './audio';
import type {
    Dispositivos, DispositivosEscolhidos, Estado, Fase, Meeting, MeetingMessage, Participante,
    ParticipanteServidor, ProblemaMidia, UsuarioSala,
} from './tipos';

/**
 * Cada conexão WebRTC tem 4 transceivers criados SEMPRE na mesma ordem nos dois lados, para que
 * o índice diga o que é cada mídia (sem depender de msid): 0 microfone, 1 câmera, 2 vídeo da tela, 3 áudio da tela.
 */
const SLOT_MIC = 0, SLOT_CAM = 1, SLOT_TELA = 2, SLOT_TELA_AUDIO = 3;

const ICE_PADRAO: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
const CHAVE_DISP = '@t3:reuniao:dispositivos';

interface Peer {
    id: string;
    pc: RTCPeerConnection;
    polite: boolean;
    tx: RTCRtpTransceiver[];
    makingOffer: boolean;
    ignoreOffer: boolean;
    /** Peer criado por uma oferta recebida: não oferece nada antes de responder. */
    silencioso: boolean;
    fila: Promise<void>;
}

interface Local {
    mic: MediaStreamTrack | null;
    cam: MediaStreamTrack | null;
    tela: MediaStream | null;
}

type Ack<T = object> = ({ ok: true } & T) | { ok: false; erro?: string };

const seguro = <T,>(fn: () => T, padrao: T): T => { try { return fn(); } catch { return padrao; } };

function classificar(e: unknown): ProblemaMidia {
    const nome = (e as { name?: string })?.name;
    if (nome === 'NotAllowedError' || nome === 'SecurityError' || nome === 'PermissionDeniedError') return 'negada';
    if (nome === 'NotFoundError' || nome === 'DevicesNotFoundError') return 'ausente';
    if (nome === 'NotReadableError' || nome === 'AbortError' || nome === 'TrackStartError') return 'ocupado';
    return 'erro';
}

const lerEscolhidos = (): DispositivosEscolhidos => {
    const s = seguro(() => JSON.parse(localStorage.getItem(CHAVE_DISP) || '{}'), {} as Partial<DispositivosEscolhidos>);
    return { micId: s.micId || '', camId: s.camId || '', saidaId: s.saidaId || '' };
};

export function useReuniao(meetingId: string) {
    const [fase, setFaseState] = useState<Fase>('carregando');
    const [erro, setErro] = useState<string | null>(null);
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [eu, setEu] = useState<UsuarioSala>({ id: 'eu', name: 'Você' });
    const [participantes, setParticipantes] = useState<Participante[]>([]);
    const [mensagens, setMensagens] = useState<MeetingMessage[]>([]);
    const [local, setLocalState] = useState<Local>({ mic: null, cam: null, tela: null });
    const [mudo, setMudoState] = useState(false);
    const [problemas, setProblemas] = useState<{ mic: ProblemaMidia | null; cam: ProblemaMidia | null }>({ mic: null, cam: null });
    const [dispositivos, setDispositivos] = useState<Dispositivos>({ mics: [], cams: [], saidas: [] });
    const [escolhidos, setEscolhidosState] = useState<DispositivosEscolhidos>(lerEscolhidos);
    const [aviso, setAviso] = useState<string | null>(null);
    const [pedindoMidia, setPedindoMidia] = useState(false);
    const [nHistorico, setNHistorico] = useState(0);

    // Tudo o que os manipuladores de evento precisam enxergar sem ficar presos a um render antigo
    const faseRef = useRef<Fase>('carregando');
    const localRef = useRef<Local>({ mic: null, cam: null, tela: null });
    const mudoRef = useRef(false);
    const escolhidosRef = useRef(escolhidos);
    const peersRef = useRef(new Map<string, Peer>());
    const socketRef = useRef<Socket | null>(null);
    const credRef = useRef<Credencial | null>(null);
    const clienteRef = useRef<ReturnType<typeof criarCliente> | null>(null);
    const iceRef = useRef<RTCIceServer[]>(ICE_PADRAO);
    const saiuRef = useRef(false);
    const midiaIniciadaRef = useRef(false);
    const execRef = useRef(0);
    const avisoTimerRef = useRef<number | null>(null);
    const entrarTimerRef = useRef<number | null>(null);

    const setFase = (f: Fase) => { faseRef.current = f; setFaseState(f); };
    const definirLocal = (p: Partial<Local>) => { localRef.current = { ...localRef.current, ...p }; setLocalState(localRef.current); };
    const definirMudo = (v: boolean) => { mudoRef.current = v; setMudoState(v); };
    const mostrarAviso = (t: string) => {
        setAviso(t);
        if (avisoTimerRef.current) window.clearTimeout(avisoTimerRef.current);
        avisoTimerRef.current = window.setTimeout(() => setAviso(null), 5000);
    };

    const estadoAtual = (): Estado => {
        const l = localRef.current;
        return { mic: !!l.mic && l.mic.readyState === 'live' && !mudoRef.current, cam: !!l.cam, tela: !!l.tela };
    };

    // ============================ DISPOSITIVOS ============================

    const atualizarDispositivos = async () => {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const todos = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]);
        setDispositivos({
            mics: todos.filter((d) => d.kind === 'audioinput' && d.deviceId),
            cams: todos.filter((d) => d.kind === 'videoinput' && d.deviceId),
            saidas: todos.filter((d) => d.kind === 'audiooutput' && d.deviceId),
        });
    };

    const salvarEscolhidos = (p: Partial<DispositivosEscolhidos>) => {
        const novo = { ...escolhidosRef.current, ...p };
        escolhidosRef.current = novo;
        setEscolhidosState(novo);
        seguro(() => localStorage.setItem(CHAVE_DISP, JSON.stringify(novo)), undefined);
    };

    // ============================ MÍDIA LOCAL ============================

    const aplicarTrilhas = (peer: Peer) => {
        const l = localRef.current;
        const desejadas: (MediaStreamTrack | null)[] = [];
        desejadas[SLOT_MIC] = l.mic;
        desejadas[SLOT_CAM] = l.cam;
        desejadas[SLOT_TELA] = l.tela?.getVideoTracks()[0] ?? null;
        desejadas[SLOT_TELA_AUDIO] = l.tela?.getAudioTracks()[0] ?? null;
        peer.tx.forEach((tx, i) => {
            if (tx.sender.track !== desejadas[i]) tx.sender.replaceTrack(desejadas[i]).catch(() => {});
        });
    };
    const aplicarEmTodos = () => peersRef.current.forEach(aplicarTrilhas);

    const instalarMic = (track: MediaStreamTrack) => {
        const antigo = localRef.current.mic;
        track.enabled = !mudoRef.current;
        track.onended = () => {
            if (localRef.current.mic === track) { definirLocal({ mic: null }); aplicarEmTodos(); }
        };
        definirLocal({ mic: track });
        aplicarEmTodos();
        if (antigo && antigo !== track) { antigo.onended = null; antigo.stop(); }
        const id = track.getSettings().deviceId;
        if (id) salvarEscolhidos({ micId: id });
        setProblemas((p) => ({ ...p, mic: null }));
    };

    const instalarCam = (track: MediaStreamTrack) => {
        const antigo = localRef.current.cam;
        track.onended = () => {
            if (localRef.current.cam === track) { definirLocal({ cam: null }); aplicarEmTodos(); }
        };
        definirLocal({ cam: track });
        aplicarEmTodos();
        if (antigo && antigo !== track) { antigo.onended = null; antigo.stop(); }
        const id = track.getSettings().deviceId;
        if (id) salvarEscolhidos({ camId: id });
        setProblemas((p) => ({ ...p, cam: null }));
    };

    const restricaoMic = (id?: string): MediaTrackConstraints => ({
        echoCancellation: true, noiseSuppression: true, autoGainControl: true,
        ...(id ? { deviceId: { exact: id } } : {}),
    });
    const restricaoCam = (id?: string): MediaTrackConstraints => ({
        width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 },
        ...(id ? { deviceId: { exact: id } } : {}),
    });

    /** Abre um dispositivo; se o escolhido não existe mais, tenta o padrão. */
    const abrir = async (tipo: 'audio' | 'video', id?: string) => {
        const montar = (i?: string) => tipo === 'audio' ? { audio: restricaoMic(i) } : { video: restricaoCam(i) };
        try {
            return await navigator.mediaDevices.getUserMedia(montar(id));
        } catch (e) {
            if (id && (e as { name?: string }).name === 'OverconstrainedError') return navigator.mediaDevices.getUserMedia(montar());
            throw e;
        }
    };

    const adquirirMic = async (id?: string) => {
        if (!navigator.mediaDevices?.getUserMedia) { setProblemas((p) => ({ ...p, mic: 'indisponivel' })); return false; }
        try {
            const s = await abrir('audio', id ?? (escolhidosRef.current.micId || undefined));
            instalarMic(s.getAudioTracks()[0]);
            atualizarDispositivos();
            return true;
        } catch (e) {
            setProblemas((p) => ({ ...p, mic: classificar(e) }));
            return false;
        }
    };

    const adquirirCam = async (id?: string) => {
        if (!navigator.mediaDevices?.getUserMedia) { setProblemas((p) => ({ ...p, cam: 'indisponivel' })); return false; }
        try {
            const s = await abrir('video', id ?? (escolhidosRef.current.camId || undefined));
            instalarCam(s.getVideoTracks()[0]);
            atualizarDispositivos();
            return true;
        } catch (e) {
            setProblemas((p) => ({ ...p, cam: classificar(e) }));
            return false;
        }
    };

    /** Sala de espera: pede microfone e câmera de uma vez (um só aviso do navegador); se falhar, tenta um de cada vez. */
    const iniciarMidia = async () => {
        if (midiaIniciadaRef.current) return;
        midiaIniciadaRef.current = true;
        if (!navigator.mediaDevices?.getUserMedia) {
            setProblemas({ mic: 'indisponivel', cam: 'indisponivel' });
            return;
        }
        setPedindoMidia(true);
        const exec = execRef.current;
        try {
            const e = escolhidosRef.current;
            const s = await navigator.mediaDevices.getUserMedia({
                audio: restricaoMic(e.micId || undefined), video: restricaoCam(e.camId || undefined),
            });
            if (exec !== execRef.current) { s.getTracks().forEach((t) => t.stop()); return; }
            instalarMic(s.getAudioTracks()[0]);
            instalarCam(s.getVideoTracks()[0]);
            await atualizarDispositivos();
        } catch {
            await adquirirMic();
            await adquirirCam();
        } finally {
            setPedindoMidia(false);
        }
    };

    const alternarMic = async () => {
        const m = localRef.current.mic;
        if (!m || m.readyState !== 'live') {
            if (await adquirirMic()) definirMudo(false);
            return;
        }
        const novo = !mudoRef.current;
        definirMudo(novo);
        m.enabled = !novo;
    };

    const alternarCam = async () => {
        const c = localRef.current.cam;
        if (c) {
            c.onended = null;
            c.stop();
            definirLocal({ cam: null });
            aplicarEmTodos();
            return;
        }
        await adquirirCam();
    };

    const trocarMic = async (id: string) => { salvarEscolhidos({ micId: id }); await adquirirMic(id); };
    const trocarCam = async (id: string) => {
        salvarEscolhidos({ camId: id });
        if (localRef.current.cam) await adquirirCam(id);
    };
    const trocarSaida = (id: string) => salvarEscolhidos({ saidaId: id });

    const pararTela = () => {
        const t = localRef.current.tela;
        if (!t) return;
        t.getTracks().forEach((x) => { x.onended = null; x.stop(); });
        definirLocal({ tela: null });
        aplicarEmTodos();
    };

    const alternarTela = async () => {
        if (localRef.current.tela) { pararTela(); return; }
        if (!navigator.mediaDevices?.getDisplayMedia) { mostrarAviso('Este navegador não permite compartilhar a tela.'); return; }
        try {
            const s = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 30 } }, audio: true });
            const v = s.getVideoTracks()[0];
            if ('contentHint' in v) v.contentHint = 'detail';
            // O botão "Parar compartilhamento" do navegador encerra a trilha
            v.onended = () => pararTela();
            definirLocal({ tela: s });
            aplicarEmTodos();
        } catch (e) {
            const nome = (e as { name?: string }).name;
            if (nome !== 'NotAllowedError' && nome !== 'AbortError') mostrarAviso('Não foi possível compartilhar a tela.');
        }
    };

    // ============================ WEBRTC ============================

    const emitirSinal = (para: string, dados: object) => socketRef.current?.emit('sinal', { para, dados });

    const atualizarParticipante = (socketId: string, fn: (p: Participante) => Participante) =>
        setParticipantes((lista) => lista.map((p) => (p.socketId === socketId ? fn(p) : p)));

    /**
     * Quem oferece (o que acabou de entrar) cria os 4 transceivers. Quem responde NÃO cria nenhum:
     * adota os que nascem da oferta recebida (o navegador só reaproveita transceivers criados por addTrack).
     * Nos dois casos o índice do transceiver identifica a mídia (ver SLOT_*).
     */
    const criarPeer = (id: string, ofertante: boolean) => {
        const meuId = socketRef.current?.id ?? '';
        const pc = new RTCPeerConnection({ iceServers: iceRef.current });
        const peer: Peer = {
            id, pc, tx: [], polite: meuId < id, makingOffer: false, ignoreOffer: false, silencioso: !ofertante, fila: Promise.resolve(),
        };
        peersRef.current.set(id, peer);

        pc.onnegotiationneeded = async () => {
            if (peer.silencioso || pc.signalingState !== 'stable') return;
            try {
                peer.makingOffer = true;
                await pc.setLocalDescription();
                emitirSinal(id, { description: pc.localDescription });
            } catch { /* conexão fechada no meio */ } finally {
                peer.makingOffer = false;
            }
        };
        pc.onicecandidate = ({ candidate }) => { if (candidate) emitirSinal(id, { candidate }); };
        pc.oniceconnectionstatechange = () => { if (pc.iceConnectionState === 'failed') pc.restartIce(); };

        if (ofertante) {
            peer.tx = [pc.addTransceiver('audio'), pc.addTransceiver('video'), pc.addTransceiver('video'), pc.addTransceiver('audio')];
            aplicarTrilhas(peer);
        }
        return peer;
    };

    const montarStreams = (peer: Peer) => {
        if (peer.tx.length < 4) return { camStream: null, telaStream: null };
        const r = (i: number) => peer.tx[i].receiver.track;
        return {
            camStream: new MediaStream([r(SLOT_MIC), r(SLOT_CAM)]),
            telaStream: new MediaStream([r(SLOT_TELA), r(SLOT_TELA_AUDIO)]),
        };
    };

    /** Respondedor: depois de aplicar a oferta, passa a enviar nos transceivers recebidos. */
    const adotarTransceivers = (peer: Peer) => {
        const todos = peer.pc.getTransceivers();
        if (peer.tx.length >= 4 || todos.length < 4) return;
        peer.tx = todos.slice(0, 4);
        peer.tx.forEach((t) => { t.direction = 'sendrecv'; });
        aplicarTrilhas(peer);
        const { camStream, telaStream } = montarStreams(peer);
        setParticipantes((lista) => {
            if (lista.some((p) => p.socketId === peer.id)) {
                return lista.map((p) => (p.socketId === peer.id ? { ...p, camStream, telaStream } : p));
            }
            return [...lista, {
                socketId: peer.id, user: { id: peer.id, name: 'Participante' }, estado: { mic: false, cam: false, tela: false },
                camStream, telaStream,
            }];
        });
    };

    const tratarSinal = async (peer: Peer, dados: { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) => {
        const { pc } = peer;
        if (dados.description) {
            const d = dados.description;
            const colisao = d.type === 'offer' && (peer.makingOffer || pc.signalingState !== 'stable');
            peer.ignoreOffer = !peer.polite && colisao;
            if (peer.ignoreOffer) return;
            await pc.setRemoteDescription(d);
            if (d.type === 'offer') {
                adotarTransceivers(peer);
                await pc.setLocalDescription();
                emitirSinal(peer.id, { description: pc.localDescription });
            }
            peer.silencioso = false;
        } else if (dados.candidate) {
            try { await pc.addIceCandidate(dados.candidate); } catch (e) { if (!peer.ignoreOffer) console.warn('ICE recusado', e); }
        }
    };

    const fecharPeer = (id: string) => {
        const p = peersRef.current.get(id);
        if (!p) return;
        peersRef.current.delete(id);
        p.pc.onnegotiationneeded = null;
        p.pc.onicecandidate = null;
        p.pc.close();
    };
    const fecharTodosPeers = () => { [...peersRef.current.keys()].forEach(fecharPeer); };

    // ============================ SOCKET ============================

    const carregarHistorico = async () => {
        try {
            const hist = await clienteRef.current!.mensagens(meetingId);
            setNHistorico(hist.length);
            setMensagens((atual) => {
                const ids = new Set(hist.map((m) => m.id));
                return [...hist, ...atual.filter((m) => !ids.has(m.id))];
            });
        } catch { /* o chat continua só com as mensagens novas */ }
    };

    const falharEntrada = (texto: string | undefined) => {
        const t = texto || 'Não foi possível entrar na chamada.';
        if (/encerrad|cancelad|ended|cancel/i.test(t)) { limparTudo(); setFase('encerrada'); return; }
        if (/cheia|lotad|limite|m[aá]xim|full/i.test(t)) { limparTudo(); setFase('cheia'); return; }
        limparTudo();
        setErro(/convid|acesso|autoriz|permiss/i.test(t) ? 'Você não tem acesso a esta reunião.' : t);
        setFase('erro');
    };

    const emitirEntrar = () => {
        const socket = socketRef.current;
        if (!socket) return;
        socket.emit('entrar', { meetingId, estado: estadoAtual() }, (res: Ack<{ meeting: Meeting; participantes: ParticipanteServidor[] }>) => {
            if (entrarTimerRef.current) window.clearTimeout(entrarTimerRef.current);
            if (!res?.ok) { falharEntrada((res as { erro?: string })?.erro); return; }
            setMeeting(res.meeting);
            const lista: Participante[] = [];
            for (const p of res.participantes) {
                if (p.socketId === socket.id) continue;
                const peer = criarPeer(p.socketId, true);
                lista.push({ ...p, ...montarStreams(peer) });
            }
            setParticipantes(lista);
            setFase('chamada');
            carregarHistorico();
        });
    };

    const conectar = () => {
        const cred = credRef.current!;
        saiuRef.current = false;
        const socket = io(`${API_URL}/reunioes`, {
            auth: (cb) => { cred.obterToken().then((t) => cb(t ? { token: t } : {})).catch(() => cb({})); },
            reconnectionDelayMax: 4000,
        });
        socketRef.current = socket;

        socket.on('connect', () => emitirEntrar());
        socket.on('connect_error', (err) => {
            if (faseRef.current === 'entrando' && !socket.active) {
                limparTudo();
                setErro(/auth|token|unauthor|inv[aá]lid/i.test(err.message)
                    ? 'Sua credencial não é mais válida. Abra a reunião novamente.'
                    : 'Não foi possível conectar ao servidor da reunião.');
                setFase('erro');
            }
        });
        socket.on('disconnect', (motivo) => {
            if (saiuRef.current || motivo === 'io client disconnect') return;
            fecharTodosPeers();
            setParticipantes([]);
            if (faseRef.current === 'chamada' || faseRef.current === 'entrando') setFase('reconectando');
        });

        socket.on('entrou', (p: ParticipanteServidor) => {
            setParticipantes((lista) => {
                const existente = lista.find((x) => x.socketId === p.socketId);
                if (existente) return lista.map((x) => (x.socketId === p.socketId ? { ...x, user: p.user, estado: p.estado } : x));
                return [...lista, { ...p, camStream: null, telaStream: null }];
            });
        });
        socket.on('saiu', ({ socketId }: { socketId: string }) => {
            fecharPeer(socketId);
            setParticipantes((lista) => lista.filter((p) => p.socketId !== socketId));
        });
        socket.on('estado', ({ socketId, estado }: { socketId: string; estado: Estado }) => {
            atualizarParticipante(socketId, (p) => ({ ...p, estado }));
        });
        socket.on('mensagem', (m: MeetingMessage) => {
            setMensagens((atual) => (atual.some((x) => x.id === m.id) ? atual : [...atual, m]));
        });
        socket.on('encerrada', () => { limparTudo(); setFase('encerrada'); });

        socket.on('sinal', ({ de, dados }: { de: string; dados: Parameters<typeof tratarSinal>[1] }) => {
            let peer = peersRef.current.get(de);
            // Oferta simultânea na primeira negociação: quem é educado recomeça como respondedor
            // (um rollback deixaria transceivers duplicados e embaralharia os índices das mídias)
            if (peer && peer.polite && dados.description?.type === 'offer' && !peer.pc.currentRemoteDescription
                && (peer.makingOffer || peer.pc.signalingState !== 'stable')) {
                fecharPeer(de);
                peer = undefined;
            }
            // Primeira oferta de quem acabou de entrar: o peer nasce aqui, já como respondedor
            if (!peer) peer = criarPeer(de, false);
            const alvo = peer;
            alvo.fila = alvo.fila.then(() => tratarSinal(alvo, dados)).catch((e) => console.warn('Falha na sinalização', e));
        });
    };

    /** Para tudo: peers, socket, mídia local e áudio. A tela volta a ser usada só ao reentrar. */
    function limparTudo() {
        execRef.current++;
        saiuRef.current = true;
        if (entrarTimerRef.current) window.clearTimeout(entrarTimerRef.current);
        fecharTodosPeers();
        const s = socketRef.current;
        if (s) { s.removeAllListeners(); s.disconnect(); socketRef.current = null; }
        const l = localRef.current;
        l.mic?.stop(); l.cam?.stop();
        l.tela?.getTracks().forEach((t) => { t.onended = null; t.stop(); });
        if (l.mic) l.mic.onended = null;
        if (l.cam) l.cam.onended = null;
        localRef.current = { mic: null, cam: null, tela: null };
        setLocalState(localRef.current);
        setParticipantes([]);
        midiaIniciadaRef.current = false;
        fecharContextoAudio();
    }

    // ============================ AÇÕES PÚBLICAS ============================

    const entrar = () => {
        liberarAudio(); // dentro do clique: libera o áudio no navegador
        setErro(null);
        setFase('entrando');
        conectar();
        entrarTimerRef.current = window.setTimeout(() => {
            if (faseRef.current !== 'entrando') return;
            limparTudo();
            setErro('O servidor da reunião não respondeu. Tente novamente.');
            setFase('erro');
        }, 15_000);
    };

    const sair = () => {
        socketRef.current?.emit('sair');
        limparTudo();
        setFase('saiu');
    };

    const voltarParaEspera = () => { saiuRef.current = false; setFase('espera'); };

    const encerrarParaTodos = async () => {
        try {
            await clienteRef.current!.encerrar(meetingId);
            limparTudo();
            setFase('encerrada');
        } catch {
            mostrarAviso('Não foi possível encerrar a reunião.');
        }
    };

    const enviarMensagem = (texto: string) => new Promise<boolean>((resolve) => {
        const socket = socketRef.current;
        if (!socket?.connected) { resolve(false); return; }
        socket.emit('mensagem', { texto }, (res: { ok: boolean }) => resolve(!!res?.ok));
    });

    // ============================ CICLO DE VIDA ============================

    const carregar = async () => {
        const exec = ++execRef.current;
        setFase('carregando');
        setErro(null);
        try {
            const cred = resolverCredencial(meetingId);
            credRef.current = cred;
            const cliente = criarCliente(cred);
            clienteRef.current = cliente;
            const [reuniao, ice] = await Promise.all([
                cliente.reuniao(meetingId),
                cliente.ice().catch(() => ICE_PADRAO),
            ]);
            if (exec !== execRef.current) return;
            iceRef.current = ice?.length ? ice : ICE_PADRAO;
            setMeeting(reuniao);
            const eu = [reuniao.host, ...reuniao.participants].find((u) => u.id === cred.usuarioId);
            setEu({ id: cred.usuarioId ?? 'eu', name: eu?.name ?? cred.nome ?? 'Você' });
            if (reuniao.status === 'ENDED' || reuniao.status === 'CANCELLED') { setFase('encerrada'); return; }
            setFase('espera');
        } catch (e) {
            if (exec !== execRef.current) return;
            setErro(mensagemDeErro(e));
            setFase('erro');
        }
    };

    useEffect(() => {
        carregar();
        const aoMudarDispositivos = () => { atualizarDispositivos(); };
        navigator.mediaDevices?.addEventListener?.('devicechange', aoMudarDispositivos);
        return () => {
            navigator.mediaDevices?.removeEventListener?.('devicechange', aoMudarDispositivos);
            limparTudo();
            if (avisoTimerRef.current) window.clearTimeout(avisoTimerRef.current);
        };
        // eslint-disable-next-line
    }, [meetingId]);

    // Sala de espera: abre câmera e microfone para a prévia
    useEffect(() => {
        if (fase === 'espera') { saiuRef.current = false; iniciarMidia(); }
        // eslint-disable-next-line
    }, [fase]);

    // Mudou mic, câmera ou tela: avisa os outros
    const estado = useMemo<Estado>(
        () => ({ mic: !!local.mic && !mudo, cam: !!local.cam, tela: !!local.tela }),
        [local, mudo],
    );
    useEffect(() => {
        if (faseRef.current === 'chamada') socketRef.current?.emit('estado', estado);
    }, [estado]);

    // Stream local para a prévia, o bloco "Você" e o medidor de nível
    const streamLocal = useMemo(() => {
        const tr = [local.mic, local.cam].filter((t): t is MediaStreamTrack => !!t);
        return tr.length ? new MediaStream(tr) : null;
    }, [local.mic, local.cam]);

    return {
        fase, erro, meeting, eu, participantes, mensagens, nHistorico, aviso, pedindoMidia,
        ehAnfitriao: !!meeting?.isHost,
        estado, problemas, dispositivos, escolhidos,
        streamLocal, telaLocal: local.tela, temMic: !!local.mic, temCam: !!local.cam,
        acoes: {
            entrar, sair, voltarParaEspera, encerrarParaTodos, enviarMensagem,
            alternarMic, alternarCam, alternarTela, trocarMic, trocarCam, trocarSaida,
            atualizarDispositivos, liberarAudio,
        },
    };
}
