import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

/** DTO для параметров запроса финансовой сводки. */
export class SummaryQueryDto {
  /** Номер месяца (1 = январь, 12 = декабрь). */
  @ApiProperty({ description: 'Номер месяца (1–12)', example: 6, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  /** Календарный год (не ранее 2000). */
  @ApiProperty({ description: 'Календарный год (≥ 2000)', example: 2024, minimum: 2000 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year!: number;
}
