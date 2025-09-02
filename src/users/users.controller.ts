import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('administrators')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  findAdministrators() {
    return this.usersService.findAdministrators();
  }

  @Get('customers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  findCustomers() {
    return this.usersService.findCustomers();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('administrators')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  createAdministrator(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createAdministrator(createUserDto);
  }
}
