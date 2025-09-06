import {
  Controller,
  Post,
  Delete,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { NotificationsService } from './notifications.service';
import type { NotificationPayload } from './notifications.service';
import { UserRole } from '../entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * FCM 토큰 구독
   */
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(
    @Body() body: { fcmToken: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const { fcmToken } = body;
    const userId = req.user.id;
    const userAgent = req.headers['user-agent'];

    const token = await this.notificationsService.saveFcmToken(
      userId,
      fcmToken,
      userAgent,
    );

    return {
      success: true,
      message: 'FCM token saved successfully',
      tokenId: token.id,
    };
  }

  /**
   * FCM 토큰 구독 해제
   */
  @Delete('unsubscribe')
  @HttpCode(HttpStatus.OK)
  async unsubscribe(
    @Body() body: { fcmToken: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const { fcmToken } = body;
    const userId = req.user.id;

    const removed = await this.notificationsService.removeFcmToken(
      userId,
      fcmToken,
    );

    return {
      success: removed,
      message: removed
        ? 'FCM token removed successfully'
        : 'FCM token not found',
    };
  }

  /**
   * 테스트 알림 전송 (자신에게)
   */
  @Post('test')
  @HttpCode(HttpStatus.OK)
  async sendTestNotification(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;

    const result = await this.notificationsService.sendNotificationToUser(
      userId,
      {
        title: 'Bible Daily 테스트 알림',
        body: '푸시 알림이 정상적으로 작동합니다! 📖',
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
        },
      },
    );

    return {
      success: result.success,
      message: result.success
        ? 'Test notification sent successfully'
        : 'Failed to send test notification',
      error: result.error,
    };
  }

  /**
   * 관리자 전용: 모든 사용자에게 공지 알림 전송
   */
  @Post('broadcast')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async broadcastNotification(@Body() payload: NotificationPayload) {
    const result =
      await this.notificationsService.sendNotificationToAllUsers(payload);

    return {
      success: true,
      message: 'Broadcast notification sent',
      successCount: result.successCount,
      failureCount: result.failureCount,
    };
  }

  /**
   * 관리자 전용: 특정 역할 사용자들에게 알림 전송
   */
  @Post('send-to-role')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async sendToRole(
    @Body() body: { role: UserRole; payload: NotificationPayload },
  ) {
    const { role, payload } = body;

    const result = await this.notificationsService.sendNotificationToRole(
      role,
      payload,
    );

    return {
      success: true,
      message: `Notification sent to ${role} users`,
      successCount: result.successCount,
      failureCount: result.failureCount,
    };
  }

  /**
   * 관리자 전용: 비활성 토큰 정리
   */
  @Delete('cleanup')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async cleanupTokens() {
    const deletedCount =
      await this.notificationsService.cleanupInactiveTokens();

    return {
      success: true,
      message: 'Token cleanup completed',
      deletedCount,
    };
  }
}
