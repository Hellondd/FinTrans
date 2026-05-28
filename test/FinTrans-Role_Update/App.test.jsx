import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../FinTrans-Role_Update/FinTrans-Role_Update/frontend/src/pages/Dashboard', () => ({
  default: () => <div data-testid="dashboard-mock">Dashboard</div>,
}));

import App from '../../FinTrans-Role_Update/FinTrans-Role_Update/frontend/src/App.jsx';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders login screen by default', () => {
    render(<App />);
    expect(screen.getByText('Вход в систему')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите логин')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите пароль')).toBeInTheDocument();
  });

  it('shows backend error message on failed login', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Неверный пароль' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.change(screen.getByPlaceholderText('Введите логин'), {
      target: { value: 'user' },
    });
    fireEvent.change(screen.getByPlaceholderText('Введите пароль'), {
      target: { value: 'bad-pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Неверный пароль')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses fallback error text when backend detail is missing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.change(screen.getByPlaceholderText('Введите логин'), {
      target: { value: 'user' },
    });
    fireEvent.change(screen.getByPlaceholderText('Введите пароль'), {
      target: { value: 'bad-pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Неверные данные')).toBeInTheDocument();
  });

  it('sends JSON credentials and stores token on successful login', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ full_name: 'Тестовый Пользователь' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.change(screen.getByPlaceholderText('Введите логин'), {
      target: { value: 'admin' },
    });
    fireEvent.change(screen.getByPlaceholderText('Введите пароль'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:8000/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'secret' }),
      }),
    );
    expect(localStorage.getItem('fintrans_auth_token')).toBe('token-123');
  });

  it('requests user profile when token exists in localStorage', async () => {
    localStorage.setItem('fintrans_auth_token', 'saved-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ full_name: 'Existing User' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/v1/auth/me',
        expect.objectContaining({
          headers: { Authorization: 'Bearer saved-token' },
        }),
      );
    });
  });
});
