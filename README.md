# FinTrans

CRM-система для финансовой компании с автоматизацией скоринга, антифрод-анализом и аналитическими дашбордами.

## Технологии

- **FastAPI** — веб-фреймворк
- **PostgreSQL** — база данных
- **SQLAlchemy** — ORM
- **Alembic** — миграции
- **Docker** — контейнеризация
- **JWT** — авторизация

## Требования

- Python 3.11+
- Docker Desktop
- WSL2 (для Windows)


## Установка и запуск

### 1. Клонировать репозиторий

```
git clone <repo-url>
```


### 2. Создать файл .env
```
cd backend
cp .env.example .env
```

### 3. Запустить базу данных(обязательно установить DockerDesktop)
```
docker-compose up -d db
```
### 4. Установить зависимости
```
pip install -r requirements.txt
```

### 5. Применить миграции
```
alembic upgrade head
```

### 6. Запустить приложение
```
uvicorn app.main:app --reload
```

### 7. Открыть документацию

- Swagger: http://localhost:8000/docs

- ReDoc: http://localhost:8000/redoc


<img width="1920" height="1030" alt="Снимок экрана (1480)" src="https://github.com/user-attachments/assets/f60af267-4217-4a7a-b256-32ba4b68a853" />


## Структура проекта
```
backend/                         # Корневая папка проекта
│
├── app/                         # Основной код приложения
│   ├── api/                     # Слой маршрутов (HTTP эндоинты)
│   │   └── v1/                  # Версия API 1
│   │       └── endpoints/       # Точки входа (обработчики запросов)
│   │           ├── auth.py      # Регистрация, логин, получение JWT
│   │           ├── clients.py   # CRUD операции с клиентами
│   │           └── transactions.py # Работа с транзакциями
│   │
│   ├── core/                    # Ядро приложения (настройки и инфраструктура)
│   │   ├── config.py            # Чтение .env, настройки проекта
│   │   ├── database.py          # Подключение к PostgreSQL, движок SQLAlchemy
│   │   ├── deps.py              # Зависимости (get_db, get_current_user)
│   │   └── security.py          # Хеширование паролей, JWT токены
│   │
│   ├── models/                  # SQLAlchemy ORM модели (таблицы БД)
│   │   ├── __init__.py          # Инициализация пакета
│   │   ├── client.py            # Клиенты (ФИО, доход, скоринг, сегмент)
│   │   ├── user.py              # Пользователи системы (логин, пароль, роль)
│   │   ├── address.py           # Адреса клиентов
│   │   ├── contact.py           # Контакты (email, телефон, Telegram)
│   │   ├── document.py          # Документы (паспорт, ИНН, СНИЛС)
│   │   ├── product.py           # Продукты клиента (кредиты, депозиты)
│   │   ├── risk_profile.py      # Риск-профили (fraud-флаги, просрочки)
│   │   └── transaction.py       # Транзакции (сумма, тип, дата, страна)
│   │
│   ├── schemas/                 # Pydantic схемы (валидация входящих данных)
│   │   ├── __init__.py          # Инициализация пакета
│   │   ├── auth.py              # UserCreate, Token, TokenData
│   │   ├── client.py            # ClientCreate, ClientUpdate, ClientRead
│   │   └── transaction.py       # TransactionCreate, TransactionRead
│   │
│   ├── repositories/            # DAO слой (доступ к БД)
│   │   ├── __init__.py          # Инициализация пакета
│   │   ├── user_repo.py         # UserRepository (поиск, создание пользователя)
│   │   ├── client_repo.py       # ClientRepository (CRUD клиентов)
│   │   └── transaction_repo.py  # TransactionRepository (CRUD транзакций)
│   │
│   ├── utils/                   # Вспомогательные утилиты
│   │   ├── __init__.py          # Инициализация пакета
│   │   └── excel_import.py      # Импорт клиентов из clients.xlsx
│   │
│   └── main.py                  # Точка входа в приложение (FastAPI)
│
├── alembic/                     # Миграции базы данных
│   ├── versions/                # История изменений БД
│   │   └── 0af825fbea68_initial_migration_create_all_tables.py
│   ├── env.py                   # Конфиг подключения Alembic к БД
│   └── script.py.mako           # Шаблон для создания новых миграций
│
├── requirements.txt             # Все Python зависимости проекта
├── docker-compose.yml           # Запуск PostgreSQL в контейнере
├── .env.example                 # Пример переменных окружения (без секретов)
├── .gitignore                   # Исключения для Git
└── README.md                    # Документация по запуску проекта
```

## Реализованные компоненты

| № | Компонент | Статус |
|---|-----------|--------|
| 1 | БД (9 таблиц) | Готова |
| 2 | Модели (SQLAlchemy) | Готовы |
| 3 | Миграции (Alembic) | Готовы |
| 4 | API авторизации | Готов |
| 5 | API клиентов | Готов |
| 6 | API транзакций | Готов |
| 7 | Репозитории (DAO) | Готовы |
| 8 | Docker + PostgreSQL | Работает |
| 9 | Бизнес-логика (Скоринг) | Готова |
| 10 | Антифрод-сервис | Готов |

## Добавленная Бизнес-логика (Сервисный слой)
В директории `backend/app/services/` реализованы следующие сервисы:
1. **ScoringService (`scoring_service.py`)**: Реализует 5-факторную модель расчета кредитного скоринга и определение лимитов, присваивает клиенту сегмент и уровень риска.
2. **FraudService (`fraud_service.py`)**: Производит 6-факторный анализ транзакций, вычисляет Fraud Score и выносит решение: одобрить, отправить на ручную проверку или заблокировать транзакцию.
3. **ClientService (`client_service.py`)**: Инкапсулирует логику создания и управления клиентами, автоматически рассчитывая их скоринг.
4. **TransactionService (`transaction_service.py`)**: Управляет созданием транзакций, интегрируя обязательную предварительную проверку на мошенничество.




## Что нужно доделать

1. **Импорт данных из Excel (clients.xlsx)**
   - 7 листов, >200 000 записей
   - Нужен сервис ExcelImportService
   - Batch-обработка (чтобы не падало по таймауту)

2. **Дашборды и аналитика**
   - KPI в реальном времени
   - Экспорт PDF/CSV/Excel
