import React, { useState, useEffect } from 'react';
import api from '../api/client';

const STATUS_COLORS = {
    PENDING:   '#ffa500',
    CONFIRMED: '#2196f3',
    SHIPPED:   '#9c27b0',
    DELIVERED: '#4caf50',
    CANCELLED: '#f44336'
};

const styles = {
    page:   { maxWidth: '900px', margin: '2rem auto', padding: '0 2rem' },
    title:  { fontSize: '1.8rem', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '1.5rem' },
    card:   { background: '#fff', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
    id:     { fontWeight: 'bold', fontSize: '1rem', color: '#1a1a2e' },
    badge:  (status) => ({ background: STATUS_COLORS[status] || '#888', color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem' }),
    item:   { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' },
    total:  { fontWeight: 'bold', color: '#e94560', textAlign: 'right', marginTop: '8px' },
    date:   { color: '#888', fontSize: '0.8rem' },
    empty:  { textAlign: 'center', padding: '3rem', color: '#888' }
};

export default function Orders() {
    const [orders,  setOrders]  = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/orders').then(r => {
            setOrders(r.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>Loading orders...</p>;

    if (orders.length === 0) return (
        <div style={styles.page}>
            <h1 style={styles.title}>📦 My Orders</h1>
            <div style={styles.empty}>
                <p style={{ fontSize: '3rem' }}>📦</p>
                <p>No orders yet</p>
            </div>
        </div>
    );

    return (
        <div style={styles.page}>
            <h1 style={styles.title}>📦 My Orders</h1>
            {orders.map(order => (
                <div key={order.id} style={styles.card}>
                    <div style={styles.header}>
                        <div>
                            <span style={styles.id}>Order #{order.id}</span>
                            <span style={styles.date}> • {new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        <span style={styles.badge(order.status)}>{order.status}</span>
                    </div>
                    {order.items?.map(item => (
                        <div key={item.id} style={styles.item}>
                            <span>Product #{item.product_id} × {item.quantity}</span>
                            <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    {order.notes && <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '8px' }}>Note: {order.notes}</p>}
                    <p style={styles.total}>Total: ${order.total_price.toFixed(2)}</p>
                </div>
            ))}
        </div>
    );
}
