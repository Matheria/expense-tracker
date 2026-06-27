# Backend Architecture — NestJS 11

## Module Structure

```
backend/src/
├── app.module.ts              # Root module — imports all feature modules
└── modules/
    ├── prisma/                # Global PrismaModule — provides PrismaService
    ├── auth/                  # JWT auth (register, login)
    │   ├── decorators/        # @CurrentUser() — extracts user from JWT payload
    │   ├── dto/               # RegisterDto, LoginDto (class-validator)
    │   ├── guards/            # JwtAuthGuard — apply with @UseGuards(JwtAuthGuard)
    │   ├── interfaces/        # JwtPayload { sub, email }
    │   └── strategies/        # JwtStrategy (passport-jwt)
    ├── users/                 # UsersModule — user lookup, GET /users/me
    ├── category/              # CategoryModule — CRUD for user categories
    └── transaction/           # TransactionModule — CRUD for transactions
```

## Auth

- Strategy: JWT (access token only, no refresh token)
- Token lifetime: `JWT_EXPIRATION` env var, default `7d`
- Secret: `JWT_SECRET` env var (required)
- Endpoints: `POST /api/auth/register`, `POST /api/auth/login` — both return `{ accessToken }`
- Protect routes: `@UseGuards(JwtAuthGuard)` + `@CurrentUser()` to get the authenticated user

## Prisma

- `PrismaModule` is global — inject `PrismaService` anywhere without re-importing
- Schema: `backend/prisma/schema.prisma`
- Models: `User`, `Category`, `Transaction`
- `TransactionType` enum: `INCOME | EXPENSE`
- All amounts stored as `Decimal(12, 2)`

## Conventions

- DTOs use `class-validator` decorators for validation
- `@nestjs/cqrs` (`CqrsModule`) is used in `AuthModule` — extend with commands/queries if needed
- `ConfigModule.forRoot({ isGlobal: true })` — use `ConfigService` (not `process.env`) everywhere
- All routes are prefixed `/api` (set in `main.ts`)

## Environment Variables

| Variable         | Required | Default | Description                  |
| ---------------- | -------- | ------- | ---------------------------- |
| `DATABASE_URL`   | yes      | —       | PostgreSQL connection string |
| `JWT_SECRET`     | yes      | —       | Signing secret for JWT       |
| `JWT_EXPIRATION` | no       | `7d`    | Token lifetime (e.g. `7d`)   |

## Актуализация документации

После изменения любых методов, необходимо актуализировать или добавить JSDoc. А для dto и контроллеров добавить декоракторы swagger
