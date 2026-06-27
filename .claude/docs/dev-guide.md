# Developer Guide

---

## Добавить бэкенд-модуль

Шаблон на примере нового модуля `budget/`.

### 1. Создать файлы модуля

```
backend/src/modules/budget/
├── budget.module.ts
├── budget.controller.ts
├── budget.service.ts
├── dto/
│   ├── create-budget.dto.ts
│   └── update-budget.dto.ts
└── entities/
    └── budget.entity.ts
```

### 2. Сервис

```typescript
// budget.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}
  // методы...
}
```

- Инжектировать `PrismaService` напрямую — он глобальный, не нужно импортировать `PrismaModule`.
- Всегда фильтровать по `userId` из параметра, не из тела запроса.
- Для удаления использовать `deleteMany({ where: { id, userId } })`.

### 3. Контроллер

```typescript
// budget.controller.ts
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('budgets')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Токен отсутствует или недействителен' })
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}
  // эндпоинты...
}
```

- `@UseGuards(JwtAuthGuard)` + `@CurrentUser('id')` — на каждом защищённом эндпоинте.
- Добавить `@ApiOperation`, `@ApiXxxResponse` на каждый метод.

### 4. DTO

```typescript
// create-budget.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty({ description: '...', example: '...' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
```

- Каждое поле: `@ApiProperty` / `@ApiPropertyOptional` + `class-validator`-декоратор.
- Опциональные поля: `@IsOptional()` первым, затем остальные валидаторы.

### 5. Entity (Swagger-схема ответа)

```typescript
// entities/budget.entity.ts
import { ApiProperty } from '@nestjs/swagger';

export class BudgetEntity {
  @ApiProperty({ example: 'uuid' })
  id!: string;
  // остальные поля...
}
```

### 6. Модуль

```typescript
// budget.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';

@Module({
  imports: [AuthModule],          // нужен для экспорта JwtAuthGuard
  controllers: [BudgetController],
  providers: [BudgetService],
})
export class BudgetModule {}
```

### 7. Подключить к корневому модулю

```typescript
// app.module.ts
import { BudgetModule } from './modules/budget/budget.module';

@Module({
  imports: [
    // ...существующие модули
    BudgetModule,
  ],
})
export class AppModule {}
```

### 8. Добавить JSDoc

На каждый публичный метод сервиса и контроллера:
```typescript
/**
 * Краткое описание метода.
 *
 * @param userId - UUID аутентифицированного пользователя.
 * @param dto - ...
 * @returns ...
 * @throws {NotFoundException} Если ...
 */
```

---

## Добавить фронтенд-фичу (FSD)

Шаблон на примере фичи `create-budget`.

### 1. Тип в entity-слое

Если домен новый — создать `entities/budget/`:

```
frontend/src/entities/budget/
├── api/
│   └── budget.api.ts    # API-функции через shared http
├── model/
│   └── types.ts         # TypeScript-типы
└── index.ts             # публичный re-export
```

```typescript
// entities/budget/api/budget.api.ts
import { http } from '@/shared/api/http';
import { Budget } from '../model/types';

export const budgetApi = {
  create: (data: CreateBudgetPayload) =>
    http.post<Budget>('/budgets', data).then(r => r.data),
};
```

```typescript
// entities/budget/index.ts
export * from './model/types';
export * from './api/budget.api';
```

### 2. Фича

```
frontend/src/features/create-budget/
└── ui/
    └── create-budget-dialog.tsx
```

- Фича может импортировать из `entities/` и `shared/`, но **не** из `views/`, `widgets/`, других `features/`.
- Форма: `react-hook-form` + `zod` (v3) + `@hookform/resolvers/zod`.

```typescript
// пример схемы
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(50),
});
```

### 3. Подключить в view или widget

```typescript
// views/home/index.tsx
import { CreateBudgetDialog } from '@/features/create-budget/ui/create-budget-dialog';
```

### 4. Если нужна страница — добавить в app/

```
frontend/src/app/
└── (protected)/
    └── budgets/
        └── page.tsx     # тонкая обёртка → импортирует view
```

```typescript
// app/(protected)/budgets/page.tsx
import { BudgetsView } from '@/views/budgets';
export default function BudgetsPage() { return <BudgetsView />; }
```

---

## Добавить миграцию БД

### 1. Изменить схему

Отредактировать `backend/prisma/schema.prisma`:

```prisma
model Budget {
  id        String   @id @default(uuid())
  name      String
  amount    Decimal  @db.Decimal(12, 2)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

Не забыть добавить обратную связь на `User`:
```prisma
model User {
  // ...
  budgets Budget[]
}
```

### 2. Создать и применить миграцию

```bash
pnpm --filter backend prisma:migrate
# Prisma запросит имя миграции, например: add_budget_model
```

Это создаст `backend/prisma/migrations/<timestamp>_add_budget_model/migration.sql` и применит её.

### 3. Перегенерировать клиент

```bash
pnpm --filter backend prisma:generate
```

После этого `Budget`, типы и методы доступны через `import { Budget } from '@prisma/client'` и `prisma.budget.*`.

### 4. Суммы — только Decimal

```prisma
amount Decimal @db.Decimal(12, 2)  # правильно
amount Float                        # запрещено — теряет точность
```

---

## Чеклист перед PR

- [ ] `pnpm lint` — зелёный
- [ ] `npx tsc --noEmit` в `backend/` и `frontend/` — без ошибок
- [ ] JSDoc на всех публичных методах сервиса и контроллера
- [ ] `@ApiProperty` / `@ApiPropertyOptional` на всех полях DTO
- [ ] `@ApiOperation` + `@ApiXxxResponse` на каждом методе контроллера
- [ ] Все запросы к БД фильтруются по `userId`
- [ ] Удаление использует `deleteMany({ where: { id, userId } })`
- [ ] Суммы хранятся как `Decimal`, не `Float`
- [ ] Новый модуль зарегистрирован в `app.module.ts`
- [ ] Новый FSD-слой не нарушает правила импорта
