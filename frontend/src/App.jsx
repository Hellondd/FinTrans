import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';

const COLOR_THEMES = {
  purple: {
    background: 'linear-gradient(135deg, #090d16 0%, #111026 50%, #1f0a2a 100%)',
    primaryButton: '#6366f1',
    badgeBg: '#312e81',
    badgeText: '#c7d2fe',
  },
  dark: {
    background: '#111827',
    primaryButton: '#374151',
    badgeBg: '#1f2937',
    badgeText: '#f3f4f6',
  },
  light: {
    background: '#f3f4f6',
    primaryButton: '#3b82f6',
    badgeBg: '#dbeafe',
    badgeText: '#1e40af',
  }
};

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('purple');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const activeTheme = COLOR_THEMES[currentTheme];

  // Проверка токена при загрузке
  useEffect(() => {
    const token = localStorage.getItem('fintrans_auth_token');
    if (token) {
      setIsAuth(true);
      fetchUserProfile(token);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (err) {
      console.error(err);
      handleLogout();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Неверные данные');
      }

      const data = await response.json();
      localStorage.setItem('fintrans_auth_token', data.access_token);
      setIsAuth(true);
      await fetchUserProfile(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fintrans_auth_token');
    setIsAuth(false);
    setUser(null);
    setUsername('');
    setPassword('');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: activeTheme.background,
      color: currentTheme === 'light' ? '#1f2937' : '#fff',
      fontFamily: 'Segoe UI, Roboto, sans-serif',
      overflow: 'hidden'
    }}>
      {!isAuth ? (
        // === Экран авторизации ===
        <div style={{
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            padding: '50px 40px',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '420px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '32px' }}>
              ФинТранс
            </h2>
            <p style={{ textAlign: 'center', marginBottom: '30px', opacity: 0.8 }}>
              Вход в систему
            </p>

            {error && <div style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '20px' }}>
                <label>Логин</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #475569', background: '#1e2937', color: '#fff', marginTop: '8px' }}
                  placeholder="Введите логин"
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label>Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #475569', background: '#1e2937', color: '#fff', marginTop: '8px' }}
                  placeholder="Введите пароль"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: activeTheme.primaryButton,
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '17px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        // === Главная аналитическая страница ===
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          currentTheme={currentTheme} 
        />
      )}
    </div>
  );
}

export default App;
