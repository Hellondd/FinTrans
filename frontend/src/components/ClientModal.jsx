import React, { useState, useEffect } from 'react';
import { getClientProducts, updateClient, deleteClient } from '../services/api';
import { useRoleAccess } from '../hooks/useRoleAccess';

const ClientModal = ({ client, onClose, onUpdate, onDelete, userRole }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [products, setProducts] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...client });
  const { canEdit, canDelete } = useRoleAccess(userRole);

  useEffect(() => {
    if (client?.client_id) {
      loadProducts();
    }
  }, [client]);

  const loadProducts = async () => {
    try {
      const res = await getClientProducts(client.client_id);
      setProducts(res.data);
    } catch (err) {
      console.error('Ошибка загрузки продуктов', err);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await updateClient(client.client_id, formData);
      onUpdate(res.data);
      setEditMode(false);
    } catch (err) {
      alert('Ошибка обновления');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Удалить клиента?')) {
      try {
        await deleteClient(client.client_id);
        onDelete(client.client_id);
        onClose();
      } catch (err) {
        alert('Ошибка удаления');
      }
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#1e293b', borderRadius: '16px', width: '90%', maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>{editMode ? 'Редактирование клиента' : `Клиент: ${client.full_name}`}</h2>
          <div>
            {canEdit && !editMode && <button onClick={() => setEditMode(true)} style={{ background: '#3b82f6', marginRight: '8px', padding: '6px 12px', borderRadius: '6px', border: 'none', color: '#fff', cursor: 'pointer' }}>✏️ Редактировать</button>}
            {canDelete && <button onClick={handleDelete} style={{ background: '#ef4444', padding: '6px 12px', borderRadius: '6px', border: 'none', color: '#fff', cursor: 'pointer' }}>🗑️ Удалить</button>}
            <button onClick={onClose} style={{ marginLeft: '12px', background: '#475569', border: 'none', padding: '6px 12px', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #334155', marginBottom: '20px' }}>
          {['info', 'products'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: 'none', border: 'none', color: activeTab === tab ? '#6366f1' : '#94a3b8', padding: '8px 16px', cursor: 'pointer', fontWeight: activeTab === tab ? 'bold' : 'normal' }}>
              {tab === 'info' ? 'Основное' : 'Продукты'}
            </button>
          ))}
        </div>

        {activeTab === 'info' && (
          <div>
            {editMode ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                <input value={formData.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="ФИО" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }} />
                <input value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Город" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }} />
                <input type="number" value={formData.monthly_income || ''} onChange={e => setFormData({...formData, monthly_income: parseFloat(e.target.value)})} placeholder="Доход" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }} />
                <select value={formData.status || 'ACTIVE'} onChange={e => setFormData({...formData, status: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: '#0f172a', color: '#fff' }}>
                  <option value="ACTIVE">Активен</option>
                  <option value="BLOCKED">Заблокирован</option>
                  <option value="CLOSED">Закрыт</option>
                </select>
                <button onClick={handleUpdate} style={{ background: '#10b981', border: 'none', padding: '10px', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>Сохранить</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><strong>ID</strong><br/>{client.client_id}</div>
                <div><strong>ФИО</strong><br/>{client.full_name}</div>
                <div><strong>Город</strong><br/>{client.city || '—'}</div>
                <div><strong>Доход</strong><br/>{client.monthly_income?.toLocaleString() || '—'} ₽</div>
                <div><strong>Кредитный скор</strong><br/>{client.credit_score || '—'}</div>
                <div><strong>Сегмент</strong><br/>{client.segment || '—'}</div>
                <div><strong>Статус</strong><br/>{client.status}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            {products.length === 0 ? <p>Нет продуктов</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#334155' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Тип</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Сумма</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Ставка</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.product_id} style={{ borderBottom: '1px solid #475569' }}>
                      <td style={{ padding: '8px' }}>{p.product_type}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{p.amount?.toLocaleString()} ₽</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{p.interest_rate}%</td>
                      <td style={{ padding: '8px' }}>{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientModal;