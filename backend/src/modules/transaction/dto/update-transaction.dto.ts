import { TransactionType } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
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

/** DTO для частичного обновления транзакции. Все поля опциональны. */
export class UpdateTransactionDto {
  /**
   * Новая сумма транзакции.
   * Положительное число с не более чем двумя знаками после запятой.
   */
  @ApiPropertyOptional({
    description: 'Новая сумма транзакции (максимум 2 знака после запятой)',
    example: 2000,
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  /** Новый тип транзакции: `INCOME` или `EXPENSE`. */
  @ApiPropertyOptional({ enum: TransactionType, description: 'Новый тип транзакции' })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  /**
   * Новое описание транзакции.
   * Максимум 255 символов; если передано, не может быть пустой строкой.
   */
  @ApiPropertyOptional({
    description: 'Новое описание (макс. 255 символов)',
    example: 'Ужин с коллегами',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description?: string;

  /** Новая дата транзакции в формате ISO 8601. */
  @ApiPropertyOptional({ description: 'Новая дата транзакции в формате ISO 8601', example: '2024-02-20' })
  @IsOptional()
  @IsDateString()
  date?: string;

  /** UUID новой категории. Должна принадлежать тому же пользователю. */
  @ApiPropertyOptional({
    description: 'UUID новой категории (должна принадлежать текущему пользователю)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
