import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUserByIdQuery } from './queries/get-user-by-id.query';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('me')
  async me(@CurrentUser('id') userId: string) {
    const user = await this.queryBus.execute<GetUserByIdQuery, User | null>(
      new GetUserByIdQuery(userId),
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { id: user.id, name: user.name, email: user.email };
  }
}
