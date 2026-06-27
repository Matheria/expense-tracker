# Database

PostgreSQL 16. ORM — Prisma 6. Схема: `backend/prisma/schema.prisma`.

Локальное подключение: `postgresql://postgres:postgres@localhost:5432/expence_tracker`

---

## Модели

### User

Таблица `users`.

| Поле | Тип БД | Prisma-тип | Описание |
|---|---|---|---|
| `id` | `uuid` | `String` | PK, генерируется автоматически |
| `email` | `varchar` | `String` | Уникальный email пользователя |
| `name` | `varchar` | `String?` | Отображаемое имя (опционально) |
| `password_hash` | `varchar` | `String` | bcrypt-хэш пароля (cost factor 10) |
| `is_active` | `boolean` | `Boolean` | Флаг активности; `false` — вход заблокирован |
| `role` | `varchar` | `String` | Роль пользователя, по умолчанию `"user"` |
| `created_at` | `timestamptz` | `DateTime` | Дата создания (авто) |
| `updated_at` | `timestamptz` | `DateTime` | Дата последнего обновления (авто, `@updatedAt`) |

**Ограничения:** `email` — `@unique`.

**Связи:** один пользователь → много `Category`, много `Transaction`.

---

### Category

Таблица `Category` (без `@@map`, имя совпадает с моделью).

| Поле | Тип БД | Prisma-тип | Описание |
|---|---|---|---|
| `id` | `uuid` | `String` | PK, генерируется автоматически |
| `name` | `varchar` | `String` | Название категории (макс. 50 символов на уровне DTO) |
| `color` | `varchar` | `String` | Цвет в формате `#RRGGBB` |
| `icon` | `varchar` | `String` | Имя иконки (макс. 50 символов на уровне DTO) |
| `userId` | `uuid` | `String` | FK → `users.id` |
| `createdAt` | `timestamptz` | `DateTime` | Дата создания (авто) |
| `updatedAt` | `timestamptz` | `DateTime` | Дата обновления (авто) |

**Связи:**
- `userId` → `User` (many-to-one)
- одна категория → много `Transaction`

**Бизнес-правило:** категория не может быть удалена, пока к ней привязаны транзакции — PostgreSQL выбросит ошибку FK (`P2003`), которую сервис конвертирует в `ConflictException`.

---

### Transaction

Таблица `Transaction`.

| Поле | Тип БД | Prisma-тип | Описание |
|---|---|---|---|
| `id` | `uuid` | `String` | PK, генерируется автоматически |
| `amount` | `decimal(12,2)` | `Decimal` | Сумма; макс. 9 999 999 999,99; хранится точно |
| `type` | `TransactionType` | `TransactionType` | Enum: `INCOME` или `EXPENSE` |
| `description` | `varchar` | `String?` | Описание (опционально, макс. 255 символов на уровне DTO) |
| `date` | `timestamptz` | `DateTime` | Дата транзакции; границы месяца считаются через `Date.UTC` |
| `categoryId` | `uuid` | `String` | FK → `Category.id` |
| `userId` | `uuid` | `String` | FK → `users.id` |
| `createdAt` | `timestamptz` | `DateTime` | Дата создания записи (авто) |

**Связи:**
- `userId` → `User` (many-to-one)
- `categoryId` → `Category` (many-to-one)

**Важно:** `amount` хранится как `Decimal(12,2)`. Prisma возвращает его как `Prisma.Decimal`, который при JSON-сериализации превращается в **строку** (например, `"1500.50"`). На фронтенде тип поля — `string`.

---

## Enum

### TransactionType

```prisma
enum TransactionType {
  INCOME
  EXPENSE
}
```

---

## Связи (ER)

```
User ──< Category ──< Transaction
User ──────────────< Transaction
```

- `User` 1:N `Category`
- `User` 1:N `Transaction`
- `Category` 1:N `Transaction`

---

## Соглашения по работе с БД

**Никакого `Float` для денег** — только `Decimal(12,2)`. Float теряет точность на дробных суммах.

**Границы месяца** — всегда вычислять через `Date.UTC(year, month - 1, 1)`, чтобы не зависеть от временной зоны сервера.

**Транзакционность** — многошаговые операции оборачивать в `prisma.$transaction([...])` (интерактивные транзакции) или батчи (`prisma.$transaction` с массивом). Пример — `findAll`: `findMany` и `count` выполняются атомарно.

**Проверка владения при удалении** — использовать `deleteMany({ where: { id, userId } })` вместо `findUnique` + `delete`, чтобы атомарно проверить владение и удалить запись.

**Race condition при обновлении** — перехватывать `PrismaClientKnownRequestError` с кодом `P2025` (запись исчезла между `findUnique` и `update`).

---

## Миграции

```bash
# Применить pending-миграции и сгенерировать клиент
pnpm --filter backend prisma:migrate

# Только перегенерировать клиент (после ручного изменения схемы без миграции)
pnpm --filter backend prisma:generate
```

Файлы миграций хранятся в `backend/prisma/migrations/`. Каждая миграция — отдельная папка с `migration.sql`.
