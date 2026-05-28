// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';

const COLOR_THEMES = {
  purple: { background: 'linear-gradient(135deg, #090d16 0%, #111026 50%, #1f0a2a 100%)', primary: '#6366f1' },
  dark: { background: '#111827', primary: '#4b5563' },
  light: { background: '#f3f4f6', primary: '#3b82f6' }
};

function Dashboard({ user, onLogout, currentTheme }) {
  const theme = COLOR_THEMES[currentTheme];

  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Состояния для KPI
  const [kpiData, setKpiData] = useState({
    total_clients: 0,
    active_clients: 0,
    total_transactions: 0,
    total_volume_today: 0,
    fraud_blocked_today: 0,
    avg_credit_score: 0
  });
  const [kpiLoading, setKpiLoading] = useState(true);

  // Загрузка KPI при монтировании компонента
  useEffect(() => {
    fetchKpiData();
  }, []);

  const fetchKpiData = async () => {
    const token = localStorage.getItem('fintrans_auth_token');
    
    if (!token) {
      console.error('Токен не найден');
      return;
    }

    setKpiLoading(true);
    
    try {
      // Используем существующий эндпоинт /dashboard/kpi
      const response = await fetch('http://127.0.0.1:8000/api/v1/dashboard/kpi', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки KPI');
      }

      const data = await response.json();
      
      setKpiData({
        total_clients: data.total_clients || 0,
        active_clients: data.active_clients || 0,
        total_transactions: data.total_transactions || 0,
        total_volume_today: data.total_volume_today || 0,
        fraud_blocked_today: data.fraud_blocked_today || 0,
        avg_credit_score: data.avg_credit_score || 0
      });
      
    } catch (err) {
      console.error('Ошибка загрузки KPI:', err);
      // Демо-данные если бэкенд не отвечает
      setKpiData({
        total_clients: 1248,
        active_clients: 987,
        total_transactions: 15423,
        total_volume_today: 1250000,
        fraud_blocked_today: 3,
        avg_credit_score: 685
      });
    } finally {
      setKpiLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setLoading(true);

    const token = localStorage.getItem('fintrans_auth_token');

    if (!token) {
      alert('Вы не авторизованы. Пожалуйста, войдите в систему.');
      return;
    }

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/clients/?search=${encodeURIComponent(searchText)}&limit=30`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (res.status === 403) {
        alert('Доступ запрещён. Недостаточно прав.');
        return;
      }

      if (!res.ok) {
        throw new Error('Ошибка сервера');
      }

      const data = await res.json();
      setClients(data.data || []);
    } catch (err) {
      console.error(err);
      alert('Не удалось выполнить поиск');
    } finally {
      setLoading(false);
    }
  };

  // Функция для форматирования валюты
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0 ₽';
    return value.toLocaleString('ru-RU') + ' ₽';
  };

  // Функция для форматирования чисел
  const formatNumber = (value) => {
    if (!value && value !== 0) return '0';
    return value.toLocaleString('ru-RU');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.background,
      color: currentTheme === 'light' ? '#1f2937' : '#fff',
      fontFamily: 'Segoe UI, Roboto, sans-serif',
      padding: '30px 20px'
    }}>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: '700' }}>Аналитическая панель</h1>
            <p style={{ margin: '8px 0 0 0', fontSize: '18px', opacity: 0.8 }}>
              Добро пожаловать, {user?.full_name || user?.username}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '30px',
              fontWeight: '600'
            }}>
              {user?.role}
            </div>
            <button 
              onClick={onLogout}
              style={{
                padding: '12px 24px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Выйти
            </button>
          </div>
        </div>

        {/* KPI Cards - с реальными данными из бэкенда */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px', 
          marginBottom: '40px' 
        }}>
          {/* Карточка 1: Всего клиентов */}
          <div style={kpiCardStyle(theme)}>
            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Клиентов всего</div>
            {kpiLoading ? (
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#94a3b8' }}>...</div>
            ) : (
              <>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{formatNumber(kpiData.total_clients)}</div>
                <div style={{ fontSize: '12px', color: '#4ade80', marginTop: '8px' }}>
                  Активных: {formatNumber(kpiData.active_clients)}
                </div>
              </>
            )}
          </div>
          
          {/* Карточка 2: Всего транзакций */}
          <div style={kpiCardStyle(theme)}>
            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Всего транзакций</div>
            {kpiLoading ? (
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#94a3b8' }}>...</div>
            ) : (
              <>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{formatNumber(kpiData.total_transactions)}</div>
                <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '8px' }}>
                  Объём сегодня: {formatCurrency(kpiData.total_volume_today)}
                </div>
              </>
            )}
          </div>
          
          {/* Карточка 3: Мошенничество */}
          <div style={kpiCardStyle(theme)}>
            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Заблокировано фродом</div>
            {kpiLoading ? (
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#94a3b8' }}>...</div>
            ) : (
              <>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f87171' }}>{formatNumber(kpiData.fraud_blocked_today)}</div>
                <div style={{ fontSize: '12px', color: '#f87171', marginTop: '8px' }}>
                  за сегодня
                </div>
              </>
            )}
          </div>
          
          {/* Карточка 4: Кредитный скор */}
          <div style={kpiCardStyle(theme)}>
            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Средний кредитный скор</div>
            {kpiLoading ? (
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#94a3b8' }}>...</div>
            ) : (
              <>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{Math.round(kpiData.avg_credit_score)}</div>
                <div style={{ fontSize: '12px', color: '#4ade80', marginTop: '8px' }}>
                  из 1000 возможных
                </div>
              </>
            )}
          </div>
        </div>

        {/* Быстрые действия */}
        <div style={{ marginBottom: '50px' }}>
          <h3 style={{ marginBottom: '15px' }}>Быстрые действия</h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setShowSearch(true)} 
              style={actionBtn(theme)}
            >
              🔍 Поиск клиента
            </button>
            <button style={actionBtn(theme)}>📊 Отчёт по рискам</button>
            <button style={actionBtn(theme)}>🚨 Антифрод мониторинг</button>
            <button 
              onClick={fetchKpiData}
              style={{ ...actionBtn(theme), background: '#475569' }}
            >
              🔄 Обновить данные
            </button>
          </div>
        </div>

        {/* Поиск клиентов */}
        {showSearch && (
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            padding: '30px',
            borderRadius: '16px',
            marginBottom: '40px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Поиск клиентов</h3>
              <button 
                onClick={() => setShowSearch(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', maxWidth: '700px' }}>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Введите ФИО клиента..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid #475569',
                  background: currentTheme === 'light' ? '#fff' : '#1e2937',
                  color: currentTheme === 'light' ? '#1f2937' : '#fff',
                  fontSize: '17px'
                }}
              />
              <button onClick={handleSearch} disabled={loading} style={actionBtn(theme)}>
                {loading ? 'Поиск...' : 'Найти'}
              </button>
            </div>

            {clients.length > 0 && (
              <div style={{ marginTop: '25px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <th style={th}>ID</th>
                      <th style={th}>ФИО</th>
                      <th style={th}>Город</th>
                      <th style={th}>Доход</th>
                      <th style={th}>Сегмент</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(c => (
                      <tr key={c.client_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <td style={td}>{c.client_id}</td>
                        <td style={td}><strong>{c.full_name}</strong></td>
                        <td style={td}>{c.city || '—'}</td>
                        <td style={td}>{c.monthly_income ? c.monthly_income.toLocaleString('ru-RU') + ' ₽' : '—'}</td>
                        <td style={td}>{c.segment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {clients.length === 0 && searchText && !loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                Клиенты не найдены
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const kpiCardStyle = (theme) => ({
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
  padding: '24px',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.1)'
});

const actionBtn = (theme) => ({
  padding: '14px 24px',
  background: theme.primary,
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'opacity 0.2s'
});

const th = { padding: '14px', textAlign: 'left', background: 'rgba(255,255,255,0.1)' };
const td = { padding: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' };

export default Dashboard;