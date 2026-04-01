import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const styles = {
    page:  { maxWidth: '1100px', margin: '2rem auto', padding: '0 2rem' },
    title: { fontSize: '1.8rem', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '1.5rem' },
    grid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
    card:  { background: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' },
    num:   { fontSize: '2.5rem', fontWeight: 'bold', color: '#e94560' },
    label: { color: '#666', marginTop: '4px' },
    links: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
    link:  { background: '#1a1a2e', color: '#fff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }
};

export default function Dashboard() {
    const [stats, setStats] = useState({ products: 0, orders: 0, users: 0 });

    useEffect(() => {
        Promise.all([
            api.get('/products'),
            api.get('/orders')
        ]).then(([prod, ord]) => {
            setStats({ products: prod.data.length, orders: ord.data.length });
        }).catch(() => {});
    }, []);

    return (
        <div style={styles.page}>
            <h1 style={styles.title}>⚙️ Admin Dashboard</h1>
            <div style={styles.grid}>
                <div style={styles.card}>
                    <p style={styles.num}>{stats.products}</p>
                    <p style={styles.label}>Products</p>
                </div>
                <div style={styles.card}>
                    <p style={styles.num}>{stats.orders}</p>
                    <p style={styles.label}>Orders</p>
                </div>
            </div>
            <div style={styles.links}>
                <Link to="/admin/products" style={styles.link}>📦 Manage Products</Link>
                <Link to="/admin/orders"   style={styles.link}>🧾 Manage Orders</Link>
                <Link to="/"               style={styles.link}>🛍️ View Storefront</Link>
            </div>
        </div>
    );
}
