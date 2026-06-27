import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Transaction, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { SummaryQueryDto } from './dto/summary-query.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

export interface TransactionSummary {
  month: number;
  year: number;
  income: number;
  expense: number;
  balance: number;
  byCategory: Array<{
    categoryId: string;
    type: TransactionType;
    total: number;
  }>;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    await this.ensureCategoryOwned(userId, dto.categoryId);
    return this.prisma.transaction.create({ data: { ...dto, userId } });
  }

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

  async findOne(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    if (!transaction || transaction.userId !== userId) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

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

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.transaction.deleteMany({ where: { id, userId } });
    if (count === 0) throw new NotFoundException('Transaction not found');
  }

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

  private sumFor(
    rows: Array<{ type: TransactionType; _sum: { amount: Prisma.Decimal | null } }>,
    type: TransactionType,
  ): number {
    const row = rows.find((r) => r.type === type);
    return Number(row?._sum.amount ?? 0);
  }

  private async ensureCategoryOwned(userId: string, categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }
  }
}
