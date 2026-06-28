---
name: unit-test
description: Сгенерировать unit-тест для указанного файла и создать рядом .spec.ts
model: sonnet
allowed-tools: Bash(git *), Bash(pnpm *), Read, Glob, Grep, Write, Edit
user-invocable: true
argument-hint: <path/to/file.ts>
---

# Unit Test Skill

Сгенерируй unit-тест для файла, переданного как аргумент.

## Аргументы

- $0 — путь к файлу (относительно корня репозитория), например `backend/src/modules/auth/auth.service.ts`

## Подготовка

1. Прочитай исходный файл: @$0
2. Определи контекст по пути:
   - Путь начинается с `backend/` → **NestJS** (Jest + `@nestjs/testing`)
   - Путь начинается с `frontend/` → **React/Next.js** (Vitest + React Testing Library)
3. Найди соседние файлы для понимания зависимостей — используй инструмент Glob с директорией файла из $0

## Определение имени тест-файла

Результирующий файл: тот же путь, суффикс `.spec.ts` вместо `.ts`.
Пример: `backend/src/modules/auth/auth.service.ts` → `backend/src/modules/auth/auth.service.spec.ts`

Если `.spec.ts` уже существует — прочитай его и **дополни** тестами, не перезаписывай с нуля.

## Шаблоны тестов

### Backend (NestJS)

Для **сервисов** (`*.service.ts`):

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TargetService } from './target.service';
// mock зависимостей — PrismaService, ConfigService, JwtService и т.д.

describe('TargetService', () => {
  let service: TargetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TargetService,
        {
          provide: DependencyService,
          useValue: { methodName: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<TargetService>(TargetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // тесты на каждый публичный метод
});
```

Для **контроллеров** (`*.controller.ts`):

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TargetController } from './target.controller';
import { TargetService } from './target.service';

describe('TargetController', () => {
  let controller: TargetController;
  let service: jest.Mocked<TargetService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TargetController],
      providers: [{ provide: TargetService, useValue: { method: jest.fn() } }],
    }).compile();

    controller = module.get<TargetController>(TargetController);
    service = module.get(TargetService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
```

Для **guard/strategy/decorator**: используй `jest.fn()` и тестируй `canActivate` / `validate` напрямую без `TestingModule`.

### Frontend (React/Next.js)

Для **React-компонентов** (`*.tsx`):

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TargetComponent } from './TargetComponent';

describe('TargetComponent', () => {
  it('renders without crash', () => {
    render(<TargetComponent />);
    expect(screen.getByRole('...')).toBeInTheDocument();
  });
});
```

Для **утилит / хуков** (`.ts` / hooks):

```typescript
import { renderHook, act } from '@testing-library/react';
import { useTargetHook } from './useTargetHook';

describe('useTargetHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useTargetHook());
    expect(result.current).toBeDefined();
  });
});
```

## Алгоритм генерации

1. Разбери публичные методы / экспорты из исходного файла
2. На каждый публичный метод напиши минимум один `it()`-блок:
   - happy path (успешный сценарий)
   - edge case если есть очевидный (null, пустой массив, ошибка)
3. Моки: мокируй только **прямые** зависимости — не транзитивные
4. Для backend-сервисов, использующих `PrismaService`, мокируй только вызванные методы модели
5. Не используй `any` — типизируй моки через `jest.Mocked<T>`

## Проверка зависимостей

Перед записью файла убедись, что нужные пакеты установлены:

- **Backend**: `@nestjs/testing` и `jest` уже включены в NestJS по умолчанию
- **Frontend**: если `@testing-library/react` отсутствует в `frontend/package.json` — **предупреди пользователя** и не создавай файл, а выведи команду для установки:
  ```
  pnpm --filter frontend add -D vitest @testing-library/react @testing-library/user-event @vitejs/plugin-react jsdom
  ```

## Правила

- Тест-файл создаётся рядом с исходным, не в отдельной папке `__tests__`
- Описания `describe` и `it` — на **русском языке**
- Не тестируй приватные методы напрямую
- Не импортируй реальный `PrismaClient` — только мокируй
- Не добавляй тест на то, что невозможно сломать (тривиальные геттеры без логики)
