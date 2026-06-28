import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateUserHandler } from './commands/create-user.handler';
import { GetUserByEmailHandler } from './queries/get-user-by-email.handler';
import { GetUserByIdHandler } from './queries/get-user-by-id.handler';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const CommandHandlers = [CreateUserHandler];
const QueryHandlers = [GetUserByEmailHandler, GetUserByIdHandler];

@Module({
  imports: [CqrsModule],
  controllers: [UsersController],
  providers: [UsersService, ...CommandHandlers, ...QueryHandlers],
})
export class UsersModule {}
