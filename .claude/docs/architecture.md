# Architecture

## Обзор

Монорепозиторий на pnpm workspaces. Два воркспейса: `frontend/` и `backend/`. Корневой `package.json` содержит только скрипты-прокси и настройку pnpm.

```
expence-tracker/
├── frontend/          # Next.js 16 (App Router)
├── backend/           # NestJS 11
├── docker-compose.yml # PostgreSQL 16
└── package.json       # pnpm workspaces root
```

---

## Backend — NestJS 11

### Структура модулей

```
backend/src/
├── main.ts                    # Bootstrap: ValidationPipe, CORS, global prefix /api, Swagger
├── app.module.ts              # Корневой модуль — импортирует все feature-модули
└── modules/
    ├── prisma/                # PrismaModule (global) — PrismaService доступен везде
    ├── auth/                  # JWT-аутентификация
    │   ├── auth.module.ts
    │   ├── auth.controller.ts # POST /auth/register, POST /auth/login
    │   ├── auth.service.ts    # bcrypt, CQRS, JWT sign
    │   ├── decorators/        # @CurrentUser() — достаёт { id, email, role } из request.user
    │   ├── dto/               # RegisterDto, LoginDto
    │   ├── guards/            # JwtAuthGuard — оборачивает passport-jwt
    │   ├── interfaces/        # JwtPayload { sub, email, role }
    │   └── strategies/        # JwtStrategy — validate() проверяет isActive
    ├── users/                 # Профиль пользователя
    │   ├── users.module.ts
    │   ├── users.controller.ts  # GET /users/me
    │   ├── users.service.ts
    │   ├── commands/          # CreateUserCommand + Handler (CQRS)
    │   └── queries/           # GetUserByIdQuery, GetUserByEmailQuery + Handlers
    ├── category/              # CRUD категорий
    │   ├── category.module.ts
    │   ├── category.controller.ts
    │   ├── category.service.ts
    │   ├── dto/               # CreateCategoryDto, UpdateCategoryDto
    │   └── entities/          # CategoryEntity (Swagger schema)
    └── transaction/           # CRUD транзакций + сводка
        ├── transaction.module.ts
        ├── transaction.controller.ts
        ├── transaction.service.ts
        ├── dto/               # Create/Update/Query/SummaryDto
        └── entities/          # TransactionEntity, PaginatedTransactionsEntity, TransactionSummaryEntity
```

### Паттерны

**CQRS** — используется в `AuthModule` и `UsersModule`. Команды изменяют состояние (`CreateUserCommand`), запросы читают (`GetUserByEmailQuery`, `GetUserByIdQuery`). `CqrsModule` зарегистрирован в `AuthModule`.

**Глобальные провайдеры** — `PrismaModule` объявлен `isGlobal: true`, поэтому `PrismaService` инжектируется в любой сервис без повторного импорта модуля. Аналогично `ConfigModule.forRoot({ isGlobal: true })`.

**Guard + Decorator** — защита маршрутов строится из двух частей:
- `@UseGuards(JwtAuthGuard)` — проверяет токен, кладёт `{ id, email, role }` в `request.user`
- `@CurrentUser('id')` — извлекает нужное поле из `request.user`

**Владение ресурсами** — все запросы к категориям и транзакциям фильтруются по `userId` из токена. Сервисы никогда не доверяют `userId` из тела запроса.

**Атомарность удаления** — `deleteMany({ where: { id, userId } })` совмещает проверку владения с удалением в одном SQL-запросе, исключая race condition между проверкой и удалением.

**Обработка гонок при обновлении** — `findUnique` + `update` разделены; Prisma-ошибка `P2025` (запись удалена между двумя операциями) перехватывается и конвертируется в `NotFoundException`.

### Конфигурация

`ConfigModule` читает `.env` из корня `backend/`. Переменные доступны только через `ConfigService` — прямой доступ к `process.env` запрещён соглашением.

| Переменная | Обязательна | Default | Описание |
|---|---|---|---|
| `DATABASE_URL` | да | — | PostgreSQL DSN |
| `JWT_SECRET` | да | — | Секрет подписи JWT |
| `JWT_EXPIRATION` | нет | `7d` | Время жизни токена |

---

## Frontend — Next.js 16

### Feature Slice Design (FSD)

Строгий однонаправленный импорт: верхний слой может импортировать только нижние.

```
frontend/src/
├── app/           # Next.js App Router — только роутинг, thin wrappers
│   ├── page.tsx               # / → редирект на /login или /home
│   └── (auth)/                # Route group для auth-страниц
│       ├── login/page.tsx
│       └── register/page.tsx
├── views/         # Компоненты уровня страницы (FSD "pages", переименованы из-за конфликта)
│   ├── home/
│   ├── login/
│   └── register/
├── widgets/       # Самодостаточные UI-блоки (несколько фич + UI)
│   ├── app-sidebar/         # Тёмный сайдбар: профиль, навигация, действия, выход
│   ├── balance-card/        # Hero-карточка баланса (мотив-глобус)
│   ├── stats-strip/         # Полоса метрик: транзакций / доходы / расходы
│   ├── category-breakdown/  # Карточки топ-категорий по тратам
│   ├── spending-chart/      # Столбчатая динамика доходов/расходов по месяцам
│   ├── transactions-rail/   # Правая лента транзакций с фильтром Все/Доходы/Расходы
│   └── tip-card/            # Тёмная карточка с советом (мотив-глобус)
├── features/      # Пользовательские фичи
│   ├── auth/
│   │   ├── api/   # auth.api.ts — register/login запросы
│   │   ├── model/ # auth.store.ts — Zustand + persist
│   │   └── ui/    # login-form.tsx, register-form.tsx
│   ├── create-category/
│   ├── create-transaction/
│   └── dashboard/           # Агрегаты дашборда
│       ├── lib/   # format.ts — деньги/даты (RUB, ru-RU)
│       └── model/ # use-dashboard.ts — выборка + расчёт баланса/категорий/месяцев
├── entities/      # Доменные объекты с API-методами и типами
│   ├── category/  # api/, model/types.ts, index.ts
│   ├── transaction/
│   └── user/
└── shared/        # Кросс-слойные утилиты — никогда не импортирует верхние слои
    ├── api/       # http.ts — Axios instance с Bearer-интерцептором
    ├── config/    # env.ts — NEXT_PUBLIC_API_URL
    └── ui/        # globe.tsx (декоративный мотив); shadcn: frontend/src/components/ui/
```

### Дизайн-система

«Soft fintech ledger» — светлый серый холст, белые карточки, near-black чернила
(`--ink #1a1b1d`), мягкие акценты `--sky` (баланс) и `--mint` (выделенная категория),
`--income` для положительных сумм. Дисплейный шрифт — **Manrope** (`--font-display`,
крупные суммы), тело — **Geist** (`--font-sans`). Токены в `frontend/src/app/globals.css`.
Главный экран — оболочка из трёх зон: тёмный сайдбар | дашборд | лента транзакций.

### Ключевые решения

**Axios instance** (`shared/api/http.ts`) — создаётся один раз, Bearer-токен прикрепляется через `request interceptor`. Хранилище регистрирует getter через `configureAuth()` при инициализации стора — нет циклической зависимости.

**Auth store** (`features/auth/model/auth.store.ts`) — Zustand + `persist` middleware, ключ `'auth'` в `localStorage`. Экспортирует `useAuthStore` и `selectIsAuthenticated`.

**shadcn/ui** — компоненты живут в `frontend/src/components/ui/`. Используется Base UI (не Radix) вариант под Tailwind CSS 4. `form.tsx` — кастомный, не из реестра.

**Формы** — `react-hook-form` + `zod@^3` + `@hookform/resolvers`. Zod должен оставаться на версии 3 — v4 несовместима с `@hookform/resolvers`.

---

## Поток данных (типичный запрос)

```
Browser
  → Next.js page (app/)
    → view component (views/)
      → feature/entity component (features/, entities/)
        → entity API function (entities/<name>/api/)
          → shared http (axios instance с Bearer)
            → NestJS Controller
              → JwtAuthGuard (validate JWT, populate request.user)
                → Service (бизнес-логика, проверка владения)
                  → PrismaService
                    → PostgreSQL
```
