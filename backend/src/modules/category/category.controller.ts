import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity } from './entities/category.entity';

/**
 * REST-контроллер для управления категориями.
 *
 * Все эндпоинты защищены `JwtAuthGuard`. Идентификатор пользователя
 * извлекается из JWT-токена через декоратор `@CurrentUser('id')`.
 *
 * Base URL: `/api/categories`
 */
@ApiTags('categories')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Токен отсутствует или недействителен' })
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Создаёт новую категорию для пользователя.
   *
   * `POST /api/categories`
   *
   * @param userId - UUID пользователя из JWT.
   * @param dto - Тело запроса с данными категории.
   * @returns Созданная категория.
   */
  @ApiOperation({ summary: 'Создать категорию' })
  @ApiCreatedResponse({ type: CategoryEntity, description: 'Категория успешно создана' })
  @ApiBadRequestResponse({ description: 'Ошибка валидации тела запроса' })
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(userId, dto);
  }

  /**
   * Возвращает все категории пользователя.
   *
   * `GET /api/categories`
   *
   * @param userId - UUID пользователя из JWT.
   * @returns Массив категорий, принадлежащих пользователю.
   */
  @ApiOperation({ summary: 'Список категорий текущего пользователя' })
  @ApiOkResponse({ type: [CategoryEntity], description: 'Массив категорий' })
  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.categoryService.findAll(userId);
  }

  /**
   * Обновляет поля существующей категории (частичное обновление).
   *
   * `PATCH /api/categories/:id`
   *
   * @param userId - UUID пользователя из JWT.
   * @param id - UUID категории.
   * @param dto - Поля для обновления (все опциональны).
   * @returns Обновлённая категория.
   * @throws {NotFoundException} Если категория не найдена или принадлежит другому пользователю.
   */
  @ApiOperation({ summary: 'Обновить категорию (частичное обновление)' })
  @ApiParam({ name: 'id', description: 'UUID категории', example: '550e8400-e29b-41d4-a716-446655440001' })
  @ApiOkResponse({ type: CategoryEntity, description: 'Обновлённая категория' })
  @ApiBadRequestResponse({ description: 'Ошибка валидации тела запроса' })
  @ApiNotFoundResponse({ description: 'Категория не найдена или принадлежит другому пользователю' })
  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(userId, id, dto);
  }

  /**
   * Удаляет категорию.
   *
   * `DELETE /api/categories/:id`
   *
   * @param userId - UUID пользователя из JWT.
   * @param id - UUID категории.
   * @returns `204 No Content`
   * @throws {NotFoundException} Если категория не найдена или принадлежит другому пользователю.
   * @throws {ConflictException} Если к категории привязаны транзакции.
   */
  @ApiOperation({ summary: 'Удалить категорию' })
  @ApiParam({ name: 'id', description: 'UUID категории', example: '550e8400-e29b-41d4-a716-446655440001' })
  @ApiNoContentResponse({ description: 'Категория успешно удалена' })
  @ApiNotFoundResponse({ description: 'Категория не найдена или принадлежит другому пользователю' })
  @ApiConflictResponse({ description: 'Нельзя удалить категорию: есть связанные транзакции' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.categoryService.remove(userId, id);
  }
}
