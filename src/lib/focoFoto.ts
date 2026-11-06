/**
 * Foco automático das fotos dos painéis: os cards (object-fit: cover) cortam a foto, então
 * cada foto guarda um ponto de foco (0-100% na horizontal e na vertical) que fica no centro do corte.
 *
 * O reconhecimento roda no navegador da gestão (TensorFlow.js + COCO-SSD, sem custo nem chave):
 * acha telas (o telão de LED aparece como "tv"), veículos e pessoas e põe o foco no telão,
 * puxado na direção do movimento da rua. Carregado só no cadastro de painéis (import dinâmico).
 */
import { thumb } from '@/lib/imagens';

export interface FocoFoto {
    x: number;
    y: number;
    fonte: 'auto' | 'manual';
    /** O que foi reconhecido (ex.: "tela", "carro"). */
    objetos?: string[];
    /** Pino marcado à mão em cima do telão (edição): a IA procura o telão em volta dele. */
    pino?: Ponto;
}
export interface Ponto { x: number; y: number }
export type MapaFocos = Record<string, FocoFoto>;

const NOMES: Record<string, string> = {
    tv: 'tela', laptop: 'tela', car: 'carro', bus: 'ônibus', truck: 'caminhão', motorcycle: 'moto',
    bicycle: 'bicicleta', person: 'pessoa', 'traffic light': 'semáforo',
};
const TELA = new Set(['tv', 'laptop']);
const MOVIMENTO = new Set(['car', 'bus', 'truck', 'motorcycle', 'bicycle', 'person']);

type Modelo = { detect: (img: HTMLImageElement, max?: number, minScore?: number) => Promise<{ class: string; score: number; bbox: [number, number, number, number] }[]> };
let modelo: Promise<Modelo> | null = null;

/** Carrega o modelo uma vez por página (~5 MB, baixado do Google na primeira vez e depois do cache). */
function carregarModelo() {
    modelo ??= (async () => {
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        const coco = await import('@tensorflow-models/coco-ssd');
        return coco.load({ base: 'lite_mobilenet_v2' }) as Promise<Modelo>;
    })();
    return modelo;
}

function carregarImagem(url: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Não foi possível abrir a foto para análise.'));
        img.src = url;
    });
}

const limitar = (v: number) => Math.round(Math.min(95, Math.max(5, v)) * 10) / 10;

/**
 * Telão de LED pela aparência (o COCO-SSD não tem a classe "telão"): região luminosa, saturada
 * e com conteúdo (texto, imagem), de formato retangular, preferindo a parte de cima da foto.
 * Céu e carros brancos são claros mas sem cor; paredes coloridas são lisas (sem variação local).
 * excluir: caixas (em pixels da foto) que não são telão, como semáforos e veículos (lanternas).
 * pino: ponto marcado à mão em cima do telão (%); a busca fica em volta dele.
 * Devolve o centro e o tamanho em % da foto, ou null.
 */
export function detectarTelaPorAparencia(img: HTMLImageElement, excluir: [number, number, number, number][] = [], pino?: Ponto) {
    const W = 96;
    const H = Math.max(24, Math.round((W * (img.naturalHeight || img.height)) / (img.naturalWidth || img.width)));
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, W, H);
    const px = ctx.getImageData(0, 0, W, H).data;
    const escalaX = W / (img.naturalWidth || img.width), escalaY = H / (img.naturalHeight || img.height);
    const fora = new Uint8Array(W * H);
    for (const [bx, by, bw, bh] of excluir) {
        for (let y = Math.max(0, Math.floor(by * escalaY)); y < Math.min(H, Math.ceil((by + bh) * escalaY)); y++)
            for (let x = Math.max(0, Math.floor(bx * escalaX)); x < Math.min(W, Math.ceil((bx + bw) * escalaX)); x++) fora[y * W + x] = 1;
    }

    // Brilho (V) e saturação (S) de cada ponto da grade
    const V = new Float32Array(W * H);
    const S = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) {
        const r = px[i * 4] / 255, g = px[i * 4 + 1] / 255, b = px[i * 4 + 2] / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        V[i] = max;
        S[i] = max ? (max - min) / max : 0;
    }
    // Brilho médio da vizinhança larga (imagem integral): o telão tem luz própria e fica
    // mais claro que o entorno, mesmo mostrando branco (logo) ou com o céu ao fundo.
    const R = Math.max(4, Math.round(W / 12));
    const integral = new Float64Array((W + 1) * (H + 1));
    for (let y = 0; y < H; y++) {
        let linha = 0;
        for (let x = 0; x < W; x++) {
            linha += V[y * W + x];
            integral[(y + 1) * (W + 1) + x + 1] = integral[y * (W + 1) + x + 1] + linha;
        }
    }
    const fundo = (x: number, y: number) => {
        const x0 = Math.max(0, x - R), x1 = Math.min(W, x + R + 1), y0 = Math.max(0, y - R), y1 = Math.min(H, y + R + 1);
        const s = integral[y1 * (W + 1) + x1] - integral[y0 * (W + 1) + x1] - integral[y1 * (W + 1) + x0] + integral[y0 * (W + 1) + x0];
        return s / ((x1 - x0) * (y1 - y0));
    };
    const score = new Float32Array(W * H);
    for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
            const i = y * W + x;
            if (V[i] < 0.4 || fora[i]) continue;
            // Variação local (texto e imagem na tela) em janela 3x3
            let soma = 0, soma2 = 0;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const v = V[(y + dy) * W + x + dx]; soma += v; soma2 += v * v; }
            const textura = Math.min(1, Math.sqrt(Math.max(0, soma2 / 9 - (soma / 9) ** 2)) * 5);
            const luzPropria = Math.max(0, V[i] - fundo(x, y));
            // Céu, parede e capô: claros mas lisos e sem cor
            if (S[i] < 0.15 && textura < 0.15 && luzPropria < 0.15) continue;
            score[i] = V[i] * (0.35 * S[i] + 0.35 * textura + 1.2 * luzPropria);
        }
    }
    if (pino) return telaEmVoltaDoPino(score, W, H, pino);

    // Corte: os 10% de pontos mais fortes
    const ordenados = Array.from(score).filter((v) => v > 0).sort((a, b) => b - a);
    if (ordenados.length < W * H * 0.01) return null;
    const corte = ordenados[Math.floor(ordenados.length * 0.1)] ?? ordenados[ordenados.length - 1];

    // Regiões contínuas acima do corte (vizinhança de 4)
    const visto = new Uint8Array(W * H);
    let melhor: { x0: number; y0: number; x1: number; y1: number; n: number; nota: number } | null = null;
    for (let i = 0; i < W * H; i++) {
        if (visto[i] || score[i] < corte) continue;
        const fila = [i];
        visto[i] = 1;
        let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0, massa = 0;
        while (fila.length) {
            const j = fila.pop()!;
            const x = j % W, y = (j / W) | 0;
            n++; massa += score[j];
            x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
            for (const k of [j - 1, j + 1, j - W, j + W]) {
                if (k < 0 || k >= W * H || visto[k] || score[k] < corte * 0.5) continue;
                if (Math.abs((k % W) - x) > 1) continue;
                visto[k] = 1;
                fila.push(k);
            }
        }
        const w = x1 - x0 + 1, h = y1 - y0 + 1;
        if (n < W * H * 0.005) continue; // pequeno demais (farol, placa)
        const preenchimento = n / (w * h); // telão é um retângulo cheio
        const centroY = (y0 + y1) / 2 / H;
        let nota = massa * (0.4 + preenchimento) * (1.15 - Math.max(0, centroY - 0.35)); // prefere a parte de cima
        if (centroY > 0.8) nota *= 0.2; // capô e asfalto
        if (y0 <= 1) nota *= 0.3; // encosta no topo: costuma ser céu ou corte de fachada
        if (w > W * 0.85) nota *= 0.3; // faixa de lado a lado: céu, fachada
        if (w / h > 6 || h / w > 6) nota *= 0.4; // fio, poste, faixa
        const regiao = { x0, y0, x1, y1, n, nota };
        if (!melhor || nota > melhor.nota) melhor = regiao;
    }
    if (!melhor) return null;
    return {
        x: ((melhor.x0 + melhor.x1 + 1) / 2 / W) * 100,
        y: ((melhor.y0 + melhor.y1 + 1) / 2 / H) * 100,
        w: ((melhor.x1 - melhor.x0 + 1) / W) * 100,
        h: ((melhor.y1 - melhor.y0 + 1) / H) * 100,
    };
}

/**
 * Telão em volta do pino: parte do ponto mais forte perto do pino (até 8% da largura) e cresce
 * pelos vizinhos com pelo menos 35% da força dele, sem passar de uma janela em volta do pino.
 * Sem nada luminoso perto, ou se a região fugir do pino, o próprio pino é o centro do telão.
 */
function telaEmVoltaDoPino(score: Float32Array, W: number, H: number, pino: Ponto) {
    const px = Math.round((pino.x / 100) * (W - 1)), py = Math.round((pino.y / 100) * (H - 1));
    const raio = Math.max(3, Math.round(W * 0.08));
    let semente = -1, forca = 0;
    for (let y = Math.max(0, py - raio); y <= Math.min(H - 1, py + raio); y++)
        for (let x = Math.max(0, px - raio); x <= Math.min(W - 1, px + raio); x++)
            if (score[y * W + x] > forca) { forca = score[y * W + x]; semente = y * W + x; }
    const soPino = { x: pino.x, y: pino.y, w: 0, h: 0 };
    if (semente < 0) return soPino;

    const janela = Math.round(W * 0.3);
    const visto = new Uint8Array(W * H);
    const fila = [semente];
    visto[semente] = 1;
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    while (fila.length) {
        const j = fila.pop()!;
        const x = j % W, y = (j / W) | 0;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        for (const k of [j - 1, j + 1, j - W, j + W]) {
            if (k < 0 || k >= W * H || visto[k] || score[k] < forca * 0.35) continue;
            const kx = k % W, ky = (k / W) | 0;
            if (Math.abs(kx - x) > 1 || Math.abs(kx - px) > janela || Math.abs(ky - py) > janela) continue;
            visto[k] = 1;
            fila.push(k);
        }
    }
    const tela = {
        x: ((x0 + x1 + 1) / 2 / W) * 100,
        y: ((y0 + y1 + 1) / 2 / H) * 100,
        w: ((x1 - x0 + 1) / W) * 100,
        h: ((y1 - y0 + 1) / H) * 100,
    };
    // Região que não cobre o pino nem fica perto dele: confia no pino
    return Math.hypot(tela.x - pino.x, tela.y - pino.y) > 15 ? soPino : tela;
}

/**
 * Analisa uma foto e devolve o foco. Telão encontrado: foco nele, puxado 25% na direção
 * do movimento (veículos e pessoas). Só movimento: centro ponderado do tráfego, um pouco
 * acima (os telões ficam no alto). Nada reconhecido: null (o card usa o centro).
 * Com pino (marcado à mão na edição), o telão é procurado em volta dele e sempre existe.
 */
export async function detectarFoco(url: string, pino?: Ponto): Promise<FocoFoto | null> {
    const [m, img] = await Promise.all([carregarModelo(), carregarImagem(thumb(url, 640))]);
    const achados = (await m.detect(img, 30, 0.35)).filter((d) => NOMES[d.class]);
    // Semáforo e veículos (lanternas) brilham, mas não são telão
    const telaAparencia = detectarTelaPorAparencia(img, achados.filter((d) => d.class === 'traffic light' || (MOVIMENTO.has(d.class) && d.class !== 'person')).map((d) => {
        // O brilho do semáforo vaza da caixa: exclui uma margem de 60% em volta
        const [x, y, w, h] = d.bbox;
        const m = d.class === 'traffic light' ? 0.6 : 0;
        return [x - w * m, y - h * m, w * (1 + 2 * m), h * (1 + 2 * m)] as [number, number, number, number];
    }), pino);
    if (!achados.length && !telaAparencia) return null;
    const W = img.naturalWidth || img.width;
    const H = img.naturalHeight || img.height;

    const centro = (lista: typeof achados) => {
        let sx = 0, sy = 0, peso = 0;
        for (const d of lista) {
            const [x, y, w, h] = d.bbox;
            const p = d.score * Math.sqrt(w * h);
            sx += (x + w / 2) * p;
            sy += (y + h / 2) * p;
            peso += p;
        }
        return peso ? { x: (sx / peso / W) * 100, y: (sy / peso / H) * 100 } : null;
    };

    const telas = achados.filter((d) => TELA.has(d.class));
    const movimento = achados.filter((d) => MOVIMENTO.has(d.class));
    // Telão: o que o modelo reconheceu como tela ou, sem isso, o detector de aparência
    const cTela = pino && telaAparencia
        ? { x: telaAparencia.x, y: telaAparencia.y }
        : centro(telas) ?? (telaAparencia ? { x: telaAparencia.x, y: telaAparencia.y } : null);
    const cMov = centro(movimento);
    let foco: { x: number; y: number };
    if (cTela && cMov) foco = { x: cTela.x * 0.75 + cMov.x * 0.25, y: cTela.y * 0.75 + cMov.y * 0.25 };
    else if (cTela) foco = cTela;
    else foco = { x: cMov!.x, y: cMov!.y - 12 };

    const objetos = [...new Set([...(cTela ? ['telão'] : []), ...achados.filter((d) => !TELA.has(d.class)).map((d) => NOMES[d.class])])];
    return { x: limitar(foco.x), y: limitar(foco.y), fonte: 'auto', objetos, ...(pino ? { pino } : {}) };
}

export { estiloFoco } from '@/lib/imagens';
