import { ApiProperty } from '@nestjs/swagger';
import { TransactionEntity } from './transaction.entity';

/** Swagger-представление постраничного ответа со списком транзакций. */
export class PaginatedTransactionsEntity {
  @ApiProperty({ type: [TransactionEntity], description: 'Транзакции текущей страницы' })
  data!: TransactionEntity[];

  @ApiProperty({ description: 'Общее количество транзакций, удовлетворяющих фильтру', example: 42 })
  total!: number;

  @ApiProperty({ description: 'Текущая страница (начиная с 1)', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Максимальное число записей на странице', example: 10 })
  limit!: number;

  @ApiProperty({ description: 'Общее число страниц (не менее 1)', example: 5 })
  totalPages!: number;
}
