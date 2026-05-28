import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useRoleAccess } from '../hooks/useRoleAccess';

const Layout = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { canViewAlerts, canViewFraud } = useRoleAccess(user?.role);

  const handleLogout = () => {
    localStorage.removeItem('fintrans_auth_token');
    onLogout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #090d16 0%, #111026 50%, #1f0a2a 100%)', color: '#fff' }}>
      <header style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>ФинТранс</h2>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>📊 Дашборд</Link>
            <Link to="/clients" style={{ color: '#fff', textDecoration: 'none' }}>👥 Клиенты</Link>
            <Link to="/transactions" style={{ color: '#fff', textDecoration: 'none' }}>💸 Транзакции</Link>
            {canViewAlerts && <Link to="/alerts" style={{ color: '#fff', textDecoration: 'none' }}>⚠️ Fraud-алерты</Link>}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', opacity: 0.8 }}>{user?.full_name || user?.username} ({user?.role})</span>
          <button onClick={handleLogout} style={{ background: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>Выйти</button>
        </div>
      </header>
      <main style={{ padding: '24px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;