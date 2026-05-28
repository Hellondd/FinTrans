# FinTrans CRM

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
cd backend
```


### 2. Создать файл .env
```
cp .env.example .env
```

### 3. Запустить контейнеры (обязательно установить Docker Desktop)
```
docker-compose up -d --build
```

### 4. Применить миграции
```
docker exec -it fintrans-backend alembic upgrade head
```

### 5. Импортировать данные из Excel
```
pip install -r requirements.txt
```
Импорт транзакций идёт дольше из-за ограничения PostgreSQL (32767 параметров), но все данные сохраняются
<img width="1920" height="454" alt="Снимок экрана (1527)" src="https://github.com/user-attachments/assets/f33383c4-2fec-461c-bd56-1ef0e37046eb" />



### 5. Применить миграции
```
docker exec -it fintrans-backend python run_import.py
```

### 6. Открыть документацию

- Swagger: http://localhost:8000/docs

- ReDoc: http://localhost:8000/redoc


<img width="1920" height="1033" alt="Снимок экрана (1521)" src="https://github.com/user-attachments/assets/0ff180c0-1630-452b-be48-ba248fa3f606" />

## Авторизация для получения токена

<img width="1920" height="1036" alt="Снимок экрана (1508)" src="https://github.com/user-attachments/assets/bf17c61b-702f-4832-ad9f-91e5671b557c" />

## Получение клиента для менеджера
<img width="1920" height="827" alt="Снимок экрана (1528)" src="https://github.com/user-attachments/assets/970a38b3-ff79-41ac-a8c2-664ff899c857" />



## Dashboard get
<img width="1920" height="1033" alt="Снимок экрана (1525)" src="https://github.com/user-attachments/assets/60ba17a6-a6a1-4c0a-a03c-52f12397d409" />

## API Эндпоинты

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/api/v1/auth/register` | Регистрация пользователя | Все |
| POST | `/api/v1/auth/login` | Вход (JWT токен) | Все |
| GET | `/api/v1/clients/` | Список клиентов | Авторизованные |
| POST | `/api/v1/clients/` | Создать клиента | Авторизованные |
| GET | `/api/v1/clients/{id}` | Карточка клиента | Авторизованные |
| PUT | `/api/v1/clients/{id}` | Обновить клиента | Авторизованные |
| DELETE | `/api/v1/clients/{id}` | Удалить клиента | Авторизованные |
| GET | `/api/v1/transactions/` | Список транзакций | Авторизованные |
| POST | `/api/v1/transactions/` | Создать транзакцию | Авторизованные |
| PUT | `/api/v1/transactions/{id}` | Обновить транзакцию | Авторизованные |
| DELETE | `/api/v1/transactions/{id}` | Удалить транзакцию | Авторизованные |
| GET | `/api/v1/dashboard/kpi` | KPI дашборда | Авторизованные |
| GET | `/api/v1/dashboard/transactions/daily` | Динамика транзакций | Авторизованные |
| GET | `/api/v1/dashboard/segments` | Сегменты клиентов | Авторизованные |
| GET | `/api/v1/dashboard/fraud/stats` | Статистика фрода | ADMIN, SECURITY |
| POST | `/api/v1/import/excel` | Импорт из Excel | ADMIN |


## Структура проекта
```
backend/
├── app/
│   ├── api/v1/endpoints/   # Эндпоинты (auth, clients, transactions, dashboard, import)
│   ├── core/               # Конфиг, БД, зависимости, безопасность
│   ├── models/             # SQLAlchemy модели (9 таблиц)
│   ├── schemas/            # Pydantic схемы
│   ├── repositories/       # DAO слой
│   ├── services/           # Бизнес-логика (скоринг, антифрод, дашборд)
│   └── utils/              # Вспомогательные функции (Excel импорт)
├── alembic/                # Миграции БД
├── data/                   # Excel файлы для импорта
├── requirements.txt
├── docker-compose.yml
├── Dockerfile
├── run_import.py           # Скрипт импорта данных
├── .env.example
└── README.md
```

Интерфейс 

<img width="1920" height="1028" alt="Снимок экрана (1560)" src="https://github.com/user-attachments/assets/95b259af-ea9e-484d-b38b-a99700a2d156" />


## Реализованные компоненты

## Реализованные компоненты

| № | Компонент | Статус |
|---|-----------|--------|
| 1 | БД (9 таблиц) | ✅ Готова |
| 2 | Модели (SQLAlchemy) | ✅ Готовы |
| 3 | Миграции (Alembic) | ✅ Готовы |
| 4 | API авторизации (JWT) | ✅ Готов |
| 5 | API клиентов (CRUD) | ✅ Готов |
| 6 | API транзакций (CRUD) | ✅ Готов |
| 7 | Репозитории (DAO) | ✅ Готовы |
| 8 | Docker + PostgreSQL | ✅ Работает |
| 9 | Скоринг-сервис | ✅ Готов |
| 10 | Антифрод-сервис | ✅ Готов |
| 11 | Дашборд KPI | ✅ Готов |
| 12 | Импорт из Excel | ✅ Готов |

## Бизнес-логика (Сервисный слой)
В директории `backend/app/services/` реализованы следующие сервисы:
1. **ScoringService (`scoring_service.py`)**: Реализует 5-факторную модель расчета кредитного скоринга и определение лимитов, присваивает клиенту сегмент и уровень риска.
2. **FraudService (`fraud_service.py`)**: Производит 6-факторный анализ транзакций, вычисляет Fraud Score и выносит решение: одобрить, отправить на ручную проверку или заблокировать транзакцию.
3. **ClientService (`client_service.py`)**: Инкапсулирует логику создания и управления клиентами, автоматически рассчитывая их скоринг.
4. **TransactionService (`transaction_service.py`)**: Управляет созданием транзакций, интегрируя обязательную предварительную проверку на мошенничество.

## AuditLog и FraudAlert
Внедрена система автоматического аудита подозрительных транзакций:
1. **Модель и База данных**: Создана таблица `fraud_alerts` (модель `FraudAlert`) для хранения инцидентов со связями к транзакциям и клиентам.
2. **Логирование при фроде**: `TransactionService` автоматически генерирует алерт в базе данных через `FraudAlertRepository`, если транзакция получает статус `blocked` или `manual_review` в результате проверки антифрод-сервисом.
3. **API Управления алертов**: Добавлены защищенные эндпоинты (`/api/v1/fraud/alerts`), доступные только для ролей `admin` и `security` (реализована проверка через `get_current_security_user`):
   - Просмотр списка алертов.
   - Изменение статуса алерта (например, закрытие инцидента - `resolved`).

## Управление продуктами клиентов
Реализован функционал для получения всех финансовых продуктов (кредиты, депозиты, карты) конкретного клиента:
1. **Схема**: Создана схема `ProductRead` для валидации и сериализации ответа API.
2. **Репозиторий**: Добавлен `ProductRepository` для взаимодействия с таблицей `products` в базе данных.
3. **Сервис**: В `ClientService` реализован метод `get_client_products`, который сначала проверяет существование клиента, а затем обращается к `ProductRepository` для получения списка продуктов.
4. **API Эндпоинт**: Добавлен эндпоинт `GET /api/v1/clients/{client_id}/products`, который корректно делегирует бизнес-логику сервисному слою согласно требованиям архитектуры.

## Переменные окружения (.env)

| Переменная | Описание |
|------------|----------|
| `POSTGRES_SERVER` | Хост БД (db для Docker) |
| `POSTGRES_USER` | Пользователь БД |
| `POSTGRES_PASSWORD` | Пароль БД |
| `POSTGRES_DB` | Название БД |
| `JWT_SECRET_KEY` | Секрет для JWT |
| `JWT_ALGORITHM` | Алгоритм (HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Время жизни токена |

## Полезные команды

### Остановка контейнеров
```
docker-compose down
```

### Перезапуск (без потери данных)
```
docker-compose down && docker-compose up -d
```

### Полный сброс (удаляет БД)
```
docker-compose down -v && docker-compose up -d --build
```

### Просмотр логов
```
docker logs fintrans-backend --tail 50
docker logs fintrans-postgres --tail 50
```

### Подключение к БД
```
docker exec -it fintrans-postgres psql -U fintrans -d fintrans_db
```


## Что ещё нужно сделать в проекте (по ТЗ)
## 🔴 MUST

| № | Задача | Статус | Описание |
|---|--------|--------|----------|
| 1 | Карточка клиента с агрегированными данными | ❌ Не сделано | `GET /api/v1/clients/{id}/full` — все связанные данные (контакты, адреса, документы, продукты, транзакции)  |
| 2 | Список продуктов клиента | ✅ Готово | `GET /api/v1/clients/{id}/products`  |
| 3 | Роли и права доступа (RBAC) | 🔧 Частично | Ограничить доступ к эндпоинтам по ролям (ADMIN, MANAGER, ANALYST, SECURITY, VIEWER)  |
| 4 | AuditLog | ✅ Готово | Логирование изменений клиентов/скора/транзакций  |

## 🟡 SHOULD 

| № | Задача | Статус | Описание |
|---|--------|--------|----------|
| 6 | Тесты | ❌ Не сделано | Покрытие бизнес-логики тестами ≥70%  |
| 7 | Экспорт отчетов (PDF/CSV/Excel) | ❌ Не сделано | Дашборды с экспортом  |
| 8 | Уведомления (email/telegram) | ❌ Не сделано | При fraud-алертах  |
