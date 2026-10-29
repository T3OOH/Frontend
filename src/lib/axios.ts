import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AUTH_STORAGE_KEY, clearSession, readSession, refreshSession, validToken } from './session';

export { AUTH_STORAGE_KEY };

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
});

const isAuthRoute = (url?: string) => String(url ?? '').startsWith('/auth/');

// Cada requisição sai com um token de acesso válido (renovado antes de vencer)
api.interceptors.request.use(async (config) => {
    if (isAuthRoute(config.url) || config.headers.Authorization) return config;
    const token = await validToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
        const hadSession = Boolean(config?.headers?.Authorization);

        // Token recusado: tenta renovar uma vez e repete a requisição.
        // Erros de login/reset (/auth/*) são tratados pela própria tela.
        if (error.response?.status === 401 && hadSession && config && !isAuthRoute(config.url) && typeof window !== 'undefined') {
            if (!config._retried && readSession()?.refreshToken) {
                config._retried = true;
                const token = await refreshSession().catch(() => null);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                    return api(config);
                }
            }
            clearSession();
            window.location.assign('/login');
        }

        return Promise.reject(error);
    },
);
