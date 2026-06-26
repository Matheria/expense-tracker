import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { User } from '@prisma/client';
import { UsersService } from '../users.service';
import { GetUserByIdQuery } from './get-user-by-id.query';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery, User | null> {
  constructor(private readonly usersService: UsersService) {}

  execute(query: GetUserByIdQuery): Promise<User | null> {
    return this.usersService.findById(query.id);
  }
}
