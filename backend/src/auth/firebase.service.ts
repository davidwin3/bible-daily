import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {
    // 개발 환경에서는 Firebase 초기화를 건너뛰거나 기본 설정 사용
    if (this.configService.get('NODE_ENV') === 'development') {
      try {
        const privateKey = this.configService
          .get('FIREBASE_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n');

        // Firebase 설정이 올바르게 제공된 경우에만 초기화
        if (privateKey && privateKey.includes('BEGIN PRIVATE KEY')) {
          const firebaseConfig = {
            type: 'service_account',
            project_id: this.configService.get('FIREBASE_PROJECT_ID'),
            private_key_id: this.configService.get('FIREBASE_PRIVATE_KEY_ID'),
            private_key: privateKey,
            client_email: this.configService.get('FIREBASE_CLIENT_EMAIL'),
            client_id: this.configService.get('FIREBASE_CLIENT_ID'),
            auth_uri: this.configService.get('FIREBASE_AUTH_URI'),
            token_uri: this.configService.get('FIREBASE_TOKEN_URI'),
          };

          if (!admin.apps.length) {
            this.firebaseApp = admin.initializeApp({
              credential: admin.credential.cert(
                firebaseConfig as admin.ServiceAccount,
              ),
            });
          } else {
            this.firebaseApp = admin.app();
          }
        } else {
          console.warn(
            'Firebase 설정이 올바르지 않습니다. 개발 모드에서는 Firebase 기능이 비활성화됩니다.',
          );
          // Firebase 앱을 초기화하지 않음
        }
      } catch (error) {
        console.warn('Firebase 초기화 실패 (개발 모드):', error.message);
        // Firebase 앱을 초기화하지 않음
      }
    } else {
      // 프로덕션 환경에서는 정상적으로 초기화
      const privateKey = this.configService
        .get('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n');

      const firebaseConfig = {
        type: 'service_account',
        project_id: this.configService.get('FIREBASE_PROJECT_ID'),
        private_key_id: this.configService.get('FIREBASE_PRIVATE_KEY_ID'),
        private_key: privateKey,
        client_email: this.configService.get('FIREBASE_CLIENT_EMAIL'),
        client_id: this.configService.get('FIREBASE_CLIENT_ID'),
        auth_uri: this.configService.get('FIREBASE_AUTH_URI'),
        token_uri: this.configService.get('FIREBASE_TOKEN_URI'),
      };

      if (!admin.apps.length) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(
            firebaseConfig as admin.ServiceAccount,
          ),
        });
      } else {
        this.firebaseApp = admin.app();
      }
    }
  }

  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      if (!this.firebaseApp) {
        // 개발 환경에서 Firebase가 초기화되지 않은 경우 모의 토큰 반환
        if (this.configService.get('NODE_ENV') === 'development') {
          return {
            uid: 'dev-user-123',
            email: 'dev@example.com',
            aud: 'dev-project',
            auth_time: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
            firebase: { identities: {}, sign_in_provider: 'custom' },
            iat: Math.floor(Date.now() / 1000),
            iss: 'dev-issuer',
            sub: 'dev-user-123',
          } as admin.auth.DecodedIdToken;
        }
        throw new UnauthorizedException('Firebase not initialized');
      }
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    try {
      if (!this.firebaseApp) {
        // 개발 환경에서 Firebase가 초기화되지 않은 경우 모의 사용자 반환
        if (this.configService.get('NODE_ENV') === 'development') {
          return {
            uid: uid,
            email: 'dev@example.com',
            displayName: 'Dev User',
            photoURL: undefined,
            emailVerified: true,
            disabled: false,
            metadata: {
              creationTime: new Date().toISOString(),
              lastSignInTime: new Date().toISOString(),
              lastRefreshTime: new Date().toISOString(),
            },
            providerData: [],
            customClaims: {},
            toJSON: () => ({}),
          } as unknown as admin.auth.UserRecord;
        }
        throw new UnauthorizedException('Firebase not initialized');
      }
      return await admin.auth().getUser(uid);
    } catch (error) {
      throw new UnauthorizedException('User not found in Firebase');
    }
  }

  /**
   * 푸시 알림 전송
   * @param token FCM 토큰
   * @param title 알림 제목
   * @param body 알림 내용
   * @param data 추가 데이터
   */
  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      if (!this.firebaseApp) {
        if (this.configService.get('NODE_ENV') === 'development') {
          console.log('Development mode: Push notification would be sent:', {
            token,
            title,
            body,
            data,
          });
          return;
        }
        throw new Error('Firebase not initialized');
      }

      const message = {
        token,
        notification: {
          title,
          body,
        },
        data: data || {},
        webpush: {
          notification: {
            title,
            body,
            icon: '/vite.svg',
            badge: '/vite.svg',
            tag: 'bible-daily-notification',
            requireInteraction: false,
          },
          fcmOptions: {
            link: '/',
          },
        },
      };

      await admin.messaging().send(message);
      console.log('Push notification sent successfully');
    } catch (error) {
      console.error('Failed to send push notification:', error);
      throw error;
    }
  }

  /**
   * 여러 토큰에 푸시 알림 전송
   * @param tokens FCM 토큰 배열
   * @param title 알림 제목
   * @param body 알림 내용
   * @param data 추가 데이터
   */
  async sendPushNotificationToMultiple(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      if (!this.firebaseApp) {
        if (this.configService.get('NODE_ENV') === 'development') {
          console.log(
            'Development mode: Bulk push notification would be sent:',
            {
              tokenCount: tokens.length,
              title,
              body,
              data,
            },
          );
          return { successCount: tokens.length, failureCount: 0 };
        }
        throw new Error('Firebase not initialized');
      }

      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        webpush: {
          notification: {
            title,
            body,
            icon: '/vite.svg',
            badge: '/vite.svg',
            tag: 'bible-daily-notification',
            requireInteraction: false,
          },
          fcmOptions: {
            link: '/',
          },
        },
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(
        `Push notifications sent: ${response.successCount} success, ${response.failureCount} failure`,
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('Failed to send bulk push notifications:', error);
      throw error;
    }
  }

  /**
   * 토픽에 토큰 구독
   * @param tokens FCM 토큰 배열
   * @param topic 토픽 이름
   */
  async subscribeToTopic(
    tokens: string[],
    topic: string,
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      if (!this.firebaseApp) {
        if (this.configService.get('NODE_ENV') === 'development') {
          console.log(
            'Development mode: Topic subscription would be processed:',
            {
              tokenCount: tokens.length,
              topic,
            },
          );
          return { successCount: tokens.length, failureCount: 0 };
        }
        throw new Error('Firebase not initialized');
      }

      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      console.log(
        `Topic subscription: ${response.successCount} success, ${response.failureCount} failure for topic ${topic}`,
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('Failed to subscribe to topic:', error);
      throw error;
    }
  }

  /**
   * 토픽에서 토큰 구독 해제
   * @param tokens FCM 토큰 배열
   * @param topic 토픽 이름
   */
  async unsubscribeFromTopic(
    tokens: string[],
    topic: string,
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      if (!this.firebaseApp) {
        if (this.configService.get('NODE_ENV') === 'development') {
          console.log(
            'Development mode: Topic unsubscription would be processed:',
            {
              tokenCount: tokens.length,
              topic,
            },
          );
          return { successCount: tokens.length, failureCount: 0 };
        }
        throw new Error('Firebase not initialized');
      }

      const response = await admin
        .messaging()
        .unsubscribeFromTopic(tokens, topic);
      console.log(
        `Topic unsubscription: ${response.successCount} success, ${response.failureCount} failure for topic ${topic}`,
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('Failed to unsubscribe from topic:', error);
      throw error;
    }
  }

  /**
   * 토픽에 알림 전송
   * @param topic 토픽 이름
   * @param title 알림 제목
   * @param body 알림 내용
   * @param data 추가 데이터
   */
  async sendNotificationToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string> {
    try {
      if (!this.firebaseApp) {
        if (this.configService.get('NODE_ENV') === 'development') {
          console.log('Development mode: Topic notification would be sent:', {
            topic,
            title,
            body,
            data,
          });
          return 'dev-message-id';
        }
        throw new Error('Firebase not initialized');
      }

      const message = {
        topic,
        notification: {
          title,
          body,
        },
        data: data || {},
        webpush: {
          notification: {
            title,
            body,
            icon: '/vite.svg',
            badge: '/vite.svg',
            tag: 'bible-daily-notification',
            requireInteraction: false,
          },
          fcmOptions: {
            link: '/',
          },
        },
      };

      const messageId = await admin.messaging().send(message);
      console.log(
        `Topic notification sent successfully to ${topic}: ${messageId}`,
      );
      return messageId;
    } catch (error) {
      console.error('Failed to send topic notification:', error);
      throw error;
    }
  }
}
