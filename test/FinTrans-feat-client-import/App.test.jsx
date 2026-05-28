import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../FinTrans-feat-client-import/FinTrans-feat-client-import/frontend/src/App.jsx';

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
    expect(screen.getByPlaceholderText('Введите ваш логин')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите пароль')).toBeInTheDocument();
  });

  it('validates empty fields and does not call API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(
      await screen.findByText('Пожалуйста, заполните все поля ввода'),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends urlencoded payload on successful login', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token-321' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          full_name: 'Тест',
          email: 'test@example.com',
          role: 'User',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.change(screen.getByPlaceholderText('Введите ваш логин'), {
      target: { value: 'user@mail.test' },
    });
    fireEvent.change(screen.getByPlaceholderText('Введите пароль'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const loginRequest = fetchMock.mock.calls[0];
    expect(loginRequest[0]).toBe('http://127.0.0.1:8000/api/v1/auth/login');
    expect(loginRequest[1].headers['Content-Type']).toBe(
      'application/x-www-form-urlencoded',
    );
    expect(loginRequest[1].body).toBeInstanceOf(URLSearchParams);
    expect(loginRequest[1].body.get('username')).toBe('user@mail.test');
    expect(loginRequest[1].body.get('password')).toBe('secret');
    expect(localStorage.getItem('fintrans_auth_token')).toBe('token-321');
  });

  it('shows backend detail for failed login', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Пользователь не найден' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.change(screen.getByPlaceholderText('Введите ваш логин'), {
      target: { value: 'unknown' },
    });
    fireEvent.change(screen.getByPlaceholderText('Введите пароль'), {
      target: { value: 'bad' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Пользователь не найден')).toBeInTheDocument();
  });

  it('requests profile on mount when token exists', async () => {
    localStorage.setItem('fintrans_auth_token', 'saved-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        full_name: 'Stored User',
        email: 'stored@example.com',
        role: 'Admin',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/v1/auth/me',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer saved-token',
          }),
        }),
      );
    });
  });
});
