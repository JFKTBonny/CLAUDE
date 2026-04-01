import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const styles = {
    container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' },
    card: { background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '380px' },
    title: { fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1a1a2e', textAlign: 'center' },
    row:   { display: 'flex', gap: '8px' },
    input: { width: '100%', padding: '10px', margin: '8px 0', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.95rem' },
    btn:   { width: '100%', padding: '12px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', marginTop: '1rem' },
    error: { color: 'red', fontSize: '0.85rem', marginTop: '8px' },
    link:  { textAlign: 'center', marginTop: '1rem', color: '#666' }
};

export default function Register() {
    const [form, setForm]     = useState({ firstName: '', lastName: '', email: '', password: '' });
    const [error, setError]   = useState('');
    const [loading, setLoading] = useState(false);
    const { register }        = useAuthStore();
    const navigate            = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>🛍️ Create Account</h1>
                <form onSubmit={handleSubmit}>
                    <div style={styles.row}>
                        <input style={styles.input} placeholder="First name" value={form.firstName} onChange={set('firstName')} required />
                        <input style={styles.input} placeholder="Last name"  value={form.lastName}  onChange={set('lastName')}  required />
                    </div>
                    <input style={styles.input} type="email"    placeholder="Email"    value={form.email}    onChange={set('email')}    required />
                    <input style={styles.input} type="password" placeholder="Password" value={form.password} onChange={set('password')} required />
                    {error && <p style={styles.error}>{error}</p>}
                    <button style={styles.btn} disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>
                <p style={styles.link}>
                    Have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
