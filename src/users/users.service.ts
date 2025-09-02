import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'phone', 'address', 'city', 'country', 'postalCode', 'isActive', 'emailVerified', 'lastLoginAt', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'phone', 'address', 'city', 'country', 'postalCode', 'isActive', 'emailVerified', 'lastLoginAt', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  async createAdministrator(createUserDto: CreateUserDto): Promise<User> {
    const userData = {
      ...createUserDto,
      role: UserRole.ADMINISTRATOR,
    };
    return this.create(userData);
  }

  async findAdministrators(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.ADMINISTRATOR },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'phone', 'address', 'city', 'country', 'postalCode', 'isActive', 'emailVerified', 'lastLoginAt', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async findCustomers(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.CUSTOMER },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'phone', 'address', 'city', 'country', 'postalCode', 'isActive', 'emailVerified', 'lastLoginAt', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }
}
