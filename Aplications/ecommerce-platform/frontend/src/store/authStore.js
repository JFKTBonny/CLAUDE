import { create } from 'zustand';
import api from '../api/client';

export const useAuthStore = create((set) => ({
    user:  JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,

    login: async (email, password) => {
        const res = await api.post('/users/login', { email, password });
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ token, user });
        return user;
    },

    register: async (data) => {
        const res = await api.post('/users/register', data);
        return res.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null });
        window.location.href = '/login';
    },

    isAdmin: () => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        return user?.role === 'admin';
    }
}));
