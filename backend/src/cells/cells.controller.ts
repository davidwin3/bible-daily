import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Put,
  ValidationPipe,
} from '@nestjs/common';
import { CellsService } from './cells.service';
import { CreateCellDto } from './dto/create-cell.dto';
import { UpdateCellDto } from './dto/update-cell.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { TeacherGuard } from '../auth/teacher.guard';
import { Public } from '../auth/public.decorator';

@Controller('cells')
export class CellsController {
  constructor(private readonly cellsService: CellsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createCellDto: CreateCellDto, @Request() req) {
    return await this.cellsService.create(createCellDto, req.user.id);
  }

  @Public()
  @Get()
  async findAll() {
    return await this.cellsService.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.cellsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCellDto: UpdateCellDto,
    @Request() req,
  ) {
    return await this.cellsService.update(id, updateCellDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.cellsService.remove(id, req.user.id);
    return { message: 'Cell deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
    @Request() req,
  ) {
    return await this.cellsService.addMember(id, addMemberDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':cellId/members/:memberId')
  async removeMember(
    @Param('cellId') cellId: string,
    @Param('memberId') memberId: string,
    @Request() req,
  ) {
    await this.cellsService.removeMember(cellId, memberId, req.user.id);
    return { message: 'Member removed from cell successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/my-cell')
  async getUserCell(@Request() req) {
    return await this.cellsService.getUserCell(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/is-leader')
  async isLeader(@Param('id') id: string, @Request() req) {
    const isLeader = await this.cellsService.isLeader(id, req.user.id);
    return { isLeader };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/is-member')
  async isMember(@Param('id') id: string, @Request() req) {
    const isMember = await this.cellsService.isMember(id, req.user.id);
    return { isMember };
  }

  // Admin only endpoints
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin')
  async createCell(@Body(ValidationPipe) createCellDto: CreateCellDto) {
    return await this.cellsService.createCell(createCellDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('admin/:id')
  async updateCell(
    @Param('id') id: string,
    @Body(ValidationPipe) updateCellDto: UpdateCellDto,
  ) {
    return await this.cellsService.updateCell(id, updateCellDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('admin/:id')
  async deleteCell(@Param('id') id: string) {
    await this.cellsService.deleteCell(id);
    return { message: 'Cell deleted successfully' };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/all')
  async getAllCellsForAdmin() {
    return await this.cellsService.getAllCellsForAdmin();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/statistics')
  async getCellStatistics() {
    return await this.cellsService.getCellStatistics();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/:id/detail')
  async getCellDetailForAdmin(@Param('id') id: string) {
    return await this.cellsService.getCellDetailForAdmin(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/:id/members')
  async addMemberToCell(
    @Param('id') id: string,
    @Body(ValidationPipe) addMemberDto: AddMemberDto,
  ) {
    return await this.cellsService.addMemberToCell(id, addMemberDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('admin/:cellId/members/:userId')
  async removeMemberFromCell(
    @Param('cellId') cellId: string,
    @Param('userId') userId: string,
  ) {
    await this.cellsService.removeMemberFromCell(cellId, userId);
    return { message: 'Member removed from cell successfully' };
  }
}
