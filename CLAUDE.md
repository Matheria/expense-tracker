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

Prisma schema is at `backend/prisma/schema.prisma`. Models: User, Expense.

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

## Code Style

- Prettier: single quotes, semicolons, trailing commas, 100 char width
- ESLint: root config + per-app configs (`frontend/.eslintrc.json`, `backend/.eslintrc.json`)
- Language: Russian for user-facing UI text (`<html lang="ru">`)
