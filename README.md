# Expense Tracker

Веб-приложение для учёта личных доходов и расходов. Монорепозиторий: Next.js frontend + NestJS backend + PostgreSQL.

## Стек

| Слой | Технологии |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Base UI), Zustand, React Hook Form, Zod, Axios |
| **Backend** | NestJS 11, TypeScript, Prisma ORM, Passport JWT, class-validator, @nestjs/swagger |
| **База данных** | PostgreSQL 16 |
| **Инфраструктура** | Docker Compose, pnpm workspaces |

## Требования

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9 (`npm i -g pnpm`)
- [Docker](https://www.docker.com/) (для локальной БД)

## Быстрый старт

### 1. Установка зависимостей

```bash
pnpm install
```

### 2. Переменные окружения

Создайте файл `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expense_tracker"
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="7d"
```

Фронтенду переменные не нужны для локальной разработки — по умолчанию он обращается к `http://localhost:3001`.

### 3. База данных

Запустите PostgreSQL через Docker:

```bash
docker compose up -d
```

### 4. Миграции и генерация Prisma-клиента

```bash
pnpm --filter backend prisma:migrate
pnpm --filter backend prisma:generate
```

### 5. Dev-серверы

```bash
# В двух отдельных терминалах:
pnpm dev:backend     # NestJS → http://localhost:3001
pnpm dev:frontend    # Next.js → http://localhost:3000
```

Swagger UI доступен по адресу **http://localhost:3001/docs**.

## Структура проекта

```
expense-tracker/
├── frontend/                   # Next.js 16 приложение
│   └── src/
│       ├── app/                # App Router — роутинг, тонкие обёртки
│       ├── views/              # Компоненты уровня страницы (FSD "pages")
│       ├── widgets/            # Самодостаточные UI-блоки
│       ├── features/           # Пользовательские фичи (auth и др.)
│       │   └── <name>/{api,model,ui}/
│       ├── entities/           # Доменные объекты
│       └── shared/             # Кросс-слойные утилиты
│           ├── api/            # Axios-инстанс с Bearer-интерцептором
│           ├── config/         # Env-переменные
│           └── ui/             # Переиспользуемые примитивы
│
├── backend/                    # NestJS 11 приложение
│   ├── prisma/
│   │   └── schema.prisma       # Модели: User, Category, Transaction
│   └── src/
│       ├── main.ts             # Точка входа, Swagger, ValidationPipe
│       ├── app.module.ts       # Корневой модуль
│       └── modules/
│           ├── prisma/         # Глобальный PrismaModule
│           ├── auth/           # JWT-аутентификация (register, login)
│           ├── users/          # Профиль пользователя
│           ├── category/       # CRUD категорий
│           └── transaction/    # CRUD транзакций + сводка
│
├── docker-compose.yml          # PostgreSQL 16
└── package.json                # pnpm workspaces + корневые скрипты
```

## Основные эндпоинты

Все защищённые маршруты требуют заголовка `Authorization: Bearer <token>`.

### Аутентификация

| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Регистрация; возвращает `{ accessToken }` |
| `POST` | `/api/auth/login` | — | Вход; возвращает `{ accessToken }` |
| `GET` | `/api/users/me` | JWT | Профиль текущего пользователя |

### Категории

| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `POST` | `/api/categories` | JWT | Создать категорию |
| `GET` | `/api/categories` | JWT | Список категорий пользователя |
| `PATCH` | `/api/categories/:id` | JWT | Обновить категорию |
| `DELETE` | `/api/categories/:id` | JWT | Удалить категорию (ошибка если есть транзакции) |

### Транзакции

| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `POST` | `/api/transactions` | JWT | Создать транзакцию |
| `GET` | `/api/transactions` | JWT | Список с фильтрацией и пагинацией |
| `GET` | `/api/transactions/summary` | JWT | Финансовая сводка за месяц |
| `GET` | `/api/transactions/:id` | JWT | Транзакция по ID |
| `PATCH` | `/api/transactions/:id` | JWT | Обновить транзакцию |
| `DELETE` | `/api/transactions/:id` | JWT | Удалить транзакцию |

#### Параметры фильтрации `GET /api/transactions`

| Параметр | Тип | Описание |
|---|---|---|
| `dateFrom` | ISO 8601 | Начало диапазона дат |
| `dateTo` | ISO 8601 | Конец диапазона дат |
| `type` | `INCOME` \| `EXPENSE` | Тип транзакции |
| `categoryId` | UUID | Фильтр по категории |
| `page` | number (≥ 1) | Страница (по умолчанию 1) |
| `limit` | number (1–100) | Записей на странице (по умолчанию 10) |

#### Параметры `GET /api/transactions/summary`

| Параметр | Тип | Описание |
|---|---|---|
| `month` | number (1–12) | Номер месяца |
| `year` | number (≥ 2000) | Год |

## Полезные команды

```bash
pnpm lint                            # ESLint по всем воркспейсам
pnpm format                          # Prettier по всем файлам
pnpm build:frontend                  # Сборка Next.js
pnpm build:backend                   # Сборка NestJS

pnpm --filter backend prisma:migrate   # Применить миграции
pnpm --filter backend prisma:generate  # Перегенерировать Prisma-клиент

docker compose up -d                 # Запустить PostgreSQL
docker compose down                  # Остановить PostgreSQL
```
