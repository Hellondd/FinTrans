import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/ClientsPage';
import TransactionsPage from './pages/TransactionsPage';
import FraudAlertsPage from './pages/FraudAlertsPage';
import { getCurrentUser, login } from './services/api';

// Компонент страницы входа
const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(username, password);
      localStorage.setItem('fintrans_auth_token', res.data.access_token);
      onLoginSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #090d16, #1f0a2a)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', padding: '40px', borderRadius: '20px', width: '400px' }}>
        <h2 style={{ textAlign: 'center', color: '#fff' }}>ФинТранс</h2>
        {error && <div style={{ color: '#fca5a5', background: '#7f1d1d', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Логин" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #475569', background: '#1e293b', color: '#fff' }} />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '24px', borderRadius: '8px', border: '1px solid #475569', background: '#1e293b', color: '#fff' }} />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#6366f1', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>{loading ? 'Вход...' : 'Войти'}</button>
        </form>
      </div>
    </div>
  );
};

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const res = await getCurrentUser();
      setUser(res.data);
      setIsAuth(true);
    } catch (err) {
      localStorage.removeItem('fintrans_auth_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('fintrans_auth_token');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = () => {
    fetchUserProfile();
  };

  const handleLogout = () => {
    localStorage.removeItem('fintrans_auth_token');
    setIsAuth(false);
    setUser(null);
  };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>Загрузка...</div>;

  if (!isAuth) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
          <Route index element={<Dashboard user={user} onLogout={handleLogout} currentTheme="purple" />} />
          <Route path="clients" element={<ClientsPage user={user} />} />
          <Route path="transactions" element={<TransactionsPage user={user} />} />
          <Route path="alerts" element={<FraudAlertsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;