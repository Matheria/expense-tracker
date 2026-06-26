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

## Code Style

- Prettier: single quotes, semicolons, trailing commas, 100 char width
- ESLint: root config + per-app configs (`frontend/.eslintrc.json`, `backend/.eslintrc.json`)
- Language: Russian for user-facing UI text (`<html lang="ru">`)
