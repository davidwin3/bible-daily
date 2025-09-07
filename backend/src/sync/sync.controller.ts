import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncDataDto } from './dto/sync-data.dto';
import { Public } from '../auth/public.decorator';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /**
   * 오프라인에서 저장된 데이터들을 서버와 동기화
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.OK)
  async syncData(@Body() syncDataDto: SyncDataDto, @Request() req) {
    return await this.syncService.syncOfflineData(syncDataDto, req.user.id);
  }

  /**
   * 백그라운드 동기화 (Service Worker용)
   * 현재는 단순히 연결 확인만 수행
   */
  @Public()
  @Post('background')
  @HttpCode(HttpStatus.OK)
  async backgroundSync() {
    return {
      success: true,
      message: 'Background sync completed',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 사용자별 동기화 상태 확인
   */
  @UseGuards(JwtAuthGuard)
  @Post('status')
  async getSyncStatus(@Request() req) {
    return await this.syncService.getSyncStatus(req.user.id);
  }
}
