import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

const styles = {
    container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' },
    card: { background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '380px' },
    title: { fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1a1a2e', textAlign: 'center' },
    input: { width: '100%', padding: '10px', margin: '8px 0', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.95rem' },
    btn:   { width: '100%', padding: '12px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', marginTop: '1rem' },
    error: { color: 'red', fontSize: '0.85rem', marginTop: '8px' },
    link:  { textAlign: 'center', marginTop: '1rem', color: '#666' }
};

export default function Login() {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const { login }               = useAuthStore();
    const { fetchCart }           = useCartStore();
    const navigate                = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(email, password);
            await fetchCart();
            navigate(user.role === 'admin' ? '/admin' : '/');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>🛍️ Sign In</h1>
                <form onSubmit={handleSubmit}>
                    <input style={styles.input} type="email" placeholder="Email"
                        value={email} onChange={e => setEmail(e.target.value)} required />
                    <input style={styles.input} type="password" placeholder="Password"
                        value={password} onChange={e => setPassword(e.target.value)} required />
                    {error && <p style={styles.error}>{error}</p>}
                    <button style={styles.btn} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <p style={styles.link}>
                    No account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}
