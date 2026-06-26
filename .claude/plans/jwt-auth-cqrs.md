# Plan: JWT-авторизация в NestJS backend (CQRS)

## Context

Backend — свежий NestJS 11 scaffold без модулей. Prisma-схема содержит модели User и Expense, но у User нет поля пароля. Нужно добавить JWT-авторизацию (регистрация + логин) с использованием CQRS-паттерна (`@nestjs/cqrs`) для взаимодействия между модулями.

## Архитектура CQRS

AuthModule не импортирует UsersModule напрямую. Вместо этого:
- **AuthService** отправляет команды и запросы через `CommandBus` / `QueryBus`
- **UsersModule** регистрирует обработчики команд и запросов
- Модули развязаны — общаются только через шину

### Команды и запросы

| Тип | Класс | Обработчик в | Описание |
|-----|-------|-------------|----------|
| Query | `GetUserByEmailQuery` | UsersModule | Найти пользователя по email |
| Query | `GetUserByIdQuery` | UsersModule | Найти пользователя по id |
| Command | `CreateUserCommand` | UsersModule | Создать нового пользователя |

---

## 1. Установка пакетов

В `backend/`:
```
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/cqrs passport passport-jwt bcrypt class-validator class-transformer
pnpm add -D @types/passport-jwt @types/bcrypt
```

## 2. Prisma-схема — добавить поля авторизации

Файл: `backend/prisma/schema.prisma`

Добавить в модель User:
- `passwordHash String @map("password_hash")` — хэш пароля
- `isActive Boolean @default(true) @map("is_active")` — мягкая блокировка
- `role String @default("user")` — роль (user/admin)

После: `prisma migrate dev --name add-auth-fields && prisma generate`

## 3. Переменные окружения

Добавить в `.env.example` и создать `.env`:
```
JWT_SECRET="change-me-in-production"
JWT_EXPIRATION="7d"
```

## 4. Структура файлов

```
src/modules/
  prisma/
    prisma.module.ts                — @Global(), экспортирует PrismaService
    prisma.service.ts               — extends PrismaClient

  users/
    users.module.ts                 — регистрирует CqrsModule и обработчики
    users.service.ts                — репозиторий: findByEmail, findById, create
    commands/
      create-user.command.ts        — { email, name?, passwordHash }
      create-user.handler.ts        — вызывает UsersService.create()
    queries/
      get-user-by-email.query.ts    — { email }
      get-user-by-email.handler.ts  — вызывает UsersService.findByEmail()
      get-user-by-id.query.ts       — { id }
      get-user-by-id.handler.ts     — вызывает UsersService.findById()

  auth/
    auth.module.ts                  — импортирует CqrsModule, PassportModule, JwtModule
    auth.controller.ts              — POST register, POST login
    auth.service.ts                 — использует CommandBus/QueryBus вместо прямого UsersService
    strategies/
      jwt.strategy.ts               — Bearer token, validate через QueryBus
    guards/
      jwt-auth.guard.ts             — extends AuthGuard('jwt')
    dto/
      register.dto.ts               — email, password (8-72), name?
      login.dto.ts                  — email, password
    interfaces/
      jwt-payload.interface.ts      — { sub, email, role }
```

**Итого:** 17 новых файлов, 2 модифицированных.

## 5. Ключевые реализации

### PrismaModule (global)
- `PrismaService extends PrismaClient`, `onModuleInit` → `$connect()`, `onModuleDestroy` → `$disconnect()`
- `@Global()` модуль — доступен везде без явного импорта

### UsersModule
- `UsersService` — чистый репозиторий (Prisma-запросы): `findByEmail()`, `findById()`, `create()`
- Обработчики CQRS зарегистрированы через `CqrsModule`:
  - `CreateUserHandler` → `usersService.create(command.email, command.name, command.passwordHash)`
  - `GetUserByEmailHandler` → `usersService.findByEmail(query.email)`
  - `GetUserByIdHandler` → `usersService.findById(query.id)`

### AuthModule
- **AuthService.register()**: `queryBus.execute(GetUserByEmailQuery)` → проверка дубля → `bcrypt.hash(password, 10)` → `commandBus.execute(CreateUserCommand)` → генерация JWT
- **AuthService.login()**: `queryBus.execute(GetUserByEmailQuery)` → проверка `isActive` → `bcrypt.compare()` → генерация JWT
- **JwtStrategy.validate()**: `queryBus.execute(GetUserByIdQuery)` → проверка `isActive` → возврат `{ id, email, role }` в `req.user`
- Одинаковое сообщение `Invalid credentials` при неверном email/пароле
- `JwtModule.registerAsync` для получения секрета из `ConfigService`

### Модификация main.ts
- Добавить `ValidationPipe` с `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`

### Модификация app.module.ts
- Импортировать `ConfigModule.forRoot({ isGlobal: true })`, `PrismaModule`, `UsersModule`, `AuthModule`
- Удалить `AppController`/`AppService` (scaffold больше не нужен)

## 6. Результат

- `POST /api/auth/register` — `{ email, password, name? }` → `{ accessToken }`
- `POST /api/auth/login` — `{ email, password }` → `{ accessToken }`
- `JwtAuthGuard` для защиты будущих маршрутов

## 7. Верификация

1. `pnpm --filter backend start:dev` — запуск без ошибок
2. `POST /api/auth/register` с `{"email":"test@test.com","password":"12345678"}` → 201 + accessToken
3. Повторная регистрация → 409 Conflict
4. `POST /api/auth/login` с правильными данными → 200 + accessToken
5. Логин с неверным паролем → 401
6. Невалидный body → 400 с описанием ошибок валидации
