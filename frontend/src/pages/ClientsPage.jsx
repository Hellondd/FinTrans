import React, { useState, useEffect } from 'react';
import { getClients } from '../services/api';
import ClientModal from '../components/ClientModal';
import { useRoleAccess } from '../hooks/useRoleAccess';

const ClientsPage = ({ user }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const { canEdit } = useRoleAccess(user?.role);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = search ? { search, limit: 100 } : { limit: 100 };
      const res = await getClients(params);
      setClients(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

  const handleUpdateClient = (updatedClient) => {
    setClients(prev => prev.map(c => c.client_id === updatedClient.client_id ? updatedClient : c));
    setSelectedClient(updatedClient);
  };

  const handleDeleteClient = (clientId) => {
    setClients(prev => prev.filter(c => c.client_id !== clientId));
  };

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Поиск по ФИО..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#1e293b', color: '#fff' }}
        />
        <button onClick={fetchClients} style={{ padding: '12px 24px', background: '#6366f1', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>🔍 Поиск</button>
      </div>

      {loading && <div>Загрузка...</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>ФИО</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Город</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Доход</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Скор</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Сегмент</th>
              <th style={{ padding: '12px' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.client_id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '12px' }}>{client.client_id}</td>
                <td style={{ padding: '12px' }}><strong>{client.full_name}</strong></td>
                <td style={{ padding: '12px' }}>{client.city || '—'}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{client.monthly_income?.toLocaleString() || '—'} ₽</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{client.credit_score || '—'}</td>
                <td style={{ padding: '12px' }}>{client.segment || '—'}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button onClick={() => setSelectedClient(client)} style={{ background: '#3b82f6', border: 'none', padding: '6px 12px', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>📋 Детали</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedClient && (
        <ClientModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdate={handleUpdateClient}
          onDelete={handleDeleteClient}
          userRole={user?.role}
        />
      )}
    </div>
  );
};

export default ClientsPage;