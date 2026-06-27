import { TransactionType } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

/** DTO для параметров запроса списка транзакций (фильтрация + пагинация). */
export class QueryTransactionsDto {
  /** Начало диапазона дат (включительно) в формате ISO 8601. */
  @ApiPropertyOptional({ description: 'Начало диапазона дат (включительно)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  /** Конец диапазона дат (включительно) в формате ISO 8601. */
  @ApiPropertyOptional({ description: 'Конец диапазона дат (включительно)', example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  /** Фильтр по типу транзакции: `INCOME` или `EXPENSE`. */
  @ApiPropertyOptional({ enum: TransactionType, description: 'Фильтр по типу транзакции' })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  /** UUID категории для фильтрации. */
  @ApiPropertyOptional({
    description: 'UUID категории для фильтрации',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  /** Номер страницы (начиная с 1). По умолчанию — 1. */
  @ApiPropertyOptional({ description: 'Номер страницы (≥ 1)', example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  /** Количество записей на странице (1–100). По умолчанию — 10. */
  @ApiPropertyOptional({ description: 'Записей на странице (1–100)', example: 10, minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
