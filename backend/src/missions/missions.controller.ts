import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { MissionsService } from './missions.service';
import { GetMissionsDto } from './dto/get-missions.dto';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { Public } from '../auth/public.decorator';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Public()
  @Get('today')
  async getTodayMission(@Query('date') date?: string) {
    return await this.missionsService.getTodayMission(date);
  }

  @Public()
  @Get()
  async findAll(@Query(ValidationPipe) getMissionsDto: GetMissionsDto) {
    return await this.missionsService.findAll(getMissionsDto);
  }

  @Public()
  @Get('by-date/:date')
  async getMissionByDate(@Param('date') date: string) {
    return await this.missionsService.getMissionByDate(date);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.missionsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/toggle-completion')
  async toggleCompletion(@Param('id') id: string, @Request() req) {
    return await this.missionsService.toggleCompletion(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/completion-status')
  async getCompletionStatus(@Param('id') id: string, @Request() req) {
    return await this.missionsService.getCompletionStatus(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/progress')
  async getUserProgress(@Request() req, @Query('month') month?: string) {
    return await this.missionsService.getUserProgress(req.user.id, month);
  }

  // Admin only endpoints
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin')
  async createMission(
    @Body(ValidationPipe) createMissionDto: CreateMissionDto,
  ) {
    return await this.missionsService.createMission(createMissionDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('admin/:id')
  async updateMission(
    @Param('id') id: string,
    @Body(ValidationPipe) updateMissionDto: UpdateMissionDto,
  ) {
    return await this.missionsService.updateMission(id, updateMissionDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('admin/:id')
  async deleteMission(@Param('id') id: string) {
    await this.missionsService.deleteMission(id);
    return { message: 'Mission deleted successfully' };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('admin/:id/soft-delete')
  async softDeleteMission(@Param('id') id: string) {
    return await this.missionsService.softDeleteMission(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/all')
  async getAllMissionsForAdmin(
    @Query(ValidationPipe) getMissionsDto: GetMissionsDto,
  ) {
    return await this.missionsService.getAllMissionsForAdmin(getMissionsDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/statistics')
  async getMissionStatistics() {
    return await this.missionsService.getMissionStatistics();
  }
}
