import { TransactionType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Swagger-представление записи транзакции (зеркалит Prisma-модель Transaction). */
export class TransactionEntity {
  @ApiProperty({ description: 'UUID транзакции', example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  /** Prisma Decimal сериализуется в строку при JSON-ответе. */
  @ApiProperty({ description: 'Сумма транзакции', example: '1500.00', type: String })
  amount!: string;

  @ApiProperty({ enum: TransactionType, description: 'Тип транзакции' })
  type!: TransactionType;

  @ApiPropertyOptional({ description: 'Описание транзакции', example: 'Обед в кафе', nullable: true })
  description!: string | null;

  @ApiProperty({ description: 'Дата транзакции', example: '2024-01-15T00:00:00.000Z' })
  date!: Date;

  @ApiProperty({ description: 'UUID категории', example: '550e8400-e29b-41d4-a716-446655440001' })
  categoryId!: string;

  @ApiProperty({ description: 'UUID владельца транзакции', example: '550e8400-e29b-41d4-a716-446655440002' })
  userId!: string;

  @ApiProperty({ description: 'Дата создания записи', example: '2024-01-15T10:30:00.000Z' })
  createdAt!: Date;
}
