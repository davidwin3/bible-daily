import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { MissionsService } from './missions.service';
import { GetMissionsDto } from './dto/get-missions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Public()
  @Get('today')
  async getTodayMission() {
    return await this.missionsService.getTodayMission();
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
}
