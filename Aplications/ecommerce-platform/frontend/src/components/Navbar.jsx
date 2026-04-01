import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

const styles = {
    nav:   { background: '#1a1a2e', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' },
    brand: { color: '#e94560', fontSize: '1.4rem', fontWeight: 'bold', textDecoration: 'none' },
    links: { display: 'flex', gap: '1.5rem', alignItems: 'center' },
    link:  { color: '#fff', textDecoration: 'none', fontSize: '0.95rem' },
    badge: { background: '#e94560', color: '#fff', borderRadius: '50%', padding: '2px 7px', fontSize: '0.75rem', marginLeft: '4px' },
    btn:   { background: '#e94560', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' }
};

export default function Navbar() {
    const { user, logout, isAdmin } = useAuthStore();
    const { cart } = useCartStore();
    const navigate = useNavigate();

    if (!user) return null;

    return (
        <nav style={styles.nav}>
            <Link to="/" style={styles.brand}>🛍️ ECommerce</Link>
            <div style={styles.links}>
                <Link to="/"        style={styles.link}>Products</Link>
                <Link to="/orders"  style={styles.link}>My Orders</Link>
                <Link to="/cart"    style={styles.link}>
                    🛒 Cart
                    {cart.count > 0 && <span style={styles.badge}>{cart.count}</span>}
                </Link>
                {isAdmin() && (
                    <Link to="/admin" style={{...styles.link, color: '#ffd700'}}>⚙️ Admin</Link>
                )}
                <span style={{color: '#aaa', fontSize: '0.85rem'}}>
                    {user.firstName} ({user.role})
                </span>
                <button style={styles.btn} onClick={logout}>Logout</button>
            </div>
        </nav>
    );
}
