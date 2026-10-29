/*
 * Opções da T3 Solution (venda e instalação de painéis de LED), usadas na página da Solution e
 * no CRM. Mesma lista do backend (src/lib/solution.ts): ao mudar aqui, mude lá também.
 */
export const SOLUTION_APPLICATIONS = [
    { title: 'Residências', text: 'Áreas de lazer, salas de cinema, espaços gourmet e fachadas de casas de alto padrão.' },
    { title: 'Condomínios', text: 'Avisos digitais para moradores e telas nas áreas comuns, com conteúdo atualizado de longe.' },
    { title: 'Empresas', text: 'Recepções, salas de reunião, painéis de indicadores e comunicação interna.' },
    { title: 'Comércio', text: 'Vitrines e pontos de venda com promoções que mudam ao longo do dia.' },
    { title: 'Empreendimentos', text: 'Lançamentos imobiliários, stands, empenas e grandes fachadas.' },
    { title: 'Sob medida', text: 'Formatos fora do padrão, respeitando as medidas e as restrições da arquitetura.' },
] as const;

export type SolutionApplication = (typeof SOLUTION_APPLICATIONS)[number]['title'];

export const SOLUTION_ENVIRONMENTS = [
    { value: 'indoor', label: 'Indoor', hint: 'pixel fino, vista de perto' },
    { value: 'outdoor', label: 'Outdoor', hint: 'brilho alto, sol e chuva' },
] as const;

export const SOLUTION_SERVICES = [
    { value: 'fornecimento', label: 'Fornecimento da tela' },
    { value: 'estrutura', label: 'Estrutura e fixação' },
    { value: 'instalacao', label: 'Instalação e configuração' },
    { value: 'conteudo', label: 'Gestão de conteúdo' },
    { value: 'manutencao', label: 'Manutenção e suporte' },
] as const;

/** Pixel pitch comuns (mm). */
export const SOLUTION_PITCHES = [1.5, 1.9, 2.5, 2.9, 3.9, 4.8, 6, 8, 10] as const;

export interface SolutionDetails {
    application?: SolutionApplication | null;
    environment?: 'indoor' | 'outdoor' | null;
    width?: number | null;
    height?: number | null;
    pitch?: number | null;
    services?: (typeof SOLUTION_SERVICES)[number]['value'][];
    notes?: string | null;
}

export type DealLine = 'OOH' | 'SOLUTION';

export const LINE_LABEL: Record<DealLine, string> = { OOH: 'T3 OOH', SOLUTION: 'T3 Solution' };

/** "4 × 2,5 m · 10 m² · P3,9 · Outdoor" para o resumo do projeto. */
export function solutionSummary(s?: SolutionDetails | null) {
    if (!s) return '';
    const n = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    const parts: string[] = [];
    if (s.width && s.height) parts.push(`${n(s.width)} × ${n(s.height)} m`, `${n(s.width * s.height)} m²`);
    if (s.pitch) parts.push(`P${n(s.pitch)}`);
    if (s.environment) parts.push(s.environment === 'indoor' ? 'Indoor' : 'Outdoor');
    return parts.join(' · ');
}
