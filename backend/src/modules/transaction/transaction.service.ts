import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Transaction, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { SummaryQueryDto } from './dto/summary-query.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

/** Финансовая сводка за календарный месяц конкретного пользователя. */
export interface TransactionSummary {
  /** Номер месяца (1–12). */
  month: number;
  /** Календарный год. */
  year: number;
  /** Суммарный доход за период (число с двумя знаками после запятой). */
  income: number;
  /** Суммарный расход за период (число с двумя знаками после запятой). */
  expense: number;
  /** Баланс: `income - expense`. */
  balance: number;
  /** Разбивка сумм по категориям и типу транзакции. */
  byCategory: Array<{
    categoryId: string;
    type: TransactionType;
    total: number;
  }>;
}

/** Страница транзакций с метаданными пагинации. */
export interface PaginatedTransactions {
  /** Транзакции текущей страницы. */
  data: Transaction[];
  /** Общее количество транзакций, удовлетворяющих фильтру. */
  total: number;
  /** Текущая страница (начиная с 1). */
  page: number;
  /** Максимальное число записей на странице. */
  limit: number;
  /** Общее число страниц (не менее 1). */
  totalPages: number;
}

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создаёт новую транзакцию для указанного пользователя.
   *
   * @param userId - UUID аутентифицированного пользователя.
   * @param dto - Данные создаваемой транзакции.
   * @returns Созданная запись `Transaction`.
   * @throws {NotFoundException} Если категория не найдена или не принадлежит пользователю.
   */
  async create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    await this.ensureCategoryOwned(userId, dto.categoryId);
    return this.prisma.transaction.create({ data: { ...dto, userId } });
  }

  /**
   * Возвращает постраничный список транзакций пользователя с поддержкой фильтров.
   *
   * Фильтры применяются совместно (AND). Сортировка — по дате убывания.
   * Если результатов нет, `totalPages` равен 1.
   *
   * @param userId - UUID аутентифицированного пользователя.
   * @param query - Параметры фильтрации и пагинации.
   * @returns Объект `PaginatedTransactions` с данными текущей страницы и метаданными.
   */
  async findAll(userId: string, query: QueryTransactionsDto): Promise<PaginatedTransactions> {
    const where: Prisma.TransactionWhereInput = { userId };
    if (query.type) where.type = query.type;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.dateFrom || query.dateTo) {
      where.date = {};
      if (query.dateFrom) where.date.gte = new Date(query.dateFrom);
      if (query.dateTo) where.date.lte = new Date(query.dateTo);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({ where, orderBy: { date: 'desc' }, skip, take: limit }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  /**
   * Возвращает одну транзакцию по ID.
   *
   * Проверяет владение: транзакция должна принадлежать `userId`.
   *
   * @param userId - UUID аутентифицированного пользователя.
   * @param id - UUID транзакции.
   * @returns Найденная транзакция.
   * @throws {NotFoundException} Если транзакция не найдена или принадлежит другому пользователю.
   */
  async findOne(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    if (!transaction || transaction.userId !== userId) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  /**
   * Обновляет поля существующей транзакции (частичное обновление).
   *
   * Если передан новый `categoryId`, проверяет, что категория принадлежит пользователю.
   * Использует `try/catch` вокруг Prisma-обновления на случай гонки (запись удалена
   * между проверкой существования и самим обновлением).
   *
   * @param userId - UUID аутентифицированного пользователя.
   * @param id - UUID транзакции.
   * @param dto - Поля для обновления (все опциональны).
   * @returns Обновлённая транзакция.
   * @throws {NotFoundException} Если транзакция не найдена, принадлежит другому пользователю
   *   или категория из `dto.categoryId` не найдена / принадлежит другому пользователю.
   */
  async update(userId: string, id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const existing = await this.prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Transaction not found');
    }
    if (dto.categoryId) await this.ensureCategoryOwned(userId, dto.categoryId);
    try {
      return await this.prisma.transaction.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Transaction not found');
      }
      throw e;
    }
  }

  /**
   * Удаляет транзакцию пользователя.
   *
   * Использует `deleteMany` с составным фильтром `{ id, userId }`, чтобы атомарно
   * совместить проверку владения с удалением (исключает гонки).
   *
   * @param userId - UUID аутентифицированного пользователя.
   * @param id - UUID транзакции.
   * @returns `void`
   * @throws {NotFoundException} Если транзакция не найдена или принадлежит другому пользователю.
   */
  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.transaction.deleteMany({ where: { id, userId } });
    if (count === 0) throw new NotFoundException('Transaction not found');
  }

  /**
   * Возвращает финансовую сводку пользователя за указанный месяц.
   *
   * Границы периода вычисляются через `Date.UTC`, чтобы не зависеть от
   * временной зоны сервера. Суммы берутся двумя агрегирующими запросами:
   * по типу (INCOME/EXPENSE) и по категории + типу.
   *
   * @param userId - UUID аутентифицированного пользователя.
   * @param query - Месяц (1–12) и год (≥ 2000).
   * @returns Объект `TransactionSummary` с доходом, расходом, балансом и разбивкой по категориям.
   */
  async summary(userId: string, { month, year }: SummaryQueryDto): Promise<TransactionSummary> {
    // Use Date.UTC to avoid server-timezone-dependent month boundaries.
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    const where: Prisma.TransactionWhereInput = { userId, date: { gte: start, lt: end } };

    const byType = await this.prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
    });
    const income = this.sumFor(byType, TransactionType.INCOME);
    const expense = this.sumFor(byType, TransactionType.EXPENSE);

    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId', 'type'],
      where,
      _sum: { amount: true },
    });
    const byCategory = grouped.map((row) => ({
      categoryId: row.categoryId,
      type: row.type,
      total: Number(row._sum.amount ?? 0),
    }));

    return { month, year, income, expense, balance: income - expense, byCategory };
  }

  /**
   * Извлекает сумму транзакций указанного типа из результата `groupBy`.
   *
   * @param rows - Строки агрегации Prisma (`groupBy` по `type`).
   * @param type - Тип транзакции (`INCOME` или `EXPENSE`).
   * @returns Числовое значение суммы; 0, если строка для данного типа отсутствует.
   */
  private sumFor(
    rows: Array<{ type: TransactionType; _sum: { amount: Prisma.Decimal | null } }>,
    type: TransactionType,
  ): number {
    const row = rows.find((r) => r.type === type);
    return Number(row?._sum.amount ?? 0);
  }

  /**
   * Проверяет, что категория существует и принадлежит пользователю.
   *
   * Выбрасывает исключение при любом несоответствии, чтобы предотвратить
   * привязку транзакций к чужим категориям.
   *
   * @param userId - UUID аутентифицированного пользователя.
   * @param categoryId - UUID проверяемой категории.
   * @returns `void`
   * @throws {NotFoundException} Если категория не найдена или принадлежит другому пользователю.
   */
  private async ensureCategoryOwned(userId: string, categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }
  }
}
