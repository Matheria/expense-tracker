# План: Категории трат (backend)

## Context

Авторизация уже реализована (JWT через Passport, `JwtAuthGuard`, `req.user = { id, email, role }`). Теперь нужно дать пользователю возможность управлять собственными категориями трат. Добавляем новую сущность `Category` (id, имя, цвет, иконка, привязка к пользователю), сервис с CRUD-методами и защищённый контроллер с валидацией. Категории строго изолированы по пользователю: видеть/менять/удалять можно только свои.

По решению пользователя: **простой сервис + контроллер** (без CQRS, в отличие от существующих users/auth) и **новый `@CurrentUser()` декоратор** для получения текущего пользователя.

## Чеклист реализации

- [x] **Схема:** добавить модель `Category` и связь `categories Category[]` в `User` (`backend/prisma/schema.prisma`)
- [x] **Миграция:** `pnpm --filter backend prisma:migrate` + `pnpm --filter backend prisma:generate`
- [x] **Декоратор:** создать `@CurrentUser()` (`auth/decorators/current-user.decorator.ts`)
- [x] **DTO:** `create-category.dto.ts` (class-validator) + `update-category.dto.ts` (`PartialType`)
- [x] **Сервис:** `category.service.ts` с `create/findAll/update/remove` + проверка владения
- [x] **Контроллер:** `category.controller.ts` с `@UseGuards(JwtAuthGuard)` и `@CurrentUser('id')`
- [x] **Модуль:** `category.module.ts` (`imports: [AuthModule]`)
- [x] **Регистрация:** добавить `CategoryModule` в `app.module.ts`
- [x] **Проверка:** прогнать end-to-end сценарии (см. раздел «Проверка») + `pnpm lint`

## 1. Prisma-схема

`backend/prisma/schema.prisma` — добавить модель `Category` (стиль как у `Expense`: без `@map`) и связь в `User`:

```prisma
model User {
  // ...существующие поля...
  expenses     Expense[]
  categories   Category[]   // <-- добавить
  // ...
}

model Category {
  id        String   @id @default(uuid())
  name      String
  color     String
  icon      String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

После правки схемы — миграция:
```bash
pnpm --filter backend prisma:migrate    # создаст миграцию category
pnpm --filter backend prisma:generate   # обновит Prisma client
```

## 2. Декоратор `@CurrentUser()`

Новый файл `backend/src/modules/auth/decorators/current-user.decorator.ts`:

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  id: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext): CurrentUserData | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;
    return data ? user[data] : user;
  },
);
```

Возвращаемая стратегией форма (`{ id, email, role }`) уже подтверждена в `auth/strategies/jwt.strategy.ts`. В контроллере используем `@CurrentUser('id') userId: string`.

## 3. DTO (class-validator)

`backend/src/modules/category/dto/create-category.dto.ts` — по образцу `auth/dto/register.dto.ts` (non-null assertion `!`, `@MaxLength`). Глобальный `ValidationPipe` с `forbidNonWhitelisted: true` (в `main.ts`) требует объявить все принимаемые поля.

```ts
import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/, { message: 'color must be a hex like #RRGGBB' })
  color!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  icon!: string;
}
```

`backend/src/modules/category/dto/update-category.dto.ts` — частичное обновление через `PartialType`:

```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
```

(`@nestjs/mapped-types` входит в зависимости NestJS; если не установлен — добавить, либо продублировать поля с `@IsOptional()`.)

## 4. Сервис

`backend/src/modules/category/category.service.ts` — инжектит `PrismaService` напрямую (`PrismaModule` глобальный), по образцу `users.service.ts`. Все методы скоупятся по `userId`; для update/delete сначала проверяем владение и кидаем `NotFoundException`.

```ts
@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({ data: { ...dto, userId } });
  }

  findAll(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({ where: { userId } });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.ensureOwned(userId, id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.ensureOwned(userId, id);
    await this.prisma.category.delete({ where: { id } });
  }

  private async ensureOwned(userId: string, id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }
  }
}
```

## 5. Контроллер

`backend/src/modules/category/category.controller.ts` — защищён `@UseGuards(JwtAuthGuard)` на уровне класса; `userId` из `@CurrentUser('id')`. Маршруты под глобальным префиксом `/api` → `/api/categories`.

```ts
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.categoryService.findAll(userId);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.categoryService.remove(userId, id);
  }
}
```

## 6. Модуль и регистрация

`backend/src/modules/category/category.module.ts`:

```ts
@Module({
  imports: [AuthModule],          // даёт JwtAuthGuard/JwtStrategy
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
```

В `backend/src/app.module.ts` добавить `CategoryModule` в `imports`.

> Примечание: `JwtAuthGuard` работает через зарегистрированную глобально passport-стратегию. `AuthModule` экспортирует `JwtAuthGuard`/`JwtStrategy`, поэтому импорта `AuthModule` достаточно. Если при запуске возникнет «Unknown authentication strategy "jwt"», убедиться, что `JwtStrategy` поднимается (она в провайдерах AuthModule).

## Критичные файлы

- `backend/prisma/schema.prisma` — модель `Category` + связь в `User`
- `backend/src/modules/auth/decorators/current-user.decorator.ts` — **новый**
- `backend/src/modules/category/dto/create-category.dto.ts` — **новый**
- `backend/src/modules/category/dto/update-category.dto.ts` — **новый**
- `backend/src/modules/category/category.service.ts` — **новый**
- `backend/src/modules/category/category.controller.ts` — **новый**
- `backend/src/modules/category/category.module.ts` — **новый**
- `backend/src/app.module.ts` — регистрация модуля

## Проверка (end-to-end)

1. `docker compose up -d` (PostgreSQL), затем миграция + generate (см. п.1).
2. `pnpm dev:backend` — сервер на `:3001`, префикс `/api`.
3. Получить токен: `POST /api/auth/login` → `accessToken`.
4. С `Authorization: Bearer <token>`:
   - `POST /api/categories` `{ "name": "Еда", "color": "#FF5733", "icon": "food" }` → 201 + объект.
   - `GET /api/categories` → массив только своих категорий.
   - `PATCH /api/categories/:id` `{ "name": "Продукты" }` → 200 обновлённый.
   - `DELETE /api/categories/:id` → 204.
5. Негатив: без токена → 401; чужой `id` в PATCH/DELETE → 404; лишнее поле в body или невалидный `color` → 400 (ValidationPipe).
6. `pnpm lint` — проверка стиля.
