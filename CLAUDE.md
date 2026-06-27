# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Expense tracker — monorepo with a Next.js 16 frontend and NestJS 11 backend. Uses pnpm workspaces.

## Architecture

- **`frontend/`** — Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript
- **`backend/`** — NestJS 11, Prisma ORM, PostgreSQL, TypeScript
- **`docker-compose.yml`** — PostgreSQL 16 for local development

Backend runs on port 3001 with global prefix `/api`. Frontend runs on default Next.js port 3000.

## Commands

```bash
# Development
pnpm dev:frontend          # Start Next.js dev server
pnpm dev:backend           # Start NestJS in watch mode

# Build
pnpm build:frontend
pnpm build:backend

# Lint & format
pnpm lint                  # Run ESLint across all workspaces
pnpm format                # Run Prettier on all files

# Database (run from backend/)
pnpm --filter backend prisma:generate   # Generate Prisma client
pnpm --filter backend prisma:migrate    # Run migrations

# Docker
docker compose up -d       # Start PostgreSQL
```

## Database

PostgreSQL connection: `postgresql://postgres:postgres@localhost:5432/expence_tracker`

Prisma schema is at `backend/prisma/schema.prisma`. Models: User, Category, Transaction.

## Frontend Architecture — Feature Slice Design (FSD)

The frontend follows [Feature Slice Design](https://feature-sliced.design/) with the following layers (highest to lowest):

```
frontend/src/
├── app/          # Next.js App Router — routing only; thin wrappers that delegate to views/
├── views/        # Page-level components (FSD "pages" layer, renamed to avoid Next.js conflict)
├── widgets/      # Complex self-contained UI blocks composed from features/entities
├── features/     # User-facing features (auth, expenses, etc.)
│   └── auth/
│       ├── api/      # API calls for this feature
│       ├── model/    # Zustand stores, business logic
│       └── ui/       # React components specific to this feature
├── entities/     # Domain objects (user, expense, category)
└── shared/       # Cross-cutting utilities — never imports from upper layers
    ├── api/      # Axios instance with auth interceptor
    ├── config/   # Env vars (NEXT_PUBLIC_API_URL)
    └── ui/       # Re-usable primitive components (if not from shadcn)
```

**Import rules (FSD):** each layer may only import from layers below it. `features` can import from `entities` and `shared`; `views` can import from `features`, `entities`, and `shared`; `app/` can import from everything.

## UI Components — shadcn/ui

Components live in `frontend/src/components/ui/`. Add new ones with:

```bash
cd frontend && npx shadcn@latest add <component>
```

This project uses the Base UI variant of shadcn (Tailwind CSS 4). The `form.tsx` component is custom-written (not from the registry) and wraps `react-hook-form`.

Key libraries: `react-hook-form` + `zod` + `@hookform/resolvers` for forms; `zustand` (with `persist`) for client state; `axios` for HTTP.

## Branch Strategy — GitHub Flow

We use [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow):

- **`master`** — production-ready at all times; never commit directly
- **`feat/<short-description>`** — new features (e.g. `feat/frontend-home-screen`)
- **`fix/<short-description>`** — bug fixes (e.g. `fix/auth-token-refresh`)
- **`chore/<short-description>`** — tooling, deps, config (e.g. `chore/update-prisma`)

**Workflow:**
1. Branch off `master`: `git checkout -b feat/<name>`
2. Commit early and often on the feature branch
3. Open a PR into `master` when ready for review
4. Merge only after review; delete the branch after merge

Branch names: lowercase, hyphens only, no slashes beyond the type prefix.

## Commit Convention

[Conventional Commits](https://www.conventionalcommits.org/) — `type: short description` in imperative mood, lowercase, no period.

| Type | When to use |
|---|---|
| `feat` | new feature or endpoint |
| `fix` | bug fix |
| `style` | formatting / visual changes, no logic |
| `refactor` | code restructure, no behavior change |
| `chore` | tooling, deps, config, migrations |
| `docs` | documentation only |
| `test` | adding or updating tests |

Body is optional — use it when the **why** isn't obvious from the title.

## Pull Requests

Title follows the same Conventional Commits format as commit messages (`type: short description`).

PR body template:

```markdown
## Что сделано
- краткий буллет на каждое логическое изменение

## API (если добавлены/изменены эндпоинты)
| Method | Endpoint | Auth | Описание |
|--------|----------|------|----------|
| POST   | /api/... | —    | ...      |

## Тест-план
- [ ] ...
```

- Один PR — одна задача; не смешивать фичи с рефакторингом если это не связано.
- Перед открытием PR убедиться: `pnpm lint` зелёный, `tsc --noEmit` без ошибок.
- Удалять ветку после мержа.

## Code Style

- Prettier: single quotes, semicolons, trailing commas, 100 char width
- ESLint: flat config (ESLint 9), per-app (`frontend/eslint.config.mjs` extends `eslint-config-next`; `backend/eslint.config.mjs` uses `typescript-eslint`)
- Language: Russian for user-facing UI text (`<html lang="ru">`)
