import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FcmToken } from '../entities/fcm-token.entity';
import { User } from '../entities/user.entity';
import { FirebaseService } from '../auth/firebase.service';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  icon?: string;
  badge?: string;
  clickAction?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepository: Repository<FcmToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * FCM 토큰 저장 또는 업데이트
   */
  async saveFcmToken(
    userId: string,
    token: string,
    userAgent?: string,
  ): Promise<FcmToken> {
    // 기존 토큰 확인
    const existingToken = await this.fcmTokenRepository.findOne({
      where: { userId, token },
    });

    if (existingToken) {
      // 기존 토큰 업데이트
      existingToken.lastUsedAt = new Date();
      existingToken.isActive = true;
      if (userAgent) {
        existingToken.userAgent = userAgent;
      }
      return await this.fcmTokenRepository.save(existingToken);
    }

    // 새 토큰 생성
    const newToken = this.fcmTokenRepository.create({
      userId,
      token,
      platform: 'web',
      userAgent,
      lastUsedAt: new Date(),
    });

    return await this.fcmTokenRepository.save(newToken);
  }

  /**
   * 특정 사용자에게 알림 전송
   */
  async sendNotificationToUser(
    userId: string,
    payload: NotificationPayload,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 사용자의 활성 FCM 토큰 가져오기
      const tokens = await this.fcmTokenRepository.find({
        where: { userId, isActive: true },
      });

      if (tokens.length === 0) {
        return { success: false, error: 'No active FCM tokens found' };
      }

      // 모든 토큰에 알림 전송
      const tokenStrings = tokens.map((t) => t.token);
      const result = await this.firebaseService.sendPushNotificationToMultiple(
        tokenStrings,
        payload.title,
        payload.body,
        payload.data,
      );

      // 실패한 토큰들을 비활성화 (옵션)
      if (result.failureCount > 0) {
        console.log(`${result.failureCount} tokens failed for user ${userId}`);
      }

      return { success: result.successCount > 0 };
    } catch (error) {
      console.error('Failed to send notification to user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 여러 사용자에게 알림 전송
   */
  async sendNotificationToUsers(
    userIds: string[],
    payload: NotificationPayload,
  ): Promise<{ successCount: number; failureCount: number }> {
    let successCount = 0;
    let failureCount = 0;

    // 병렬로 처리하지만 너무 많은 요청을 동시에 보내지 않도록 배치 처리
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const promises = batch.map((userId) =>
        this.sendNotificationToUser(userId, payload),
      );

      const results = await Promise.all(promises);
      results.forEach((result) => {
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      });
    }

    return { successCount, failureCount };
  }

  /**
   * 모든 활성 사용자에게 알림 전송
   */
  async sendNotificationToAllUsers(
    payload: NotificationPayload,
  ): Promise<{ successCount: number; failureCount: number }> {
    // 모든 활성 사용자 ID 가져오기
    const users = await this.userRepository.find({
      where: { isActive: true },
      select: ['id'],
    });

    const userIds = users.map((user) => user.id);
    return await this.sendNotificationToUsers(userIds, payload);
  }

  /**
   * 특정 역할의 사용자들에게 알림 전송
   */
  async sendNotificationToRole(
    role: string,
    payload: NotificationPayload,
  ): Promise<{ successCount: number; failureCount: number }> {
    const users = await this.userRepository.find({
      where: { isActive: true, role: role as any },
      select: ['id'],
    });

    const userIds = users.map((user) => user.id);
    return await this.sendNotificationToUsers(userIds, payload);
  }

  /**
   * 비활성 FCM 토큰 정리
   */
  async cleanupInactiveTokens(): Promise<number> {
    // 30일 이상 사용되지 않은 토큰 삭제
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.fcmTokenRepository.delete({
      lastUsedAt: { $lt: thirtyDaysAgo } as any,
    });

    return result.affected || 0;
  }

  /**
   * 사용자의 FCM 토큰 비활성화
   */
  async deactivateUserTokens(userId: string): Promise<void> {
    await this.fcmTokenRepository.update(
      { userId, isActive: true },
      { isActive: false },
    );
  }

  /**
   * 특정 토큰 제거
   */
  async removeFcmToken(userId: string, token: string): Promise<boolean> {
    const result = await this.fcmTokenRepository.delete({ userId, token });
    return (result.affected || 0) > 0;
  }
}
