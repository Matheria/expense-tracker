import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserCommand } from '../users/commands/create-user.command';
import { GetUserByEmailQuery } from '../users/queries/get-user-by-email.query';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
    const existing = await this.queryBus.execute<GetUserByEmailQuery, User | null>(
      new GetUserByEmailQuery(dto.email),
    );
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.commandBus.execute<CreateUserCommand, User>(
      new CreateUserCommand(dto.email, passwordHash, dto.name),
    );

    return { accessToken: this.generateToken(user) };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.queryBus.execute<GetUserByEmailQuery, User | null>(
      new GetUserByEmailQuery(dto.email),
    );
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { accessToken: this.generateToken(user) };
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}
