import React, { useState, useEffect } from 'react';

const COLOR_THEMES = {
  purple: {
    background: 'linear-gradient(135deg, #090d16 0%, #111026 50%, #1f0a2a 100%)',
    primaryButton: '#6366f1',
    badgeBg: '#312e81',
    badgeText: '#c7d2fe',
    circle1: 'rgba(99,102,241,0.15)',
    circle2: 'rgba(168,85,247,0.12)'
  },
  dark: {
    background: '#111827',
    primaryButton: '#374151',
    badgeBg: '#1f2937',
    badgeText: '#f3f4f6',
    circle1: 'rgba(255,255,255,0.05)',
    circle2: 'rgba(255,255,255,0.03)'
  },
  light: {
    background: '#f3f4f6',
    primaryButton: '#3b82f6',
    badgeBg: '#dbeafe',
    badgeText: '#1e40af',
    circle1: 'rgba(59,130,246,0.1)',
    circle2: 'rgba(59,130,246,0.05)'
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

  useEffect(() => {
    const token = localStorage.getItem('fintrans_auth_token');
    if (token) {
      setIsAuth(true);
      fetchUserProfile(token);
    }
  }, []);

const fetchUserProfile = async (token) => {
  try {
    const response = await fetch('http://localhost:8000/api/v1/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    const userData = await response.json();
    setUser(userData);
  } catch (err) {
    console.error('Profile fetch error:', err);
    handleLogout();
  }
};


  const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  if (!username.trim() || !password.trim()) {
    setError('Пожалуйста, заполните все поля ввода');
    return;
  }
  setLoading(true);
  try {
    const response = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Неверные учетные данные');
    }
    
    const data = await response.json();
    localStorage.setItem('fintrans_auth_token', data.access_token);
    setIsAuth(true);
    await fetchUserProfile(data.access_token);
  } catch (err) {
    console.error('Login error:', err);
    setError(err.message || 'Ошибка соединения с сервером');
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

  const dynamicStyles = {
    ...styles,
    appContainer: { ...styles.appContainer, background: activeTheme.background },
    button: { ...styles.button, backgroundColor: activeTheme.primaryButton },
    roleBadge: { ...styles.roleBadge, backgroundColor: activeTheme.badgeBg, color: activeTheme.badgeText },
    bgCircle1: { ...styles.bgCircle1, background: `radial-gradient(circle, ${activeTheme.circle1} 0%, rgba(0,0,0,0) 70%)` },
    bgCircle2: { ...styles.bgCircle2, background: `radial-gradient(circle, ${activeTheme.circle2} 0%, rgba(0,0,0,0) 70%)` },
    card: { ...styles.card, color: currentTheme === 'light' ? '#1f2937' : '#fff' },
    input: { ...styles.input, backgroundColor: currentTheme === 'light' ? '#e5e7eb' : '#0f172a', color: currentTheme === 'light' ? '#111' : '#fff' }
  };

  return (
    <div style={dynamicStyles.appContainer}>
      <div style={dynamicStyles.bgCircle1}></div>
      <div style={dynamicStyles.bgCircle2}></div>

      <div style={styles.themeSelector}>
        <span style={{...styles.themeLabel, color: currentTheme === 'light' ? '#334155' : '#cbd5e1'}}>Тема:</span>
        <button onClick={() => setCurrentTheme('purple')} style={{...styles.themeBtn, backgroundColor: '#6366f1', border: currentTheme === 'purple' ? '2px solid #fff' : 'none'}}></button>
        <button onClick={() => setCurrentTheme('dark')} style={{...styles.themeBtn, backgroundColor: '#374151', border: currentTheme === 'dark' ? '2px solid #fff' : 'none'}}></button>
        <button onClick={() => setCurrentTheme('light')} style={{...styles.themeBtn, backgroundColor: '#3b82f6', border: currentTheme === 'light' ? '2px solid #fff' : 'none'}}></button>
      </div>

      <main style={styles.mainContent}>
        {!isAuth ? (
          <div style={dynamicStyles.card}>
            <h2 style={styles.title}>Вход в систему</h2>
            <p style={styles.subtitle}>Финансовая платформа «ФинТранс»</p>
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={handleLogin}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Логин / Email</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={dynamicStyles.input} disabled={loading} placeholder="Введите ваш логин" />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Пароль</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={dynamicStyles.input} disabled={loading} placeholder="Введите пароль" />
              </div>
              <button type="submit" style={dynamicStyles.button} disabled={loading}>{loading ? 'Проверка...' : 'Войти'}</button>
            </form>
          </div>
        ) : (
          <div style={dynamicStyles.card}>
            <h2 style={styles.title}>Личный кабинет</h2>
            <p style={styles.subtitle}>Информационная панель сотрудника</p>
            <hr style={styles.divider} />
            <div style={styles.infoBlock}>
              <p style={styles.text}><strong>ФИО:</strong> {user?.full_name || 'Загрузка...'}</p>
              <p style={styles.text}><strong>Email:</strong> {user?.email || 'Загрузка...'}</p>
              <p style={styles.text}><strong>Роль:</strong> <span style={dynamicStyles.roleBadge}>{user?.role || 'User'}</span></p>
            </div>
            <button onClick={handleLogout} style={styles.logoutButton}>Выйти из системы</button>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  appContainer: { position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Segoe UI, Roboto, Helvetica Neue, sans-serif', overflow: 'hidden', boxSizing: 'border-box', padding: '20px' },
  themeSelector: { position: 'absolute', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 10, backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '10px 15px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' },
  themeLabel: { fontSize: '14px', fontWeight: '600' },
  themeBtn: { width: '25px', height: '25px', borderRadius: '50%', cursor: 'pointer', outline: 'none', transition: 'transform 0.1s' },
  mainContent: { position: 'relative', zIndex: 2, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  card: { backdropFilter: 'blur(16px)', padding: '45px', borderRadius: '16px', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)', width: '100%', maxWidth: '460px', boxSizing: 'border-box', border: '1px solid rgba(255, 255, 255, 0.08)' },
  title: { margin: '0 0 10px 0', textAlign: 'center', fontSize: '32px', fontWeight: '700' },
  subtitle: { margin: '0 0 35px 0', color: '#94a3b8', textAlign: 'center', fontSize: '16px' },
  inputGroup: { marginBottom: '25px' },
  label: { display: 'block', marginBottom: '10px', fontSize: '16px', fontWeight: '600' },
  input: { width: '100%', padding: '14px 16px', border: '1px solid #334155', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', outline: 'none' },
  button: { width: '100%', padding: '14px', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px', transition: 'all 0.2s' },
  logoutButton: { width: '100%', padding: '14px', backgroundColor: '#f43f5e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '17px', fontWeight: '600', cursor: 'pointer' },
  error: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '14px', borderRadius: '8px', marginBottom: '25px', fontSize: '15px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.4)', fontWeight: '500' },
  divider: { border: 'none', borderTop: '1px solid #334155', marginBottom: '24px' },
  infoBlock: { marginBottom: '28px' },
  text: { fontSize: '18px', marginBottom: '16px', lineHeight: '1.5' },
  roleBadge: { padding: '6px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '14px' },
  bgCircle1: { position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' },
  bgCircle2: { position: 'absolute', bottom: '-10%', right: '-5%', width: '45vw', height: '45vw', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }
};

export default App;
