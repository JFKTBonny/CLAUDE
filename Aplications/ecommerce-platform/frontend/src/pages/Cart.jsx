import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

const styles = {
    page:    { maxWidth: '800px', margin: '2rem auto', padding: '0 2rem' },
    title:   { fontSize: '1.8rem', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '1.5rem' },
    empty:   { textAlign: 'center', padding: '3rem', color: '#888' },
    item:    { background: '#fff', borderRadius: '8px', padding: '1rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
    info:    { flex: 1 },
    name:    { fontWeight: 'bold', color: '#1a1a2e' },
    price:   { color: '#888', fontSize: '0.9rem' },
    qty:     { padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', width: '60px' },
    sub:     { fontWeight: 'bold', color: '#e94560', minWidth: '80px', textAlign: 'right' },
    del:     { background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: '1.2rem' },
    summary: { background: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginTop: '1rem' },
    total:   { fontSize: '1.4rem', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '1rem' },
    btn:     { width: '100%', padding: '12px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer' }
};

export default function Cart() {
    const { cart, fetchCart, updateQuantity, removeFromCart, checkout } = useCartStore();
    const [loading, setLoading] = useState(false);
    const [notes,   setNotes]   = useState('');
    const navigate = useNavigate();

    useEffect(() => { fetchCart(); }, []);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const result = await checkout(notes);
            alert(`✅ Order #${result.order.id} placed successfully!`);
            navigate('/orders');
        } catch (err) {
            alert('❌ ' + (err.response?.data?.error || 'Checkout failed'));
        } finally {
            setLoading(false);
        }
    };

    if (cart.items.length === 0) return (
        <div style={styles.page}>
            <h1 style={styles.title}>🛒 Cart</h1>
            <div style={styles.empty}>
                <p style={{ fontSize: '3rem' }}>🛒</p>
                <p>Your cart is empty</p>
                <button style={{...styles.btn, width: 'auto', padding: '10px 24px', marginTop: '1rem'}}
                    onClick={() => navigate('/')}>Browse Products</button>
            </div>
        </div>
    );

    return (
        <div style={styles.page}>
            <h1 style={styles.title}>🛒 Cart ({cart.count} items)</h1>

            {cart.items.map(item => (
                <div key={item.id} style={styles.item}>
                    <div style={{ fontSize: '2rem' }}>📦</div>
                    <div style={styles.info}>
                        <p style={styles.name}>{item.product?.name || `Product #${item.product_id}`}</p>
                        <p style={styles.price}>${item.product?.price?.toFixed(2)} each</p>
                    </div>
                    <input style={styles.qty} type="number" min="1" value={item.quantity}
                        onChange={e => updateQuantity(item.product_id, parseInt(e.target.value))} />
                    <p style={styles.sub}>${item.subtotal?.toFixed(2)}</p>
                    <button style={styles.del} onClick={() => removeFromCart(item.product_id)}>🗑️</button>
                </div>
            ))}

            <div style={styles.summary}>
                <p style={styles.total}>Total: ${cart.total.toFixed(2)}</p>
                <textarea
                    placeholder="Order notes (optional)..."
                    value={notes} onChange={e => setNotes(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '1rem', resize: 'vertical', minHeight: '60px' }}
                />
                <button style={styles.btn} onClick={handleCheckout} disabled={loading}>
                    {loading ? 'Placing order...' : '✅ Place Order'}
                </button>
            </div>
        </div>
    );
}
