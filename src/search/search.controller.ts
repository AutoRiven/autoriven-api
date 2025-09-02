import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  searchUsers(
    @Query('q') query = '',
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('city') city?: string,
    @Query('country') country?: string,
  ) {
    const filters: any = {};
    
    if (role) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (city) filters.city = city;
    if (country) filters.country = country;

    return this.searchService.searchUsers(query, filters);
  }
}
