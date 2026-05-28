// src/pages/Dashboard.jsx
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

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
  const [kpiData, setKpiData] = useState({
    total_clients: 0,
    active_clients: 0,
    total_transactions: 0,
    total_volume_today: 0,
    fraud_blocked_today: 0,
    avg_credit_score: 0
  });
  const [kpiLoading, setKpiLoading] = useState(true);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientProducts, setClientProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  
  const [dailyTransactions, setDailyTransactions] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartDays, setChartDays] = useState(30);

  const [topClients, setTopClients] = useState([]);
  const [topLoading, setTopLoading] = useState(true);
  const [topType, setTopType] = useState('income');

  const [showFilters, setShowFilters] = useState(false);
  const [showFilteredResults, setShowFilteredResults] = useState(false);
  const [filters, setFilters] = useState({
    segment: '',
    city: '',
    status: '',
    minIncome: '',
    maxIncome: '',
    creditScoreMin: '',
    creditScoreMax: ''
  });
  const [segments, setSegments] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredData, setFilteredData] = useState(null);
  const [filterStats, setFilterStats] = useState(null);

  const [segmentData, setSegmentData] = useState([]);
  const [segmentLoading, setSegmentLoading] = useState(true);

  useEffect(() => {
    fetchKpiData();
    fetchDailyTransactions();
    fetchTopClients();
    fetchFilterOptions();
    fetchSegmentDistribution();
  }, []);

  const fetchKpiData = async () => {
    const token = localStorage.getItem('fintrans_auth_token');
    if (!token) return;

    setKpiLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/dashboard/kpi', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Ошибка загрузки KPI');
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
    } finally {
      setKpiLoading(false);
    }
  };

  const fetchDailyTransactions = async (days = chartDays) => {
    const token = localStorage.getItem('fintrans_auth_token');
    if (!token) return;

    setChartLoading(true);
    try {
      const validDays = Math.min(days, 90);
      const response = await fetch(`http://127.0.0.1:8000/api/v1/dashboard/transactions/daily?days=${validDays}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Ошибка загрузки графика');
      const data = await response.json();
      
      const formattedData = data.map(item => ({
        date: new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        count: item.count || 0,
        volume: item.volume || 0
      }));
      
      setDailyTransactions(formattedData);
    } catch (err) {
      console.error('Ошибка загрузки графика:', err);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchTopClients = async () => {
    const token = localStorage.getItem('fintrans_auth_token');
    if (!token) return;

    setTopLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/clients/?limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Ошибка загрузки клиентов');
      const data = await response.json();
      const allClients = data.data || [];
      
      const clientsWithStats = await Promise.all(
        allClients.slice(0, 50).map(async (client) => {
          try {
            const transRes = await fetch(`http://127.0.0.1:8000/api/v1/transactions/?client_id=${client.client_id}&limit=1000`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const transData = await transRes.json();
            const transactions = transData.data || [];
            
            const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            const transactionCount = transactions.length;
            
            return {
              ...client,
              total_amount: totalAmount,
              transaction_count: transactionCount
            };
          } catch (err) {
            return {
              ...client,
              total_amount: 0,
              transaction_count: 0
            };
          }
        })
      );
      
      setTopClients(clientsWithStats);
    } catch (err) {
      console.error('Ошибка загрузки топ клиентов:', err);
      setTopClients([
        { client_id: 1, full_name: 'Иванов Иван', monthly_income: 250000, credit_score: 850, total_amount: 1500000, transaction_count: 45, segment: 'Premium', city: 'Москва', status: 'ACTIVE' },
        { client_id: 2, full_name: 'Петрова Анна', monthly_income: 180000, credit_score: 780, total_amount: 890000, transaction_count: 32, segment: 'Premium', city: 'СПб', status: 'ACTIVE' },
        { client_id: 3, full_name: 'Сидоров Алексей', monthly_income: 320000, credit_score: 820, total_amount: 2100000, transaction_count: 67, segment: 'VIP', city: 'Москва', status: 'ACTIVE' },
        { client_id: 4, full_name: 'Козлова Екатерина', monthly_income: 95000, credit_score: 650, total_amount: 450000, transaction_count: 23, segment: 'Standard', city: 'Екатеринбург', status: 'ACTIVE' },
        { client_id: 5, full_name: 'Морозов Дмитрий', monthly_income: 420000, credit_score: 780, total_amount: 2800000, transaction_count: 89, segment: 'VIP', city: 'Москва', status: 'ACTIVE' }
      ]);
    } finally {
      setTopLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    const token = localStorage.getItem('fintrans_auth_token');
    if (!token) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/clients/?limit=1000`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Ошибка загрузки');
      
      const data = await response.json();
      const allClients = data.data || [];
      
      const uniqueSegments = [...new Set(allClients.map(c => c.segment).filter(Boolean))];
      const uniqueCities = [...new Set(allClients.map(c => c.city).filter(Boolean))];
      
      uniqueSegments.sort();
      uniqueCities.sort();
      
      setSegments(uniqueSegments);
      setCities(uniqueCities);
      
    } catch (err) {
      console.error('Ошибка загрузки опций фильтров:', err);
      setSegments(['Mass', 'Startup', 'Pensioner', 'Premium', 'SME', 'VIP', 'Student']);
      setCities(['Иркутск', 'Тюмень', 'Краснодар', 'Челябинск', 'Ростов-на-Дону', 'Новосибирск', 'Санкт-Петербург', 'Самара', 'Пермь', 'Москва', 'Омск', 'Уфа']);
    }
  };

  const fetchSegmentDistribution = async () => {
    const token = localStorage.getItem('fintrans_auth_token');
    if (!token) return;

    setSegmentLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/dashboard/segments/distribution', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Ошибка загрузки сегментов');
      const data = await response.json();
      setSegmentData(data);
    } catch (err) {
      console.error('Ошибка загрузки сегментов:', err);
      setSegmentData([
        { name: 'Mass', value: 850, color: '#6366f1' },
        { name: 'Premium', value: 420, color: '#f59e0b' },
        { name: 'VIP', value: 280, color: '#10b981' },
        { name: 'Startup', value: 190, color: '#ef4444' },
        { name: 'SME', value: 150, color: '#8b5cf6' },
        { name: 'Student', value: 80, color: '#ec4899' },
        { name: 'Pensioner', value: 50, color: '#06b6d4' }
      ]);
    } finally {
      setSegmentLoading(false);
    }
  };

  // ========== ЭКСПОРТ ==========
  const exportToExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportChartToPDF = async () => {
    const chartElement = document.getElementById('transactions-chart');
    if (!chartElement) return;
    
    const canvas = await html2canvas(chartElement);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape');
    pdf.addImage(imgData, 'PNG', 10, 10, 280, 150);
    pdf.save('transactions_chart.pdf');
  };

  const exportDashboardToPDF = async () => {
    const dashboardElement = document.getElementById('dashboard-content');
    if (!dashboardElement) return;
    
    const canvas = await html2canvas(dashboardElement);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('portrait');
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 250);
    pdf.save('dashboard_report.pdf');
  };

  const exportFilteredResults = () => {
    if (!filteredData || filteredData.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }
    const exportData = filteredData.map(c => ({
      'ID': c.client_id,
      'ФИО': c.full_name,
      'Город': c.city || '—',
      'Доход': c.monthly_income || 0,
      'Кредитный скор': c.credit_score || 0,
      'Сегмент': c.segment || '—',
      'Статус': c.status || '—'
    }));
    exportToExcel(exportData, `filtered_clients_${new Date().toLocaleDateString()}`);
  };

  const exportTopClientsExcel = () => {
    const exportData = topClients.slice(0, 10).map(c => ({
      'ID': c.client_id,
      'ФИО': c.full_name,
      'Доход': c.monthly_income || 0,
      'Кредитный скор': c.credit_score || 0,
      'Кол-во транзакций': c.transaction_count || 0,
      'Сегмент': c.segment || '—'
    }));
    exportToExcel(exportData, `top_clients_${new Date().toLocaleDateString()}`);
  };

  const exportKPI = () => {
    const exportData = [{
      'Показатель': 'Всего клиентов',
      'Значение': kpiData.total_clients
    }, {
      'Показатель': 'Активных клиентов',
      'Значение': kpiData.active_clients
    }, {
      'Показатель': 'Всего транзакций',
      'Значение': kpiData.total_transactions
    }, {
      'Показатель': 'Объём сегодня (₽)',
      'Значение': kpiData.total_volume_today
    }, {
      'Показатель': 'Заблокировано фродом',
      'Значение': kpiData.fraud_blocked_today
    }, {
      'Показатель': 'Средний кредитный скор',
      'Значение': kpiData.avg_credit_score
    }];
    exportToExcel(exportData, `kpi_report_${new Date().toLocaleDateString()}`);
  };
  // ========== КОНЕЦ ЭКСПОРТА ==========

  const applyFilters = async () => {
    const token = localStorage.getItem('fintrans_auth_token');
    if (!token) return;

    setLoading(true);
    try {
      let url = `http://127.0.0.1:8000/api/v1/clients/?limit=200`;
      if (filters.segment) url += `&segment=${filters.segment}`;
      if (filters.city) url += `&city=${filters.city}`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.minIncome) url += `&min_income=${filters.minIncome}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const filteredClients = data.data || [];
      
      const segmentCount = {};
      const cityCount = {};
      
      filteredClients.forEach(client => {
        const segment = client.segment;
        const city = client.city;
        if (segment) segmentCount[segment] = (segmentCount[segment] || 0) + 1;
        if (city) cityCount[city] = (cityCount[city] || 0) + 1;
      });
      
      const topSegments = Object.entries(segmentCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => `${name} (${count})`)
        .join(', ');
        
      const topCities = Object.entries(cityCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => `${name} (${count})`)
        .join(', ');
      
      const stats = {
        total: filteredClients.length,
        avgIncome: filteredClients.reduce((sum, c) => sum + (c.monthly_income || 0), 0) / (filteredClients.length || 1),
        avgCreditScore: filteredClients.reduce((sum, c) => sum + (c.credit_score || 0), 0) / (filteredClients.length || 1),
        totalTransactions: filteredClients.reduce((sum, c) => sum + (c.total_amount || 0), 0),
        topSegments: topSegments || 'Нет данных',
        topCities: topCities || 'Нет данных'
      };
      
      setFilterStats(stats);
      setFilteredData(filteredClients);
      setShowFilteredResults(true);
      setShowFilters(false);
    } catch (err) {
      console.error('Ошибка фильтрации:', err);
      alert('Ошибка применения фильтров');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      segment: '',
      city: '',
      status: '',
      minIncome: '',
      maxIncome: '',
      creditScoreMin: '',
      creditScoreMax: ''
    });
    setFilteredData(null);
    setFilterStats(null);
    setShowFilteredResults(false);
  };

  const handleDaysChange = (days) => {
    setChartDays(days);
    fetchDailyTransactions(days);
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setLoading(true);

    const token = localStorage.getItem('fintrans_auth_token');
    if (!token) {
      alert('Вы не авторизованы');
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

      if (!res.ok) throw new Error('Ошибка сервера');
      const data = await res.json();
      setClients(data.data || []);
    } catch (err) {
      console.error(err);
      alert('Не удалось выполнить поиск');
    } finally {
      setLoading(false);
    }
  };

  const loadClientProducts = async (clientId, clientName) => {
    const token = localStorage.getItem('fintrans_auth_token');
    if (!token) return;

    setProductsLoading(true);
    setSelectedClient({ id: clientId, name: clientName });
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/clients/${clientId}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const products = await res.json();
        setClientProducts(products);
        setShowProductsModal(true);
      } else {
        alert('Ошибка загрузки продуктов');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка соединения');
    } finally {
      setProductsLoading(false);
    }
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return '0';
    return value.toLocaleString('ru-RU');
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0 ₽';
    return value.toLocaleString('ru-RU') + ' ₽';
  };

  const isLight = currentTheme === 'light';
  const textColor = isLight ? '#1f2937' : '#fff';
  const gridColor = isLight ? '#ddd' : '#334155';

  const formatYAxis = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value;
  };

  const hasVolumeData = dailyTransactions.some(item => item.volume > 0);
  const totalTransactions = dailyTransactions.reduce((sum, item) => sum + (item.count || 0), 0);
  const totalVolume = dailyTransactions.reduce((sum, item) => sum + (item.volume || 0), 0);

  const getSortedTopClients = () => {
    const sorted = [...topClients];
    if (topType === 'income') {
      return sorted.sort((a, b) => (b.monthly_income || 0) - (a.monthly_income || 0)).slice(0, 5);
    } else if (topType === 'credit') {
      return sorted.sort((a, b) => (b.credit_score || 0) - (a.credit_score || 0)).slice(0, 5);
    } else {
      return sorted.sort((a, b) => (b.transaction_count || 0) - (a.transaction_count || 0)).slice(0, 5);
    }
  };

  const displayTopClients = getSortedTopClients();

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.background,
      color: textColor,
      fontFamily: 'Segoe UI, Roboto, sans-serif',
      padding: '30px 20px'
    }}>
      <div id="dashboard-content" style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: '700' }}>Аналитическая панель</h1>
            <p style={{ margin: '8px 0 0 0', fontSize: '18px', opacity: 0.8 }}>
              Добро пожаловать, {user?.full_name || user?.username}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', borderRadius: '30px', fontWeight: '600' }}>
              {user?.role}
            </div>
            <button onClick={onLogout} style={{ padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', cursor: 'pointer' }}>
              Выйти
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>Клиентов всего</div>
            {kpiLoading ? <div style={{ fontSize: '28px' }}>...</div> : <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{formatNumber(kpiData.total_clients)}</div>}
            <div style={{ fontSize: '12px', color: '#4ade80', marginTop: '8px' }}>Активных: {formatNumber(kpiData.active_clients)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>Всего транзакций</div>
            {kpiLoading ? <div style={{ fontSize: '28px' }}>...</div> : <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{formatNumber(kpiData.total_transactions)}</div>}
            <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '8px' }}>Объём сегодня: {formatCurrency(kpiData.total_volume_today)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>Заблокировано фродом</div>
            {kpiLoading ? <div style={{ fontSize: '28px' }}>...</div> : <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f87171' }}>{formatNumber(kpiData.fraud_blocked_today)}</div>}
            <div style={{ fontSize: '12px', color: '#f87171', marginTop: '8px' }}>за сегодня</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>Средний кредитный скор</div>
            {kpiLoading ? <div style={{ fontSize: '28px' }}>...</div> : <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{Math.round(kpiData.avg_credit_score)}</div>}
            <div style={{ fontSize: '12px', color: '#4ade80', marginTop: '8px' }}>из 1000 возможных</div>
          </div>
        </div>

        {/* График транзакций */}
        <div id="transactions-chart" style={{ 
          background: 'rgba(255,255,255,0.08)', 
          backdropFilter: 'blur(12px)', 
          padding: '24px', 
          borderRadius: '16px', 
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '40px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <h3 style={{ margin: 0 }}> Динамика транзакций</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[30, 60, 90].map(days => (
                  <button
                    key={days}
                    onClick={() => handleDaysChange(days)}
                    style={{
                      padding: '6px 14px',
                      background: chartDays === days ? theme.primary : '#475569',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    {days} дн.
                  </button>
                ))}
              </div>
              <button 
                onClick={() => fetchDailyTransactions()}
                style={{ padding: '6px 14px', background: '#475569', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
              >
                🔄
              </button>
            </div>
          </div>
          
          {chartLoading ? (
            <div style={{ textAlign: 'center', padding: '80px', opacity: 0.6 }}>Загрузка графика...</div>
          ) : dailyTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', opacity: 0.6 }}>Нет данных для отображения</div>
          ) : (
            <>
              <div style={{ height: '320px', marginBottom: '40px' }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', opacity: 0.8 }}> Количество транзакций</h4>
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={dailyTransactions}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={theme.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="date" stroke={textColor} tick={{ fill: textColor, fontSize: 11 }} />
                    <YAxis stroke={textColor} tick={{ fill: textColor }} tickFormatter={formatYAxis} />
                    <Tooltip contentStyle={{ background: isLight ? '#fff' : '#1e293b', border: 'none', borderRadius: '8px', color: textColor }} />
                    <Legend wrapperStyle={{ color: textColor }} />
                    <Area type="monotone" dataKey="count" name="Кол-во транзакций" stroke={theme.primary} fill="url(#colorCount)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {hasVolumeData && (
                <div style={{ height: '320px' }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', opacity: 0.8 }}>💰 Объём транзакций (₽)</h4>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={dailyTransactions}>
                      <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="date" stroke={textColor} tick={{ fill: textColor, fontSize: 11 }} />
                      <YAxis stroke={textColor} tick={{ fill: textColor }} tickFormatter={formatYAxis} />
                      <Tooltip contentStyle={{ background: isLight ? '#fff' : '#1e293b', border: 'none', borderRadius: '8px', color: textColor }} />
                      <Legend wrapperStyle={{ color: textColor }} />
                      <Bar dataKey="volume" name="Сумма транзакций" fill="url(#colorVolume)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '12px', opacity: 0.6, flexWrap: 'wrap', gap: '10px' }}>
            <div> Всего транзакций: {totalTransactions.toLocaleString('ru-RU')}</div>
            {hasVolumeData && <div> Общая сумма: {totalVolume.toLocaleString('ru-RU')} ₽</div>}
          </div>
        </div>

        {/* Топ клиенты */}
        <div style={{ 
          background: 'rgba(255,255,255,0.08)', 
          backdropFilter: 'blur(12px)', 
          padding: '24px', 
          borderRadius: '16px', 
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '40px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <h3 style={{ margin: 0 }}> Топ клиенты</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setTopType('income')}
                style={{
                  padding: '6px 14px',
                  background: topType === 'income' ? theme.primary : '#475569',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                 По доходу
              </button>
              <button
                onClick={() => setTopType('credit')}
                style={{
                  padding: '6px 14px',
                  background: topType === 'credit' ? theme.primary : '#475569',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                 По скору
              </button>
              <button
                onClick={() => setTopType('activity')}
                style={{
                  padding: '6px 14px',
                  background: topType === 'activity' ? theme.primary : '#475569',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                 По активности
              </button>
            </div>
          </div>

          {topLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>Загрузка топ клиентов...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '12px' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Клиент</th>
                    <th style={{ textAlign: 'right', padding: '12px' }}>Значение</th>
                    <th style={{ textAlign: 'right', padding: '12px' }}>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTopClients.map((client, idx) => (
                    <tr key={client.client_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7f32' : 'rgba(255,255,255,0.2)',
                          color: idx < 3 ? '#1f2937' : textColor,
                          textAlign: 'center',
                          lineHeight: '28px',
                          fontWeight: 'bold'
                        }}>
                          {idx + 1}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <strong>{client.full_name}</strong>
                        <div style={{ fontSize: '11px', opacity: 0.6 }}>ID: {client.client_id}</div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px', fontWeight: 'bold' }}>
                        {topType === 'income' && formatCurrency(client.monthly_income)}
                        {topType === 'credit' && (client.credit_score || 0)}
                        {topType === 'activity' && (client.transaction_count || 0)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px' }}>
                        <button
                          onClick={() => loadClientProducts(client.client_id, client.full_name)}
                          style={{ padding: '4px 10px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                        >
                          Продукты
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Быстрые действия */}
        <div style={{ marginBottom: '50px' }}>
          <h3 style={{ marginBottom: '15px' }}>Быстрые действия</h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button onClick={() => setShowSearch(true)} style={{ padding: '14px 24px', background: theme.primary, color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
               Поиск клиента
            </button>
            <button onClick={() => setShowFilters(true)} style={{ padding: '14px 24px', background: theme.primary, color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
               Фильтры
            </button>
            <button onClick={fetchKpiData} style={{ padding: '14px 24px', background: '#475569', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
               Обновить данные
            </button>
            <button onClick={fetchTopClients} style={{ padding: '14px 24px', background: '#475569', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
               Обновить топ
            </button>
          </div>
          
          {/* Кнопки экспорта */}
          <div style={{ marginTop: '15px', display: 'flex', gap: '15px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
            <span style={{ fontSize: '14px', opacity: 0.7, alignSelf: 'center' }}> Экспорт:</span>
            <button onClick={exportKPI} style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
               KPI
            </button>
            <button onClick={exportTopClientsExcel} style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
               Топ клиентов
            </button>
            <button onClick={exportChartToPDF} style={{ padding: '10px 20px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
               График (PDF)
            </button>
            <button onClick={exportDashboardToPDF} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
               Весь дашборд (PDF)
            </button>
            {showFilteredResults && filteredData && filteredData.length > 0 && (
              <button onClick={exportFilteredResults} style={{ padding: '10px 20px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                 Результаты фильтрации (Excel)
              </button>
            )}
          </div>
        </div>

        {/* Результаты фильтрации */}
        {showFilteredResults && filteredData && filteredData.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '30px', borderRadius: '16px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3> Результаты фильтрации ({filteredData.length} клиентов)</h3>
              <button onClick={() => setShowFilteredResults(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            
            {filterStats && (
              <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(99,102,241,0.1)', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div> Средний доход: <strong>{Math.round(filterStats.avgIncome).toLocaleString()} ₽</strong></div>
                  <div> Средний скор: <strong>{Math.round(filterStats.avgCreditScore)}</strong></div>
                  {filterStats.topSegments && filterStats.topSegments !== 'Нет данных' && (
                    <div> Сегменты: <strong>{filterStats.topSegments}</strong></div>
                  )}
                  {filterStats.topCities && filterStats.topCities !== 'Нет данных' && (
                    <div> Города: <strong>{filterStats.topCities}</strong></div>
                  )}
                </div>
              </div>
            )}
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '12px' }}>ID</th>
                    <th style={{ textAlign: 'left', padding: '12px' }}>ФИО</th>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Город</th>
                    <th style={{ textAlign: 'right', padding: '12px' }}>Доход</th>
                    <th style={{ textAlign: 'right', padding: '12px' }}>Скор</th>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Сегмент</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 50).map(c => (
                    <tr key={c.client_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <td style={{ padding: '12px' }}>{c.client_id}</td>
                      <td style={{ padding: '12px' }}><strong>{c.full_name}</strong></td>
                      <td style={{ padding: '12px' }}>{c.city || '—'}</td>
                      <td style={{ textAlign: 'right', padding: '12px' }}>{c.monthly_income ? c.monthly_income.toLocaleString('ru-RU') + ' ₽' : '—'}</td>
                      <td style={{ textAlign: 'right', padding: '12px' }}>{c.credit_score || '—'}</td>
                      <td style={{ padding: '12px' }}>{c.segment || '—'}</td>
                      <td style={{ textAlign: 'center', padding: '12px' }}>
                        <button onClick={() => loadClientProducts(c.client_id, c.full_name)} style={{ padding: '6px 12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                          Продукты
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length > 50 && (
              <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '12px', opacity: 0.6 }}>
                Показано первых 50 из {filteredData.length} клиентов
              </div>
            )}
          </div>
        )}

        {/* Модальное окно фильтров */}
        {showFilters && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowFilters(false)}>
            <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}> Фильтрация клиентов</h3>
                <button onClick={() => setShowFilters(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Сегмент</label>
                <select
                  value={filters.segment}
                  onChange={(e) => setFilters({...filters, segment: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                >
                  <option value="">Все сегменты</option>
                  {segments.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Город</label>
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({...filters, city: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                >
                  <option value="">Все города</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Статус</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                >
                  <option value="">Все статусы</option>
                  <option value="ACTIVE">Активен</option>
                  <option value="BLOCKED">Заблокирован</option>
                  <option value="CLOSED">Закрыт</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Мин. доход (₽)</label>
                <input
                  type="number"
                  value={filters.minIncome}
                  onChange={(e) => setFilters({...filters, minIncome: e.target.value})}
                  placeholder="От..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={applyFilters} style={{ flex: 1, padding: '12px', background: theme.primary, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                  {loading ? 'Применение...' : 'Применить фильтр'}
                </button>
                <button onClick={resetFilters} style={{ flex: 1, padding: '12px', background: '#475569', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                  Сбросить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Поиск клиентов */}
        {showSearch && (
          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '30px', borderRadius: '16px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Поиск клиентов</h3>
              <button onClick={() => setShowSearch(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '12px', maxWidth: '700px', marginBottom: '30px' }}>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Введите ФИО клиента..."
                style={{ flex: 1, padding: '16px 20px', borderRadius: '12px', border: '1px solid #475569', background: isLight ? '#fff' : '#1e2937', color: isLight ? '#1f2937' : '#fff', fontSize: '17px' }}
              />
              <button onClick={handleSearch} disabled={loading} style={{ padding: '14px 24px', background: theme.primary, color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                {loading ? 'Поиск...' : 'Найти'}
              </button>
            </div>

            {clients.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <th style={{ textAlign: 'left', padding: '12px' }}>ID</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>ФИО</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Город</th>
                      <th style={{ textAlign: 'right', padding: '12px' }}>Доход</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Сегмент</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(c => (
                      <tr key={c.client_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <td style={{ padding: '12px' }}>{c.client_id}</td>
                        <td style={{ padding: '12px' }}><strong>{c.full_name}</strong></td>
                        <td style={{ padding: '12px' }}>{c.city || '—'}</td>
                        <td style={{ textAlign: 'right', padding: '12px' }}>{c.monthly_income ? c.monthly_income.toLocaleString('ru-RU') + ' ₽' : '—'}</td>
                        <td style={{ padding: '12px' }}>{c.segment || '—'}</td>
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          <button onClick={() => loadClientProducts(c.client_id, c.full_name)} style={{ padding: '6px 12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                            Продукты
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {clients.length === 0 && searchText && !loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Клиенты не найдены</div>
            )}
          </div>
        )}

        {/* Круговая диаграмма - Распределение по сегментам */}
        <div style={{ 
          background: 'rgba(255,255,255,0.08)', 
          backdropFilter: 'blur(12px)', 
          padding: '24px', 
          borderRadius: '16px', 
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '40px'
        }}>
          <h3 style={{ margin: '0 0 20px 0' }}> Распределение клиентов по сегментам</h3>
          
          {segmentLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', opacity: 0.6 }}>Загрузка данных...</div>
          ) : segmentData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', opacity: 0.6 }}>Нет данных для отображения</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '40px' }}>
              <div style={{ width: '320px', height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      <Cell fill="#6c8ebf" />
                      <Cell fill="#7bb87b" />
                      <Cell fill="#b87b6c" />
                      <Cell fill="#8c6cbf" />
                      <Cell fill="#6cbfa8" />
                      <Cell fill="#bfa86c" />
                      <Cell fill="#a86cbf" />
                      <Cell fill="#6ca8bf" />
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => {
                        const total = segmentData.reduce((sum, item) => sum + item.value, 0);
                        const percent = ((value / total) * 100).toFixed(1);
                        return [`${value.toLocaleString('ru-RU')} клиентов (${percent}%)`, name];
                      }}
                      contentStyle={{ background: isLight ? '#fff' : '#1e293b', border: 'none', borderRadius: '8px', color: textColor }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div style={{ minWidth: '220px' }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', opacity: 0.7 }}>Статистика по сегментам</h4>
                {segmentData.map((item, idx) => {
                  const total = segmentData.reduce((sum, i) => sum + i.value, 0);
                  const percent = ((item.value / total) * 100).toFixed(1);
                  const colors = ['#6c8ebf', '#7bb87b', '#b87b6c', '#8c6cbf', '#6cbfa8', '#bfa86c', '#a86cbf', '#6ca8bf'];
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: colors[idx % colors.length] }}></div>
                      <span style={{ width: '90px', fontWeight: '500' }}>{item.name}</span>
                      <span style={{ fontWeight: 'bold' }}>{item.value.toLocaleString('ru-RU')}</span>
                      <span style={{ fontSize: '12px', opacity: 0.6 }}>({percent}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Модальное окно продуктов */}
        {showProductsModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 }} onClick={() => setShowProductsModal(false)}>
            <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '900px', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <h3>Продукты клиента: {selectedClient?.name}</h3>
              
              {productsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>
              ) : clientProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>Нет продуктов</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <th style={{ textAlign: 'left', padding: '12px' }}>Тип</th>
                        <th style={{ textAlign: 'right', padding: '12px' }}>Сумма</th>
                        <th style={{ textAlign: 'right', padding: '12px' }}>Ставка</th>
                        <th style={{ textAlign: 'left', padding: '12px' }}>Статус</th>
                        <th style={{ textAlign: 'left', padding: '12px' }}>Дата начала</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientProducts.map(product => (
                        <tr key={product.product_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <td style={{ padding: '12px' }}>{product.product_type || '—'}</td>
                          <td style={{ textAlign: 'right', padding: '12px' }}>{product.amount?.toLocaleString() || 0} ₽</td>
                          <td style={{ textAlign: 'right', padding: '12px' }}>{product.interest_rate || 0}%</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', background: product.status === 'active' ? '#10b98120' : '#ef444420', color: product.status === 'active' ? '#10b981' : '#ef4444' }}>
                              {product.status === 'active' ? 'Активен' : product.status || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>{product.start_date || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <button onClick={() => setShowProductsModal(false)} style={{ marginTop: '20px', padding: '10px 20px', background: '#475569', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
