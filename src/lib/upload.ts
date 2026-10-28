/** Tipos aceitos pelo backend (upload.middleware + bucket do Supabase). */
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Valida a imagem antes de enviar. Devolve a mensagem de erro ou null.
 * Fotos do iPhone (HEIC) e arquivos grandes falhavam só no servidor, sem explicação.
 */
export function validateImageFile(file: File): string | null {
    if (!IMAGE_ACCEPT.split(',').includes(file.type)) {
        return `"${file.name}" não é JPG, PNG ou WebP. Fotos do iPhone (HEIC) precisam ser convertidas antes.`;
    }
    if (file.size > MAX_IMAGE_BYTES) {
        return `"${file.name}" tem ${(file.size / 1024 / 1024).toFixed(1).replace('.', ',')} MB. O limite é 5 MB.`;
    }
    return null;
}

/** Extrai a mensagem útil de um erro do axios (error, message ou o primeiro detalhe do zod). */
export function apiErrorMessage(error: unknown, fallback: string): string {
    const data = (error as { response?: { data?: { error?: string; message?: string; details?: { message?: string }[]; issues?: { message?: string }[] } } }).response?.data;
    return data?.details?.[0]?.message || data?.issues?.[0]?.message || data?.error || data?.message || fallback;
}
