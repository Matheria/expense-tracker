import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({ data: { ...dto, userId } });
  }

  findAll(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({ where: { userId } });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.ensureOwned(userId, id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.ensureOwned(userId, id);
    await this.prisma.category.delete({ where: { id } });
  }

  private async ensureOwned(userId: string, id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }
  }
}
