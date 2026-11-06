import { api } from '@/lib/axios';

/** Balão de dúvidas do site (IA T3). Rotas públicas /assistente da API. */
export type Destino = 'comercial' | 'gestao' | 'tecnico';
export interface Tema {
    id: string;
    titulo: string;
    destino: Destino;
    respostas: { pergunta: string; resposta: string }[];
}
export interface InicioIa {
    nome: string;
    saudacao: string;
    iaAtiva: boolean;
    temas: Tema[];
    destinos: Record<Destino, { titulo: string; texto: string }>;
}
export interface MensagemIa { de: 'visitante' | 'ia'; texto: string }
export interface RespostaIa { resposta: string; encaminhar: 'nenhum' | Destino; motivo: string }

export const assistenteService = {
    async inicio(): Promise<InicioIa> {
        return (await api.get('/assistente')).data;
    },
    async perguntar(tema: string, mensagens: MensagemIa[]): Promise<RespostaIa> {
        return (await api.post('/assistente/mensagem', { tema, mensagens: mensagens.slice(-16), pagina: location.pathname }, { timeout: 60_000 })).data;
    },
    async encaminhar(dados: {
        destino: Destino; tema: string; nome: string; telefone: string; email?: string; empresa?: string;
        motivo?: string; mensagens: MensagemIa[]; site?: string;
    }): Promise<{ protocolo: string; destino: Destino }> {
        return (await api.post('/assistente/encaminhar', { ...dados, mensagens: dados.mensagens.slice(-30), pagina: location.pathname })).data;
    },
};
