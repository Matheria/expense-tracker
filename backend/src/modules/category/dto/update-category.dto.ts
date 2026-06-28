import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/** DTO для частичного обновления категории. Все поля опциональны. */
export class UpdateCategoryDto {
  /**
   * Новое название категории.
   * Если передано, не может быть пустой строкой; максимум 50 символов.
   */
  @ApiPropertyOptional({ description: 'Новое название категории (макс. 50 символов)', example: 'Транспорт', maxLength: 50 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  /**
   * Новый цвет категории в формате HEX (`#RRGGBB`).
   * Пример: `#3498DB`.
   */
  @ApiPropertyOptional({ description: 'Новый цвет в формате HEX (#RRGGBB)', example: '#3498DB', pattern: '^#([0-9a-fA-F]{6})$' })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/, { message: 'color must be a hex like #RRGGBB' })
  color?: string;

  /**
   * Новая иконка категории.
   * Если передано, не может быть пустой строкой; максимум 50 символов.
   */
  @ApiPropertyOptional({ description: 'Новая иконка категории (макс. 50 символов)', example: 'car', maxLength: 50 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ description: 'Тип категории', enum: TransactionType, example: TransactionType.EXPENSE })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}
