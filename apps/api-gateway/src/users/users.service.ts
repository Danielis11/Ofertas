import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(data: { email: string; name: string; passwordHash: string; role?: UserRole }): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException(`Email '${data.email}' is already registered`);
    }

    const user = this.userRepo.create({
      email: data.email.toLowerCase(),
      name: data.name,
      password: data.passwordHash,
      role: data.role || UserRole.USER,
    });

    return this.userRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email: email.toLowerCase() } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }
    return user;
  }

  async updateRefreshToken(id: string, refreshTokenHash: string | null): Promise<void> {
    await this.userRepo.update(id, { refreshTokenHash });
  }
}
