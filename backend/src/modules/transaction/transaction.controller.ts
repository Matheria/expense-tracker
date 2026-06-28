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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { SummaryQueryDto } from './dto/summary-query.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PaginatedTransactionsEntity } from './entities/paginated-transactions.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { TransactionSummaryEntity } from './entities/transaction-summary.entity';
import { TransactionTotalsEntity } from './entities/transaction-totals.entity';
import { TransactionService } from './transaction.service';

/**
 * REST-контроллер для управления транзакциями.
 *
 * Все эндпоинты защищены `JwtAuthGuard`. Идентификатор пользователя
 * извлекается из JWT-токена через декоратор `@CurrentUser('id')`.
 *
 * Base URL: `/api/transactions`
 */
@ApiTags('transactions')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Токен отсутствует или недействителен' })
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  /**
   * Создаёт новую транзакцию.
   *
   * `POST /api/transactions`
   *
   * @param userId - UUID пользователя из JWT.
   * @param dto - Тело запроса с данными транзакции.
   * @returns Созданная транзакция.
   * @throws {NotFoundException} Если категория не найдена или не принадлежит пользователю.
   */
  @ApiOperation({ summary: 'Создать транзакцию' })
  @ApiCreatedResponse({ type: TransactionEntity, description: 'Транзакция успешно создана' })
  @ApiBadRequestResponse({ description: 'Ошибка валидации тела запроса' })
  @ApiNotFoundResponse({ description: 'Категория не найдена или не принадлежит пользователю' })
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTransactionDto) {
    return this.transactionService.create(userId, dto);
  }

  /**
   * Возвращает постраничный список транзакций с поддержкой фильтров.
   *
   * `GET /api/transactions`
   *
   * @param userId - UUID пользователя из JWT.
   * @param query - Параметры фильтрации (`dateFrom`, `dateTo`, `type`, `categoryId`) и пагинации (`page`, `limit`).
   * @returns Объект `PaginatedTransactions` с транзакциями и метаданными пагинации.
   */
  @ApiOperation({ summary: 'Список транзакций с фильтрацией и пагинацией' })
  @ApiOkResponse({ type: PaginatedTransactionsEntity, description: 'Постраничный список транзакций' })
  @ApiBadRequestResponse({ description: 'Ошибка валидации параметров запроса' })
  @Get()
  findAll(@CurrentUser('id') userId: string, @Query() query: QueryTransactionsDto) {
    return this.transactionService.findAll(userId, query);
  }

  /**
   * Возвращает общую финансовую сводку пользователя за всё время.
   *
   * `GET /api/transactions/totals`
   *
   * Маршрут объявлен до `:id`, чтобы избежать перехвата строки `totals` как UUID.
   *
   * @param userId - UUID пользователя из JWT.
   * @returns Объект `TransactionTotals` с суммарными доходом, расходом, балансом и количеством.
   */
  @ApiOperation({ summary: 'Общая финансовая сводка за всё время' })
  @ApiOkResponse({ type: TransactionTotalsEntity, description: 'Сводка за всё время' })
  @Get('totals')
  totals(@CurrentUser('id') userId: string) {
    return this.transactionService.totals(userId);
  }

  /**
   * Возвращает финансовую сводку за указанный месяц.
   *
   * `GET /api/transactions/summary`
   *
   * Маршрут объявлен до `:id`, чтобы избежать перехвата строки `summary` как UUID.
   *
   * @param userId - UUID пользователя из JWT.
   * @param query - Месяц (1–12) и год (≥ 2000).
   * @returns Объект `TransactionSummary` с доходом, расходом, балансом и разбивкой по категориям.
   */
  @ApiOperation({ summary: 'Финансовая сводка за месяц' })
  @ApiOkResponse({ type: TransactionSummaryEntity, description: 'Сводка за указанный месяц' })
  @ApiBadRequestResponse({ description: 'Ошибка валидации параметров запроса' })
  @Get('summary')
  summary(@CurrentUser('id') userId: string, @Query() query: SummaryQueryDto) {
    return this.transactionService.summary(userId, query);
  }

  /**
   * Возвращает одну транзакцию по ID.
   *
   * `GET /api/transactions/:id`
   *
   * @param userId - UUID пользователя из JWT.
   * @param id - UUID транзакции.
   * @returns Найденная транзакция.
   * @throws {NotFoundException} Если транзакция не найдена или принадлежит другому пользователю.
   */
  @ApiOperation({ summary: 'Получить транзакцию по ID' })
  @ApiParam({ name: 'id', description: 'UUID транзакции', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ type: TransactionEntity, description: 'Найденная транзакция' })
  @ApiNotFoundResponse({ description: 'Транзакция не найдена или принадлежит другому пользователю' })
  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.transactionService.findOne(userId, id);
  }

  /**
   * Обновляет поля существующей транзакции (частичное обновление).
   *
   * `PATCH /api/transactions/:id`
   *
   * @param userId - UUID пользователя из JWT.
   * @param id - UUID транзакции.
   * @param dto - Поля для обновления (все опциональны).
   * @returns Обновлённая транзакция.
   * @throws {NotFoundException} Если транзакция или новая категория не найдена / принадлежит другому пользователю.
   */
  @ApiOperation({ summary: 'Обновить транзакцию (частичное обновление)' })
  @ApiParam({ name: 'id', description: 'UUID транзакции', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ type: TransactionEntity, description: 'Обновлённая транзакция' })
  @ApiBadRequestResponse({ description: 'Ошибка валидации тела запроса' })
  @ApiNotFoundResponse({ description: 'Транзакция или категория не найдена / принадлежит другому пользователю' })
  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(userId, id, dto);
  }

  /**
   * Удаляет транзакцию.
   *
   * `DELETE /api/transactions/:id`
   *
   * @param userId - UUID пользователя из JWT.
   * @param id - UUID транзакции.
   * @returns `204 No Content`
   * @throws {NotFoundException} Если транзакция не найдена или принадлежит другому пользователю.
   */
  @ApiOperation({ summary: 'Удалить транзакцию' })
  @ApiParam({ name: 'id', description: 'UUID транзакции', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiNoContentResponse({ description: 'Транзакция успешно удалена' })
  @ApiNotFoundResponse({ description: 'Транзакция не найдена или принадлежит другому пользователю' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.transactionService.remove(userId, id);
  }
}
