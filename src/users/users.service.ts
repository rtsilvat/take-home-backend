import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  private getAllUsersCacheKey(): string {
    return 'users:all';
  }

  private getUserByIdCacheKey(id: number): string {
    return `users:id:${id}`;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existing = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existing) {
        throw new ConflictException('User with this email already exists');
      }

      const user = this.userRepository.create({
        email: createUserDto.email,
        password: createUserDto.password,
        name: createUserDto.name,
        flag_active: createUserDto.flag_active ?? true,
        expiration_at: createUserDto.expiration_at
          ? new Date(createUserDto.expiration_at)
          : null,
      });
      const saved = await this.userRepository.save(user);

      // invalidate caches
      const redis = this.redisService.getClient();
      await redis.del(this.getAllUsersCacheKey());
      await redis.del(this.getUserByIdCacheKey(saved.id));

      return saved;
    } catch (error: any) {
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findAll(): Promise<User[]> {
    const redis = this.redisService.getClient();
    const cacheKey = this.getAllUsersCacheKey();
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as User[];
    }
    const users = await this.userRepository.find();
    await redis.set(cacheKey, JSON.stringify(users), 'EX', 600);
    return users;
  }

  async findOne(id: number): Promise<User> {
    const redis = this.redisService.getClient();
    const cacheKey = this.getUserByIdCacheKey(id);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as User;
    }
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await redis.set(cacheKey, JSON.stringify(user), 'EX', 600);
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    Object.assign(user, {
      email: updateUserDto.email ?? user.email,
      password: updateUserDto.password ?? user.password,
      name: updateUserDto.name ?? user.name,
      flag_active: updateUserDto.flag_active ?? user.flag_active,
      expiration_at: updateUserDto.expiration_at
        ? new Date(updateUserDto.expiration_at)
        : user.expiration_at,
    });
    try {
      const saved = await this.userRepository.save(user);
      const redis = this.redisService.getClient();
      await redis.del(this.getAllUsersCacheKey());
      await redis.del(this.getUserByIdCacheKey(id));
      return saved;
    } catch (error: any) {
      void error;
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    try {
      await this.userRepository.remove(user);
      const redis = this.redisService.getClient();
      await redis.del(this.getAllUsersCacheKey());
      await redis.del(this.getUserByIdCacheKey(id));
    } catch (error: any) {
      void error;
      throw new InternalServerErrorException('Failed to remove user');
    }
  }
}
