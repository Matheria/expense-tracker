import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создаёт новую категорию для указанного пользователя.
   *
   * @param userId - UUID аутентифицированного пользователя.
   * @param dto - Данные создаваемой категории.
   * @returns Созданная запись `Category`.
   */
  create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({ data: { ...dto, userId } });
  }

  /**
   * Возвращает все категории пользователя.
   *
   * @param userId - UUID аутентифицированного пользователя.
   * @returns Массив категорий, принадлежащих пользователю.
   */
  findAll(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({ where: { userId } });
  }

  /**
   * Обновляет поля существующей категории (частичное обновление).
   *
   * Использует `try/catch` вокруг Prisma-обновления на случай гонки (запись удалена
   * между проверкой существования и самим обновлением).
   *
   * @param userId - UUID аутентифицированного пользователя.
   * @param id - UUID категории.
   * @param dto - Поля для обновления (все опциональны).
   * @returns Обновлённая категория.
   * @throws {NotFoundException} Если категория не найдена или принадлежит другому пользователю.
   */
  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<Category> {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Category not found');
    }
    try {
      return await this.prisma.category.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Category not found');
      }
      throw e;
    }
  }

  /**
   * Удаляет категорию пользователя.
   *
   * Использует `deleteMany` с составным фильтром `{ id, userId }`, чтобы атомарно
   * совместить проверку владения с удалением (исключает гонки).
   * Перехватывает Prisma-ошибку `P2003` (нарушение foreign key constraint), если к категории
   * привязаны транзакции, и преобразует её в `ConflictException`.
   *
   * @param userId - UUID аутентифицированного пользователя.
   * @param id - UUID категории.
   * @returns `void`
   * @throws {NotFoundException} Если категория не найдена или принадлежит другому пользователю.
   * @throws {ConflictException} Если к категории привязаны транзакции (Prisma P2003).
   */
  async remove(userId: string, id: string): Promise<void> {
    try {
      const { count } = await this.prisma.category.deleteMany({ where: { id, userId } });
      if (count === 0) throw new NotFoundException('Category not found');
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new ConflictException('Нельзя удалить категорию: есть связанные транзакции');
      }
      throw e;
    }
  }
}
