# Frontend Architecture — Feature Slice Design (FSD)

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
