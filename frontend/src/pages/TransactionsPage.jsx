import React, { useState, useEffect } from 'react';
import { getTransactions, getFraudAlerts, updateTransaction } from '../services/api';
import { useRoleAccess } from '../hooks/useRoleAccess';

const TransactionsPage = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [alertsMap, setAlertsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    transaction_type: '',
    country: '',
    status: '',
    is_fraud: '',
  });
  const { canViewFraud, canEdit } = useRoleAccess(user?.role);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.transaction_type) params.transaction_type = filters.transaction_type;
      if (filters.country) params.country = filters.country;
      if (filters.status) params.status = filters.status;
      if (filters.is_fraud !== '') params.is_fraud = filters.is_fraud === 'true';
      const res = await getTransactions(params);
      setTransactions(res.data.data || []);

      if (canViewFraud) {
        const alertsRes = await getFraudAlerts();
        const alerts = alertsRes.data || [];
        const map = {};
        alerts.forEach(alert => {
          map[alert.transaction_id] = alert;
        });
        setAlertsMap(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const handleStatusChange = async (txId, newStatus) => {
    try {
      await updateTransaction(txId, { status: newStatus });
      fetchTransactions();
    } catch (err) {
      alert('Ошибка обновления статуса');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      approved: { background: '#10b981', text: '✅ Одобрено' },
      pending_review: { background: '#f59e0b', text: '🟡 На проверке' },
      blocked: { background: '#ef4444', text: '🔴 Заблокировано' },
    };
    const s = styles[status] || { background: '#6b7280', text: status };
    return <span style={{ background: s.background, padding: '4px 8px', borderRadius: '20px', fontSize: '12px', color: '#fff' }}>{s.text}</span>;
  };

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filters.transaction_type} onChange={e => setFilters({...filters, transaction_type: e.target.value})} style={{ padding: '8px', borderRadius: '8px', background: '#1e293b', color: '#fff', border: '1px solid #475569' }}>
            <option value="">Все типы</option>
            <option value="fee">Комиссия (fee)</option>
            <option value="loan_repayment">Погашение кредита (loan_repayment)</option>
            <option value="payment">Платёж (payment)</option>
            <option value="refund">Возврат (refund)</option>
            <option value="transfer">Перевод (transfer)</option>
            <option value="card_purchase">Покупка по карте (card_purchase)</option>
        </select>
        <select value={filters.country} onChange={e => setFilters({...filters, country: e.target.value})} style={{ padding: '8px', borderRadius: '8px', background: '#1e293b', color: '#fff', border: '1px solid #475569' }}>
            <option value="">Все страны</option>
            <option value="RU">Россия (RU)</option>
            <option value="AE">ОЭА (AE)</option>
            <option value="AM">Армения (AM)</option>
            <option value="CN">Китай (CN)</option>
            <option value="GE">Грузия (GE)</option>
            <option value="KZ">Казахстан (KZ)</option>
            <option value="TR">Турция (TR)</option>
        </select>
        <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} style={{ padding: '8px', borderRadius: '8px', background: '#1e293b', color: '#fff', border: '1px solid #475569' }}>
          <option value="">Все статусы</option>
          <option value="approved">Одобрено</option>
          <option value="pending_review">Проверка</option>
          <option value="blocked">Заблокировано</option>
        </select>
        <select value={filters.is_fraud} onChange={e => setFilters({...filters, is_fraud: e.target.value})} style={{ padding: '8px', borderRadius: '8px', background: '#1e293b', color: '#fff', border: '1px solid #475569' }}>
          <option value="">Риск-маркер (все)</option>
          <option value="true">Только фрод</option>
          <option value="false">Без фрода</option>
        </select>
        <button onClick={fetchTransactions} style={{ background: '#6366f1', border: 'none', padding: '8px 16px', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>Применить</button>
      </div>

      {loading && <div>Загрузка...</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Клиент</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Сумма</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Тип</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Страна</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Устройство</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Статус</th>
              {canViewFraud && <th style={{ padding: '12px', textAlign: 'left' }}>Fraud Score</th>}
              <th style={{ padding: '12px', textAlign: 'left' }}>Дата</th>
              {canEdit && <th style={{ padding: '12px' }}>Действие</th>}
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.transaction_id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '12px' }}>{tx.transaction_id}</td>
                <td style={{ padding: '12px' }}>{tx.client_id}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{tx.amount?.toLocaleString()} {tx.currency}</td>
                <td style={{ padding: '12px' }}>{tx.transaction_type}</td>
                <td style={{ padding: '12px' }}>{tx.country || '—'}</td>
                <td style={{ padding: '12px' }}>{tx.device || '—'}</td>
                <td style={{ padding: '12px' }}>{getStatusBadge(tx.status)}</td>
                {canViewFraud && (
                  <td style={{ padding: '12px' }}>
                    {alertsMap[tx.transaction_id] ? alertsMap[tx.transaction_id].fraud_score.toFixed(2) : '—'}
                  </td>
                )}
                <td style={{ padding: '12px' }}>{new Date(tx.timestamp).toLocaleString()}</td>
                {canEdit && (
                  <td style={{ padding: '12px' }}>
                    <select onChange={e => handleStatusChange(tx.transaction_id, e.target.value)} value={tx.status} style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', padding: '4px' }}>
                      <option value="approved">Одобрить</option>
                      <option value="pending_review">Проверка</option>
                      <option value="blocked">Заблокировать</option>
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsPage;