/** Команда создания нового пользователя. Передаётся через CommandBus в CreateUserHandler. */
export class CreateUserCommand {
  /**
   * @param email - уникальный e-mail пользователя
   * @param passwordHash - bcrypt-хэш пароля (хэшируется в AuthService до отправки команды)
   * @param name - отображаемое имя (необязательно)
   */
  constructor(
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly name?: string,
  ) {}
}
