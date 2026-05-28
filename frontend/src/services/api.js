import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fintrans_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Авторизация
export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const getCurrentUser = () => api.get('/auth/me');

// Клиенты
export const getClients = (params) => api.get('/clients', { params });
export const getClientById = (id) => api.get(`/clients/${id}`);
export const createClient = (data) => api.post('/clients', data);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);
export const getClientProducts = (clientId) =>
  api.get(`/clients/${clientId}/products`);

// Транзакции
export const getTransactions = (params) => api.get('/transactions', { params });
export const createTransaction = (data) => api.post('/transactions', data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
export const checkTransactionFraud = (data) => api.post('/transactions/check', data);

// Fraud алерты (только security/admin)
export const getFraudAlerts = (params) => api.get('/fraud/alerts', { params });
export const updateFraudAlert = (id, data) => api.patch(`/fraud/alerts/${id}`, data);

// Dashboard
export const getDashboardKPI = () => api.get('/dashboard/kpi');
export const getDailyTransactions = (days) =>
  api.get('/dashboard/transactions/daily', { params: { days } });
export const getFraudStats = () => api.get('/dashboard/fraud/stats');
export const getSegmentDistribution = () => api.get('/dashboard/segments/distribution');

export default api;