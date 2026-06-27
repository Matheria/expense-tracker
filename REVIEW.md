# Code Review Rules

## General

- PR = one task; no mixing features with unrelated refactoring
- `pnpm lint` must be green before opening PR
- `tsc --noEmit` must pass in both `frontend/` and `backend/`
- PR title follows Conventional Commits: `type: short description`, lowercase, no period
- PR body must use the project template (Что сделано / API / Тест-план)

## Commits

Use Conventional Commits. Valid types: `feat`, `fix`, `style`, `refactor`, `chore`, `docs`, `test`.
Message in imperative mood, lowercase, no trailing period.

## Code Style

- Prettier: single quotes, semicolons, trailing commas, 100-char line width
- No comments explaining *what* — only *why* (hidden constraint, subtle invariant, workaround)
- No multi-line docstrings or comment blocks
- No emojis unless explicitly requested
- UI text in Russian (`<html lang="ru">`)

## Frontend

### FSD Layer Rules

Layers (top → bottom): `app` → `views` → `widgets` → `features` → `entities` → `shared`

- Imports must only go downward (upper layer imports lower layer, never reverse)
- Feature slices: `features/<name>/{api,model,ui}/`
- `app/` — Next.js App Router routing only, thin wrappers, no business logic
- `views/` — page-level composition; no direct API calls
- `shared/` — truly cross-cutting; no feature-specific code

### Libraries & Constraints

- **zod must stay on v3** — v4 breaks `@hookform/resolvers`
- Forms: `react-hook-form` + `zod` + `@hookform/resolvers`
- HTTP: use the shared axios instance at `shared/api/http.ts` — do not create new axios instances
- Auth token: managed by `zustand` with `persist` middleware (localStorage key `auth`) — do not read/write it manually
- UI components: `shadcn/ui` with Base UI primitives (not Radix) + Tailwind CSS 4
- `form.tsx` is custom-written — do not replace it with the shadcn registry version

### Next.js

- No business logic in `app/` route files — delegate to `views/`
- Do not use Pages Router; App Router only
- Server Components by default; add `'use client'` only when needed (event handlers, hooks, browser APIs)

## Backend

### Structure

New module pattern: `module → controller → service → DTOs`

- DTOs use `class-validator` decorators
- Use `ConfigService` — never `process.env` directly
- `PrismaService` is injectable everywhere (global module) — no need to import `PrismaModule` per module

### Auth & Security

- All protected endpoints must have `@UseGuards(JwtAuthGuard)` + `@CurrentUser()` decorator
- No endpoint should expose another user's data — always scope queries by `userId` from the JWT
- Do not log or return sensitive fields (passwords, tokens)
- Validate all user input via DTOs at the controller boundary; do not pass raw request data to services

### Prisma

- Amounts stored as `Decimal(12,2)` — do not use `Float`
- `TransactionType` enum: `INCOME | EXPENSE` — no string literals
- Wrap multi-step DB operations in a `$transaction` to avoid races

### API

- Global prefix `/api`, port 3001
- Auth endpoints return `{ accessToken }` only
- Use standard HTTP status codes; do not return 200 for errors

## What Reviewers Check

1. **Correctness** — logic is right, edge cases handled, no silent failures
2. **Security** — no injection, no data leakage across users, input validated at boundaries
3. **FSD compliance** — no cross-layer import violations, feature code stays in its slice
4. **Type safety** — no `any`, no type assertions without justification, Prisma types used end-to-end
5. **No unnecessary abstractions** — three similar lines beat a premature abstraction; solve the problem in scope
6. **No dead code** — removed features fully deleted, no `// TODO` left in merged code
7. **Tests** — if the change has observable behavior, it should be testable; integration tests over mocks where possible
