import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UserRole } from '../entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Admin only endpoints
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/all')
  async getAllUsersForAdmin() {
    return await this.usersService.getAllUsersForAdmin();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/statistics')
  async getUserStatistics() {
    return await this.usersService.getUserStatistics();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/:id/detail')
  async getUserDetailForAdmin(@Param('id') id: string) {
    return await this.usersService.getUserDetailForAdmin(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('admin/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body(ValidationPipe) body: { role: UserRole },
  ) {
    return await this.usersService.updateUserRole(id, body.role);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('admin/:id/deactivate')
  async deactivateUser(@Param('id') id: string) {
    return await this.usersService.deactivateUser(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('admin/:id/reactivate')
  async reactivateUser(@Param('id') id: string) {
    return await this.usersService.reactivateUser(id);
  }
}
