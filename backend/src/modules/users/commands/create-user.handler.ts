import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from '@prisma/client';
import { UsersService } from '../users.service';
import { CreateUserCommand } from './create-user.command';

/** Обработчик CreateUserCommand — делегирует создание пользователя в UsersService. */
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, User> {
  constructor(private readonly usersService: UsersService) {}

  /** Вызывается CommandBus; возвращает созданную запись пользователя из БД. */
  execute(command: CreateUserCommand): Promise<User> {
    return this.usersService.create({
      email: command.email,
      name: command.name,
      passwordHash: command.passwordHash,
    });
  }
}
