/**
 * Dados institucionais exibidos em contratos e documentos.
 * CNPJ real da empresa (o mesmo do rodapé do site).
 */
export const COMPANY_NAME = 'T3 LED Mídia e Tecnologia';
// CNPJ publicado no site institucional; VITE_COMPANY_CNPJ permite sobrescrever
export const COMPANY_CNPJ = (import.meta.env.VITE_COMPANY_CNPJ as string | undefined)?.trim() || '43.773.494/0001-50';

export const COMPANY_FOOTER = COMPANY_CNPJ ? `${COMPANY_NAME} • CNPJ: ${COMPANY_CNPJ}` : COMPANY_NAME;
