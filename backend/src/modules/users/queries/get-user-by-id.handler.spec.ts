import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { UsersService } from '../users.service';
import { GetUserByIdHandler } from './get-user-by-id.handler';
import { GetUserByIdQuery } from './get-user-by-id.query';

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: 'hash',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('GetUserByIdHandler', () => {
  let handler: GetUserByIdHandler;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserByIdHandler,
        {
          provide: UsersService,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    handler = module.get<GetUserByIdHandler>(GetUserByIdHandler);
    usersService = module.get(UsersService);
  });

  it('должен быть определён', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('возвращает пользователя если он найден', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await handler.execute(new GetUserByIdQuery('user-1'));

      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });

    it('возвращает null если пользователь не найден', async () => {
      usersService.findById.mockResolvedValue(null);

      const result = await handler.execute(new GetUserByIdQuery('not-exist'));

      expect(usersService.findById).toHaveBeenCalledWith('not-exist');
      expect(result).toBeNull();
    });
  });
});
