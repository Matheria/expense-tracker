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
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.category.deleteMany({ where: { id, userId } });
    if (count === 0) throw new NotFoundException('Category not found');
  }
}
