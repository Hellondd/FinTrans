import React, { useState, useEffect } from 'react';
import { getFraudAlerts, updateFraudAlert } from '../services/api';

const FraudAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await getFraudAlerts();
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (id) => {
    try {
      await updateFraudAlert(id, { status: 'resolved' });
      fetchAlerts();
    } catch (err) {
      alert('Ошибка');
    }
  };

  return (
    <div>
      <h2>⚠️ Fraud-алерты</h2>
      {loading && <div>Загрузка...</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>Транзакция</th>
              <th style={{ padding: '12px' }}>Клиент</th>
              <th style={{ padding: '12px' }}>Score</th>
              <th style={{ padding: '12px' }}>Причина</th>
              <th style={{ padding: '12px' }}>Статус</th>
              <th style={{ padding: '12px' }}>Создан</th>
              <th style={{ padding: '12px' }}>Действие</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map(alert => (
              <tr key={alert.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '12px' }}>{alert.id}</td>
                <td style={{ padding: '12px' }}>{alert.transaction_id}</td>
                <td style={{ padding: '12px' }}>{alert.client_id}</td>
                <td style={{ padding: '12px' }}>{alert.fraud_score.toFixed(2)}</td>
                <td style={{ padding: '12px' }}>{alert.reason}</td>
                <td style={{ padding: '12px' }}>{alert.status === 'open' ? '🟡 Открыт' : '✅ Закрыт'}</td>
                <td style={{ padding: '12px' }}>{new Date(alert.created_at).toLocaleString()}</td>
                <td style={{ padding: '12px' }}>
                  {alert.status === 'open' && (
                    <button onClick={() => handleResolve(alert.id)} style={{ background: '#10b981', border: 'none', padding: '6px 12px', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>Закрыть</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FraudAlertsPage;