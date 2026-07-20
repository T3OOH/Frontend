import axios from 'axios';

export const AUTH_STORAGE_KEY = '@t3ooh:session';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            delete api.defaults.headers.common.Authorization;
            window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
            window.location.assign('/login');
        }

        return Promise.reject(error);
    },
);
