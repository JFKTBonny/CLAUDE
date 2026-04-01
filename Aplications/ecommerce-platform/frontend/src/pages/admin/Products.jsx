import React, { useState, useEffect } from 'react';
import api from '../../api/client';

const styles = {
    page:   { maxWidth: '1100px', margin: '2rem auto', padding: '0 2rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    title:  { fontSize: '1.8rem', fontWeight: 'bold', color: '#1a1a2e' },
    btn:    { padding: '10px 20px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    table:  { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    th:     { background: '#1a1a2e', color: '#fff', padding: '12px 16px', textAlign: 'left', fontSize: '0.9rem' },
    td:     { padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' },
    actions:{ display: 'flex', gap: '8px' },
    editBtn:{ padding: '4px 12px', background: '#2196f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
    delBtn: { padding: '4px 12px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
    form:   { background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1.5rem' },
    input:  { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' },
    row:    { display: 'flex', gap: '1rem' },
    saveBtn:{ padding: '10px 24px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    cancBtn:{ padding: '10px 24px', background: '#888', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '8px' }
};

const EMPTY = { name: '', price: '', sku: '', stock: '', category_id: '', description: '', image_url: '' };

export default function AdminProducts() {
    const [products,   setProducts]   = useState([]);
    const [categories, setCategories] = useState([]);
    const [showForm,   setShowForm]   = useState(false);
    const [editId,     setEditId]     = useState(null);
    const [form,       setForm]       = useState(EMPTY);

    const load = () => {
        api.get('/products').then(r => setProducts(r.data));
        api.get('/categories').then(r => setCategories(r.data));
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock), category_id: form.category_id ? parseInt(form.category_id) : null };
        try {
            if (editId) await api.patch(`/products/${editId}`, payload);
            else        await api.post('/products', payload);
            setShowForm(false); setEditId(null); setForm(EMPTY); load();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed');
        }
    };

    const handleEdit = (p) => {
        setForm({ name: p.name, price: p.price, sku: p.sku, stock: p.stock, category_id: p.category_id || '', description: p.description || '', image_url: p.image_url || '' });
        setEditId(p.id); setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this product?')) return;
        await api.delete(`/products/${id}`);
        load();
    };

    const set = f => e => setForm(v => ({ ...v, [f]: e.target.value }));

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>📦 Products</h1>
                <button style={styles.btn} onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY); }}>
                    {showForm ? 'Cancel' : '+ New Product'}
                </button>
            </div>

            {showForm && (
                <form style={styles.form} onSubmit={handleSubmit}>
                    <h3 style={{ marginBottom: '1rem' }}>{editId ? 'Edit Product' : 'New Product'}</h3>
                    <div style={styles.row}>
                        <input style={styles.input} placeholder="Name *" value={form.name} onChange={set('name')} required />
                        <input style={styles.input} placeholder="SKU *"  value={form.sku}  onChange={set('sku')}  required />
                    </div>
                    <div style={styles.row}>
                        <input style={styles.input} placeholder="Price *" type="number" step="0.01" value={form.price} onChange={set('price')} required />
                        <input style={styles.input} placeholder="Stock *" type="number" value={form.stock} onChange={set('stock')} required />
                    </div>
                    <div style={styles.row}>
                        <select style={styles.input} value={form.category_id} onChange={set('category_id')}>
                            <option value="">No category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input style={styles.input} placeholder="Image URL" value={form.image_url} onChange={set('image_url')} />
                    </div>
                    <textarea style={{...styles.input, resize: 'vertical', minHeight: '60px'}}
                        placeholder="Description" value={form.description} onChange={set('description')} />
                    <button style={styles.saveBtn} type="submit">{editId ? 'Update' : 'Create'}</button>
                    <button style={styles.cancBtn} type="button" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
                </form>
            )}

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>SKU</th>
                        <th style={styles.th}>Category</th>
                        <th style={styles.th}>Price</th>
                        <th style={styles.th}>Stock</th>
                        <th style={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p.id}>
                            <td style={styles.td}>{p.name}</td>
                            <td style={styles.td}>{p.sku}</td>
                            <td style={styles.td}>{p.category?.name || '—'}</td>
                            <td style={styles.td}>${p.price.toFixed(2)}</td>
                            <td style={styles.td}>{p.stock}</td>
                            <td style={styles.td}>
                                <div style={styles.actions}>
                                    <button style={styles.editBtn} onClick={() => handleEdit(p)}>Edit</button>
                                    <button style={styles.delBtn}  onClick={() => handleDelete(p.id)}>Delete</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
