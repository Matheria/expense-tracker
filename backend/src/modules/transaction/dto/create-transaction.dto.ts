import { TransactionType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** DTO для создания новой транзакции. */
export class CreateTransactionDto {
  /**
   * Сумма транзакции.
   * Должна быть положительным числом с не более чем двумя знаками после запятой.
   */
  @ApiProperty({
    description: 'Сумма транзакции (максимум 2 знака после запятой)',
    example: 1500.5,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  /** Тип транзакции: `INCOME` (доход) или `EXPENSE` (расход). */
  @ApiProperty({ enum: TransactionType, description: 'Тип транзакции', example: TransactionType.EXPENSE })
  @IsEnum(TransactionType)
  type!: TransactionType;

  /**
   * Необязательное текстовое описание транзакции.
   * Максимальная длина — 255 символов; если передано, не может быть пустой строкой.
   */
  @ApiPropertyOptional({
    description: 'Описание транзакции (макс. 255 символов)',
    example: 'Обед в кафе',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description?: string;

  /** Дата транзакции в формате ISO 8601 (например, `2024-01-15`). */
  @ApiProperty({ description: 'Дата транзакции в формате ISO 8601', example: '2024-01-15' })
  @IsDateString()
  date!: string;

  /** UUID категории, к которой относится транзакция. Должна принадлежать пользователю. */
  @ApiProperty({
    description: 'UUID категории (должна принадлежать текущему пользователю)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  categoryId!: string;
}
