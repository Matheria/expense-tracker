import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

/**
 * Модуль транзакций.
 *
 * Регистрирует `TransactionController` и `TransactionService`.
 * Импортирует `AuthModule` для доступа к `JwtAuthGuard`.
 */
@Module({
  imports: [AuthModule],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
