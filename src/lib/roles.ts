const LABELS: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gestor',
    COMERCIAL: 'Comercial',
    COMPANY: 'Empresa',
    USER: 'Cliente',
};

/** Nome do papel para exibir na interface (o enum do banco fica em caixa-alta e em inglês). */
export const roleLabel = (role?: string | null) => (role && LABELS[role]) || 'Comercial';
