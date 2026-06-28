import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

/** DTO для создания новой категории. */
export class CreateCategoryDto {
  @ApiProperty({ description: 'Название категории (макс. 50 символов)', example: 'Продукты', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @ApiProperty({ description: 'Цвет в формате HEX (#RRGGBB)', example: '#FF5733', pattern: '^#([0-9a-fA-F]{6})$' })
  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/, { message: 'color must be a hex like #RRGGBB' })
  color!: string;

  @ApiProperty({ description: 'Иконка категории (макс. 50 символов)', example: 'shopping-cart', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  icon!: string;

  @ApiProperty({ description: 'Тип категории', enum: TransactionType, example: TransactionType.EXPENSE })
  @IsEnum(TransactionType)
  type!: TransactionType;
}
