import { TransactionType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

/** Swagger-представление одной строки разбивки по категориям. */
class ByCategoryItemEntity {
  @ApiProperty({ description: 'UUID категории', example: '550e8400-e29b-41d4-a716-446655440001' })
  categoryId!: string;

  @ApiProperty({ enum: TransactionType, description: 'Тип транзакции' })
  type!: TransactionType;

  @ApiProperty({ description: 'Суммарное значение по категории', example: 3500 })
  total!: number;
}

/** Swagger-представление финансовой сводки за календарный месяц. */
export class TransactionSummaryEntity {
  @ApiProperty({ description: 'Номер месяца (1–12)', example: 6 })
  month!: number;

  @ApiProperty({ description: 'Календарный год', example: 2024 })
  year!: number;

  @ApiProperty({ description: 'Суммарный доход за период', example: 50000 })
  income!: number;

  @ApiProperty({ description: 'Суммарный расход за период', example: 35000 })
  expense!: number;

  @ApiProperty({ description: 'Баланс: income − expense', example: 15000 })
  balance!: number;

  @ApiProperty({ type: [ByCategoryItemEntity], description: 'Разбивка сумм по категориям и типу' })
  byCategory!: ByCategoryItemEntity[];
}
