import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCartStore } from '../store/cartStore';

const styles = {
    page:    { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
    filters: { display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' },
    input:   { padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' },
    select:  { padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' },
    grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' },
    card:    { background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', cursor: 'pointer' },
    img:     { width: '100%', height: '180px', objectFit: 'cover', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' },
    body:    { padding: '1rem' },
    name:    { fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px', color: '#1a1a2e' },
    cat:     { color: '#888', fontSize: '0.8rem', marginBottom: '8px' },
    price:   { fontSize: '1.2rem', fontWeight: 'bold', color: '#e94560' },
    stock:   { fontSize: '0.8rem', color: '#666', marginTop: '4px' },
    btn:     { width: '100%', padding: '8px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' },
    loading: { textAlign: 'center', padding: '3rem', color: '#666' }
};

export default function Home() {
    const [products,   setProducts]   = useState([]);
    const [categories, setCategories] = useState([]);
    const [search,     setSearch]     = useState('');
    const [category,   setCategory]   = useState('');
    const [minPrice,   setMinPrice]   = useState('');
    const [maxPrice,   setMaxPrice]   = useState('');
    const [loading,    setLoading]    = useState(true);
    const { addToCart } = useCartStore();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search)   params.append('search', search);
        if (category) params.append('category', category);
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);

        api.get(`/products?${params}`).then(r => {
            setProducts(r.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [search, category, minPrice, maxPrice]);

    const handleAddToCart = async (e, productId) => {
        e.stopPropagation();
        try {
            await addToCart(productId, 1);
            alert('Added to cart!');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add to cart');
        }
    };

    return (
        <div style={styles.page}>
            <h1 style={{ marginBottom: '1.5rem', color: '#1a1a2e' }}>Products</h1>

            <div style={styles.filters}>
                <input style={styles.input} placeholder="🔍 Search products..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                <select style={styles.select} value={category}
                    onChange={e => setCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                </select>
                <input style={{...styles.input, width: '110px'}} placeholder="Min $"
                    type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                <input style={{...styles.input, width: '110px'}} placeholder="Max $"
                    type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>

            {loading ? (
                <p style={styles.loading}>Loading products...</p>
            ) : products.length === 0 ? (
                <p style={styles.loading}>No products found.</p>
            ) : (
                <div style={styles.grid}>
                    {products.map(p => (
                        <div key={p.id} style={styles.card}
                            onClick={() => navigate(`/products/${p.id}`)}>
                            <div style={styles.img}>
                                {p.image_url
                                    ? <img src={p.image_url} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                                    : '📦'}
                            </div>
                            <div style={styles.body}>
                                <p style={styles.name}>{p.name}</p>
                                <p style={styles.cat}>{p.category?.name || 'Uncategorized'}</p>
                                <p style={styles.price}>${p.price.toFixed(2)}</p>
                                <p style={styles.stock}>
                                    {p.stock > 0 ? `✅ ${p.stock} in stock` : '❌ Out of stock'}
                                </p>
                                <button style={styles.btn}
                                    disabled={p.stock === 0}
                                    onClick={e => handleAddToCart(e, p.id)}>
                                    🛒 Add to Cart
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
