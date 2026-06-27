import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

/** DTO для создания новой категории. */
export class CreateCategoryDto {
  /**
   * Название категории.
   * Не может быть пустой строкой; максимальная длина — 50 символов.
   */
  @ApiProperty({ description: 'Название категории (макс. 50 символов)', example: 'Продукты', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  /**
   * Цвет категории в формате HEX (`#RRGGBB`).
   * Пример: `#FF5733`.
   */
  @ApiProperty({ description: 'Цвет в формате HEX (#RRGGBB)', example: '#FF5733', pattern: '^#([0-9a-fA-F]{6})$' })
  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/, { message: 'color must be a hex like #RRGGBB' })
  color!: string;

  /**
   * Иконка категории (например, имя иконки из используемой библиотеки).
   * Не может быть пустой строкой; максимальная длина — 50 символов.
   */
  @ApiProperty({ description: 'Иконка категории (макс. 50 символов)', example: 'shopping-cart', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  icon!: string;
}
