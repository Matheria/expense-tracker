import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

/**
 * Модуль категорий.
 *
 * Регистрирует `CategoryController` и `CategoryService`.
 * Импортирует `AuthModule` для доступа к `JwtAuthGuard`.
 */
@Module({
  imports: [AuthModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
