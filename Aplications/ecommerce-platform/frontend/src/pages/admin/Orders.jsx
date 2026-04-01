import React, { useState, useEffect } from 'react';
import api from '../../api/client';

const STATUS_COLORS = {
    PENDING:   '#ffa500', CONFIRMED: '#2196f3',
    SHIPPED:   '#9c27b0', DELIVERED: '#4caf50', CANCELLED: '#f44336'
};

const TRANSITIONS = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [], CANCELLED: []
};

const styles = {
    page:   { maxWidth: '1100px', margin: '2rem auto', padding: '0 2rem' },
    title:  { fontSize: '1.8rem', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '1.5rem' },
    card:   { background: '#fff', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' },
    badge:  (s) => ({ background: STATUS_COLORS[s] || '#888', color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem' }),
    btn:    (s) => ({ padding: '5px 12px', background: STATUS_COLORS[s] || '#888', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', margin: '2px' }),
    item:   { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f5f5f5', fontSize: '0.9rem' },
    total:  { fontWeight: 'bold', color: '#e94560', textAlign: 'right', marginTop: '8px' }
};

export default function AdminOrders() {
    const [orders,  setOrders]  = useState([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        api.get('/orders').then(r => { setOrders(r.data); setLoading(false); }).catch(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const updateStatus = async (orderId, status) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status });
            load();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update status');
        }
    };

    if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>;

    return (
        <div style={styles.page}>
            <h1 style={styles.title}>🧾 All Orders ({orders.length})</h1>
            {orders.map(order => (
                <div key={order.id} style={styles.card}>
                    <div style={styles.header}>
                        <div>
                            <strong>Order #{order.id}</strong>
                            <span style={{ color: '#888', fontSize: '0.85rem' }}> • User #{order.user_id} • {new Date(order.created_at).toLocaleString()}</span>
                        </div>
                        <span style={styles.badge(order.status)}>{order.status}</span>
                    </div>

                    {order.items?.map(item => (
                        <div key={item.id} style={styles.item}>
                            <span>Product #{item.product_id} × {item.quantity}</span>
                            <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}

                    {order.notes && <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '8px' }}>📝 {order.notes}</p>}
                    <p style={styles.total}>Total: ${order.total_price.toFixed(2)}</p>

                    <div style={{ marginTop: '12px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#666', marginRight: '8px' }}>Update status:</span>
                        {(TRANSITIONS[order.status] || []).map(s => (
                            <button key={s} style={styles.btn(s)} onClick={() => updateStatus(order.id, s)}>{s}</button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
