import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import Navbar    from './components/Navbar';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Home      from './pages/Home';
import Product   from './pages/Product';
import Cart      from './pages/Cart';
import Orders    from './pages/Orders';
import Dashboard from './pages/admin/Dashboard';
import Products  from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';

const ProtectedRoute = ({ children }) => {
    const { token } = useAuthStore();
    return token ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const { token, isAdmin } = useAuthStore();
    if (!token) return <Navigate to="/login" />;
    if (!isAdmin()) return <Navigate to="/" />;
    return children;
};

export default function App() {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                {/* Public */}
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Customer */}
                <Route path="/" element={
                    <ProtectedRoute><Home /></ProtectedRoute>
                } />
                <Route path="/products/:id" element={
                    <ProtectedRoute><Product /></ProtectedRoute>
                } />
                <Route path="/cart" element={
                    <ProtectedRoute><Cart /></ProtectedRoute>
                } />
                <Route path="/orders" element={
                    <ProtectedRoute><Orders /></ProtectedRoute>
                } />

                {/* Admin */}
                <Route path="/admin" element={
                    <AdminRoute><Dashboard /></AdminRoute>
                } />
                <Route path="/admin/products" element={
                    <AdminRoute><Products /></AdminRoute>
                } />
                <Route path="/admin/orders" element={
                    <AdminRoute><AdminOrders /></AdminRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
}
