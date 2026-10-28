/** Data local no formato yyyy-mm-dd (sem conversão para UTC). */
export function toDateKey(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Representa um dia de calendário como meio-dia UTC.
 * Assim a data salva continua no mesmo dia em qualquer fuso do Brasil.
 */
export function dateKeyToISO(dateKey: string) {
    return `${dateKey}T12:00:00.000Z`;
}
