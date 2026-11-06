import { api } from '@/lib/axios';

export type IndicatorsPeriod = 7 | 30 | 90 | 180 | 365;

/** Metas dos processos (Gestão → Indicadores → Metas de SLA). */
export interface Sla {
    primeiraRespostaHoras: number;
    propostaHoras: number;
    fechamentoDias: number;
    paradoDias: number;
    pedidoAprovacaoHoras: number;
    contatoRespostaHoras: number;
}

export interface Processo {
    id: string;
    nome: string;
    dono: string;
    descricao: string;
    meta: string;
    unidade: string;
    mediaMedida: number | null;
    medianaMedida: number | null;
    amostras: number;
    cumprimentoPct: number | null;
    emAtraso: number;
}

export interface Indicators {
    periodo: { dias: number; de: string; ate: string };
    sla: Sla;
    kpis: {
        leadsNovos: number; ganhos: number; perdidos: number; taxaConversaoPct: number | null;
        receitaGanha: number; ticketMedio: number | null; pipelineAberto: number; previsaoPonderada: number;
        negociosAbertos: number; leadTimeMedioDias: number | null; cicloVendaMedioDias: number | null;
        primeiraRespostaMediaHoras: number | null; slaCumprimentoPct: number | null; emAtraso: number;
    };
    processos: Processo[];
    etapas: { etapa: string; nome: string; abertos: number; valorAberto: number; tempoMedioHoras: number | null; tempoMedianoHoras: number | null; passagens: number; idadeMediaAbertosHoras: number | null }[];
    gargalo: { etapa: string; nome: string; tempoMedioHoras: number | null } | null;
    comerciais: {
        id: string; nome: string; perfil: string; negociosNoPeriodo: number; abertos: number; ganhos: number; perdidos: number;
        taxaConversaoPct: number | null; receita: number; ticketMedio: number | null; pipelineAberto: number;
        primeiraRespostaMediaHoras: number | null; primeiraRespostaNoPrazoPct: number | null; leadTimeMedioDias: number | null;
        tempoPorEtapaHoras: Record<string, number | null>; atividadesConcluidas: number; atividadesAtrasadas: number; parados: number;
    }[];
    alertas: { tipo: 'sem-dono' | 'parado' | 'atividade' | 'contato'; titulo: string; negocioId: string | null; negocio: string | null; cliente: string; comercial: string | null; desde: string; horas: number | null }[];
    semanas: { inicio: string; leads: number; ganhos: number; perdidos: number }[];
}

export const indicatorsService = {
    async get(days: IndicatorsPeriod): Promise<Indicators> {
        const { data } = await api.get('/reports/indicators', { params: { days } });
        return data;
    },
    async getSla(): Promise<Sla> {
        const { data } = await api.get('/reports/sla');
        return data;
    },
    async updateSla(sla: Sla): Promise<Sla> {
        const { data } = await api.put('/reports/sla', sla);
        return data;
    },
};
