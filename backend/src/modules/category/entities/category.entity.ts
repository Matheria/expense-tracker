import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Swagger-представление записи категории (зеркалит Prisma-модель Category). */
export class CategoryEntity {
  @ApiProperty({ description: 'UUID категории', example: '550e8400-e29b-41d4-a716-446655440001' })
  id!: string;

  @ApiProperty({ description: 'Название категории', example: 'Продукты', maxLength: 50 })
  name!: string;

  @ApiProperty({ description: 'Цвет в формате HEX (#RRGGBB)', example: '#FF5733' })
  color!: string;

  @ApiProperty({ description: 'Иконка категории', example: 'shopping-cart', maxLength: 50 })
  icon!: string;

  @ApiProperty({ description: 'UUID владельца категории', example: '550e8400-e29b-41d4-a716-446655440000' })
  userId!: string;

  @ApiPropertyOptional({ description: 'Дата создания записи', example: '2024-01-15T10:30:00.000Z' })
  createdAt?: Date;
}
