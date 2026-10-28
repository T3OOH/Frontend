/**
 * Dados institucionais exibidos em contratos e documentos.
 * O CNPJ vem de VITE_COMPANY_CNPJ; sem ele, o rodapé não mostra um número inventado.
 */
export const COMPANY_NAME = 'T3 LED Mídia e Tecnologia';
export const COMPANY_CNPJ = (import.meta.env.VITE_COMPANY_CNPJ as string | undefined)?.trim() || '';

export const COMPANY_FOOTER = COMPANY_CNPJ ? `${COMPANY_NAME} • CNPJ: ${COMPANY_CNPJ}` : COMPANY_NAME;
