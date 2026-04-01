import axios from 'axios';

// In production (Docker), call gateway directly
// In development (local), Vite proxy handles it
const BASE_URL = import.meta.env.PROD
    ? 'http://localhost:3000/api'
    : '/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
