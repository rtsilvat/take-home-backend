import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repo: Repository<User>;
  let redisClient: { get: jest.Mock; set: jest.Mock; del: jest.Mock; quit: jest.Mock };

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    } as unknown as Repository<User>;

    redisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      quit: jest.fn(),
    };
    const mockRedisService: Partial<RedisService> = {
      getClient: () => redisClient as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create user when email not exists and invalidate caches', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      const created = { id: 1, email: 'a@a.com' } as User;
      (repo.create as jest.Mock).mockReturnValue(created);
      (repo.save as jest.Mock).mockResolvedValue(created);

      const result = await service.create({
        email: 'a@a.com',
        password: '123456',
        name: 'A',
        flag_active: true,
        expiration_at: '2030-12-31T00:00:00.000Z',
      });

      expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'a@a.com' } });
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(redisClient.del).toHaveBeenCalledWith('users:all');
      expect(redisClient.del).toHaveBeenCalledWith('users:id:1');
      expect(result).toBe(created);
    });

    it('should throw conflict if email exists', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({ id: 1 } as User);
      await expect(
        service.create({ email: 'a@a.com', password: '123456', name: 'A', flag_active: true }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should wrap unknown errors as InternalServerError', async () => {
      (repo.findOne as jest.Mock).mockRejectedValue(new Error('db down'));
      await expect(
        service.create({ email: 'a@a.com', password: '123456', name: 'A', flag_active: true }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('should return from cache when available', async () => {
      const users = [{ id: 1 } as User];
      redisClient.get.mockResolvedValue(JSON.stringify(users));
      const result = await service.findAll();
      expect(result).toEqual(users);
      expect(repo.find).not.toHaveBeenCalled();
    });

    it('should query db and set cache when no cache', async () => {
      redisClient.get.mockResolvedValue(null);
      const users = [{ id: 1 } as User];
      (repo.find as jest.Mock).mockResolvedValue(users);
      const result = await service.findAll();
      expect(result).toEqual(users);
      expect(redisClient.set).toHaveBeenCalledWith('users:all', JSON.stringify(users), 'EX', 600);
    });
  });

  describe('findOne', () => {
    it('should return from cache when available', async () => {
      const user = { id: 1 } as User;
      redisClient.get.mockResolvedValue(JSON.stringify(user));
      const result = await service.findOne(1);
      expect(result).toEqual(user);
      expect(repo.findOne).not.toHaveBeenCalled();
    });

    it('should query db, set cache and return', async () => {
      redisClient.get.mockResolvedValue(null);
      const user = { id: 2 } as User;
      (repo.findOne as jest.Mock).mockResolvedValue(user);
      const result = await service.findOne(2);
      expect(result).toEqual(user);
      expect(redisClient.set).toHaveBeenCalledWith('users:id:2', JSON.stringify(user), 'EX', 600);
    });

    it('should throw not found when db returns null', async () => {
      redisClient.get.mockResolvedValue(null);
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne(3)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update existing user, save and invalidate caches', async () => {
      const user = { id: 10, email: 'x@x.com', password: 'p', name: 'n', flag_active: true, expiration_at: null } as unknown as User;
      (repo.findOne as jest.Mock).mockResolvedValue(user);
      (repo.save as jest.Mock).mockResolvedValue(user);
      const result = await service.update(10, { name: 'updated' });
      expect(repo.save).toHaveBeenCalled();
      expect(redisClient.del).toHaveBeenCalledWith('users:all');
      expect(redisClient.del).toHaveBeenCalledWith('users:id:10');
      expect(result).toEqual(user);
    });

    it('should throw not found if user does not exist', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.update(99, { name: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should wrap save errors as InternalServerError', async () => {
      const user = { id: 11 } as User;
      (repo.findOne as jest.Mock).mockResolvedValue(user);
      (repo.save as jest.Mock).mockRejectedValue(new Error('save failed'));
      await expect(service.update(11, { name: 'x' })).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('should remove existing user and invalidate caches', async () => {
      const user = { id: 5 } as User;
      (repo.findOne as jest.Mock).mockResolvedValue(user);
      (repo.remove as jest.Mock).mockResolvedValue(undefined);
      await service.remove(5);
      expect(repo.remove).toHaveBeenCalledWith(user);
      expect(redisClient.del).toHaveBeenCalledWith('users:all');
      expect(redisClient.del).toHaveBeenCalledWith('users:id:5');
    });

    it('should throw not found if user does not exist', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.remove(7)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should wrap remove errors as InternalServerError', async () => {
      const user = { id: 8 } as User;
      (repo.findOne as jest.Mock).mockResolvedValue(user);
      (repo.remove as jest.Mock).mockRejectedValue(new Error('remove failed'));
      await expect(service.remove(8)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
