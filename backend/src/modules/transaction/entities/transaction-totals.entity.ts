import { ApiProperty } from '@nestjs/swagger';

/** Swagger-представление общей финансовой сводки за всё время. */
export class TransactionTotalsEntity {
  @ApiProperty({ description: 'Суммарный доход за всё время', example: 150000 })
  income!: number;

  @ApiProperty({ description: 'Суммарный расход за всё время', example: 120000 })
  expense!: number;

  @ApiProperty({ description: 'Баланс: income − expense', example: 30000 })
  balance!: number;

  @ApiProperty({ description: 'Общее количество транзакций', example: 342 })
  count!: number;
}
