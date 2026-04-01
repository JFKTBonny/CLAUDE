import { create } from 'zustand';
import api from '../api/client';

export const useCartStore = create((set, get) => ({
    cart: { items: [], total: 0, count: 0 },
    loading: false,

    fetchCart: async () => {
        try {
            const res = await api.get('/cart');
            set({ cart: res.data });
        } catch {}
    },

    addToCart: async (productId, quantity = 1) => {
        await api.post('/cart', { product_id: productId, quantity });
        get().fetchCart();
    },

    updateQuantity: async (productId, quantity) => {
        await api.patch(`/cart/${productId}`, { quantity });
        get().fetchCart();
    },

    removeFromCart: async (productId) => {
        await api.delete(`/cart/${productId}`);
        get().fetchCart();
    },

    clearCart: async () => {
        await api.delete('/cart');
        set({ cart: { items: [], total: 0, count: 0 } });
    },

    checkout: async (notes = '') => {
        const res = await api.post('/cart/checkout', { notes });
        set({ cart: { items: [], total: 0, count: 0 } });
        return res.data;
    }
}));
