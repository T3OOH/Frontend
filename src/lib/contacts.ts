/**
 * Atendentes comerciais (WhatsApp) usados no site.
 * Fonte única: Contato, Mapa, Perfil e widget de suporte leem daqui.
 */
export const ATTENDANTS = [
    { id: 'victor', name: 'Victor Hugo', fullName: 'Victor Hugo Dourado', phone: '556293206010' },
    { id: 'lucas', name: 'Lucas Dourado', fullName: 'Lucas Dourado', phone: '556492832807' }
];

export const SELLERS_PHONES = ATTENDANTS.map((attendant) => attendant.phone);

/** Telefone padrão quando não há vendedor atribuído. */
export const DEFAULT_SALES_PHONE = SELLERS_PHONES[0];

/** Escolhe o próximo vendedor em rodízio (persistido no navegador). */
export function nextSellerPhone() {
    let lastIndex = 0;
    try {
        lastIndex = parseInt(localStorage.getItem('@t3:lastSeller') || '0', 10) || 0;
    } catch { /* navegador sem storage */ }

    const nextIndex = (lastIndex + 1) % SELLERS_PHONES.length;
    try {
        localStorage.setItem('@t3:lastSeller', String(nextIndex));
    } catch { /* navegador sem storage */ }

    return SELLERS_PHONES[nextIndex];
}
