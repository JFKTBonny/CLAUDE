import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCartStore } from '../store/cartStore';

const styles = {
    page:  { maxWidth: '900px', margin: '2rem auto', padding: '0 2rem' },
    back:  { color: '#e94560', cursor: 'pointer', marginBottom: '1rem', display: 'inline-block' },
    card:  { background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' },
    img:   { width: '300px', height: '300px', background: '#eee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', flexShrink: 0 },
    info:  { flex: 1, minWidth: '250px' },
    name:  { fontSize: '1.8rem', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '8px' },
    cat:   { color: '#888', marginBottom: '12px' },
    price: { fontSize: '2rem', fontWeight: 'bold', color: '#e94560', marginBottom: '16px' },
    desc:  { color: '#555', lineHeight: '1.6', marginBottom: '16px' },
    stock: { marginBottom: '16px' },
    row:   { display: 'flex', gap: '1rem', alignItems: 'center' },
    qty:   { padding: '8px', border: '1px solid #ddd', borderRadius: '4px', width: '70px', fontSize: '1rem' },
    btn:   { padding: '12px 24px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer' }
};

export default function Product() {
    const { id }     = useParams();
    const navigate   = useNavigate();
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [msg, setMsg] = useState('');
    const { addToCart } = useCartStore();

    useEffect(() => {
        api.get(`/products/${id}`).then(r => setProduct(r.data)).catch(() => navigate('/'));
    }, [id]);

    if (!product) return <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>;

    const handleAdd = async () => {
        try {
            await addToCart(product.id, quantity);
            setMsg('✅ Added to cart!');
            setTimeout(() => setMsg(''), 2000);
        } catch (err) {
            setMsg('❌ ' + (err.response?.data?.error || 'Failed'));
        }
    };

    return (
        <div style={styles.page}>
            <span style={styles.back} onClick={() => navigate(-1)}>← Back</span>
            <div style={styles.card}>
                <div style={styles.img}>
                    {product.image_url
                        ? <img src={product.image_url} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'8px'}} />
                        : '📦'}
                </div>
                <div style={styles.info}>
                    <h1 style={styles.name}>{product.name}</h1>
                    <p style={styles.cat}>{product.category?.name || 'Uncategorized'} • SKU: {product.sku}</p>
                    <p style={styles.price}>${product.price.toFixed(2)}</p>
                    <p style={styles.desc}>{product.description || 'No description available.'}</p>
                    <p style={styles.stock}>
                        {product.stock > 0 ? `✅ ${product.stock} in stock` : '❌ Out of stock'}
                    </p>
                    {product.stock > 0 && (
                        <div style={styles.row}>
                            <input style={styles.qty} type="number" min="1" max={product.stock}
                                value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} />
                            <button style={styles.btn} onClick={handleAdd}>🛒 Add to Cart</button>
                        </div>
                    )}
                    {msg && <p style={{ marginTop: '12px', color: msg.startsWith('✅') ? 'green' : 'red' }}>{msg}</p>}
                </div>
            </div>
        </div>
    );
}
