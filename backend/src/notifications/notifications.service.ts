import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { FcmToken } from '../entities/fcm-token.entity';
import { User, UserRole } from '../entities/user.entity';
import { FirebaseService } from '../auth/firebase.service';
import {
  NotificationTopic,
  NOTIFICATION_TOPICS,
} from '../common/constants/notification-topics';

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

    let savedToken: FcmToken;
    let isNewToken = false;

    if (existingToken) {
      // 기존 토큰 업데이트
      existingToken.lastUsedAt = new Date();
      existingToken.isActive = true;
      if (userAgent) {
        existingToken.userAgent = userAgent;
      }
      savedToken = await this.fcmTokenRepository.save(existingToken);
    } else {
      // 새 토큰 생성
      const newToken = this.fcmTokenRepository.create({
        userId,
        token,
        platform: 'web',
        userAgent,
        lastUsedAt: new Date(),
      });

      savedToken = await this.fcmTokenRepository.save(newToken);
      isNewToken = true;
    }

    // 새 토큰인 경우 공지사항 토픽에 자동 구독
    if (isNewToken) {
      await this.firebaseService.subscribeToTopic(
        [token],
        NOTIFICATION_TOPICS.ANNOUNCEMENTS,
      );
    }

    return savedToken;
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
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
    role: UserRole,
    payload: NotificationPayload,
  ): Promise<{ successCount: number; failureCount: number }> {
    const users = await this.userRepository.find({
      where: { isActive: true, role },
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
      lastUsedAt: LessThan(thirtyDaysAgo),
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
   * 특정 FCM 토큰으로 직접 알림 전송
   */
  async sendNotificationToToken(
    fcmToken: string,
    payload: NotificationPayload,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.firebaseService.sendPushNotification(
        fcmToken,
        payload.title,
        payload.body,
        payload.data,
      );

      return { success: true };
    } catch (error) {
      console.error('Failed to send notification to token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 특정 토큰 제거
   */
  async removeFcmToken(userId: string, token: string): Promise<boolean> {
    const result = await this.fcmTokenRepository.delete({
      userId,
      token,
    });
    return (result.affected || 0) > 0;
  }

  /**
   * 사용자를 토픽에 구독
   */
  async subscribeUserToTopic(
    userId: string,
    topic: NotificationTopic,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 사용자의 활성 FCM 토큰 가져오기
      const tokens = await this.fcmTokenRepository.find({
        where: { userId, isActive: true },
      });

      if (tokens.length === 0) {
        return { success: false, error: 'No active FCM tokens found' };
      }

      const tokenStrings = tokens.map((t) => t.token);
      const result = await this.firebaseService.subscribeToTopic(
        tokenStrings,
        topic,
      );

      return { success: result.successCount > 0 };
    } catch (error) {
      console.error('Failed to subscribe user to topic:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 사용자를 토픽에서 구독 해제
   */
  async unsubscribeUserFromTopic(
    userId: string,
    topic: NotificationTopic,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 사용자의 활성 FCM 토큰 가져오기
      const tokens = await this.fcmTokenRepository.find({
        where: { userId, isActive: true },
      });

      if (tokens.length === 0) {
        return { success: false, error: 'No active FCM tokens found' };
      }

      const tokenStrings = tokens.map((t) => t.token);
      const result = await this.firebaseService.unsubscribeFromTopic(
        tokenStrings,
        topic,
      );

      return { success: result.successCount > 0 };
    } catch (error) {
      console.error('Failed to unsubscribe user from topic:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 모든 활성 사용자를 토픽에 구독
   */
  async subscribeAllActiveUsersToTopic(
    topic: NotificationTopic,
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      // 모든 활성 FCM 토큰 가져오기
      const tokens = await this.fcmTokenRepository
        .createQueryBuilder('token')
        .innerJoin('token.user', 'user')
        .where('token.isActive = :isActive', { isActive: true })
        .andWhere('user.isActive = :userIsActive', { userIsActive: true })
        .select(['token.token'])
        .getMany();

      if (tokens.length === 0) {
        return { successCount: 0, failureCount: 0 };
      }

      const tokenStrings = tokens.map((t) => t.token);
      return await this.firebaseService.subscribeToTopic(tokenStrings, topic);
    } catch (error) {
      console.error('Failed to subscribe all users to topic:', error);
      return { successCount: 0, failureCount: 1 };
    }
  }

  /**
   * 토픽에 알림 전송
   */
  async sendNotificationToTopic(
    topic: NotificationTopic,
    payload: NotificationPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const messageId = await this.firebaseService.sendNotificationToTopic(
        topic,
        payload.title,
        payload.body,
        payload.data,
      );

      return { success: true, messageId };
    } catch (error) {
      console.error('Failed to send notification to topic:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async autoSubscribeToTopic(
    token: string,
    topic: NotificationTopic,
  ): Promise<void> {
    try {
      await this.firebaseService.subscribeToTopic([token], topic);
      console.log('Auto-subscribed new token to mission topic');
    } catch (error) {
      console.error('Failed to auto-subscribe to mission topic:', error);
    }
  }
}
