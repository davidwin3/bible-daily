import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationsService,
  NotificationPayload,
} from './notifications.service';
import { FcmToken } from '../entities/fcm-token.entity';
import { User } from '../entities/user.entity';
import { FirebaseService } from '../auth/firebase.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let fcmTokenRepository: Repository<FcmToken>;
  let userRepository: Repository<User>;
  let firebaseService: FirebaseService;

  const mockFcmTokenRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserRepository = {
    find: jest.fn(),
  };

  const mockFirebaseService = {
    sendPushNotification: jest.fn(),
    sendPushNotificationToMultiple: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(FcmToken),
          useValue: mockFcmTokenRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    fcmTokenRepository = module.get<Repository<FcmToken>>(
      getRepositoryToken(FcmToken),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    firebaseService = module.get<FirebaseService>(FirebaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendNotificationToToken', () => {
    const fcmToken = 'test-fcm-token';
    const payload: NotificationPayload = {
      title: '테스트 알림',
      body: '테스트 알림 내용',
      data: { type: 'test' },
    };

    it('FCM 토큰으로 알림을 성공적으로 전송해야 함', async () => {
      // Arrange
      mockFirebaseService.sendPushNotification.mockResolvedValue(undefined);

      // Act
      const result = await service.sendNotificationToToken(fcmToken, payload);

      // Assert
      expect(result.success).toBe(true);
      expect(mockFirebaseService.sendPushNotification).toHaveBeenCalledWith(
        fcmToken,
        payload.title,
        payload.body,
        payload.data,
      );
    });

    it('FCM 토큰으로 알림 전송 실패 시 에러를 반환해야 함', async () => {
      // Arrange
      const error = new Error('Firebase error');
      mockFirebaseService.sendPushNotification.mockRejectedValue(error);

      // Act
      const result = await service.sendNotificationToToken(fcmToken, payload);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Firebase error');
    });
  });

  describe('sendNotificationToUser', () => {
    const userId = 'test-user-id';
    const payload: NotificationPayload = {
      title: '사용자 알림',
      body: '사용자 알림 내용',
    };

    const mockTokens = [
      { token: 'token1', isActive: true },
      { token: 'token2', isActive: true },
    ];

    it('사용자에게 알림을 성공적으로 전송해야 함', async () => {
      // Arrange
      mockFcmTokenRepository.find.mockResolvedValue(mockTokens);
      mockFirebaseService.sendPushNotificationToMultiple.mockResolvedValue({
        successCount: 2,
        failureCount: 0,
      });

      // Act
      const result = await service.sendNotificationToUser(userId, payload);

      // Assert
      expect(result.success).toBe(true);
      expect(mockFcmTokenRepository.find).toHaveBeenCalledWith({
        where: { userId, isActive: true },
      });
      expect(
        mockFirebaseService.sendPushNotificationToMultiple,
      ).toHaveBeenCalledWith(
        ['token1', 'token2'],
        payload.title,
        payload.body,
        payload.data,
      );
    });

    it('활성 FCM 토큰이 없을 때 실패를 반환해야 함', async () => {
      // Arrange
      mockFcmTokenRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.sendNotificationToUser(userId, payload);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('No active FCM tokens found');
      expect(
        mockFirebaseService.sendPushNotificationToMultiple,
      ).not.toHaveBeenCalled();
    });

    it('일부 토큰 전송 실패 시에도 성공으로 처리해야 함', async () => {
      // Arrange
      mockFcmTokenRepository.find.mockResolvedValue(mockTokens);
      mockFirebaseService.sendPushNotificationToMultiple.mockResolvedValue({
        successCount: 1,
        failureCount: 1,
      });

      // Act
      const result = await service.sendNotificationToUser(userId, payload);

      // Assert
      expect(result.success).toBe(true);
    });

    it('모든 토큰 전송 실패 시 실패를 반환해야 함', async () => {
      // Arrange
      mockFcmTokenRepository.find.mockResolvedValue(mockTokens);
      mockFirebaseService.sendPushNotificationToMultiple.mockResolvedValue({
        successCount: 0,
        failureCount: 2,
      });

      // Act
      const result = await service.sendNotificationToUser(userId, payload);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('sendNotificationToUsers', () => {
    const userIds = ['user1', 'user2', 'user3'];
    const payload: NotificationPayload = {
      title: '다중 사용자 알림',
      body: '다중 사용자 알림 내용',
    };

    it('여러 사용자에게 알림을 전송해야 함', async () => {
      // Arrange
      const mockTokensUser1 = [{ token: 'token1' }, { token: 'token2' }];
      const mockTokensUser2 = [{ token: 'token3' }];
      const mockTokensUser3 = []; // 토큰 없음

      mockFcmTokenRepository.find
        .mockResolvedValueOnce(mockTokensUser1)
        .mockResolvedValueOnce(mockTokensUser2)
        .mockResolvedValueOnce(mockTokensUser3);

      mockFirebaseService.sendPushNotificationToMultiple
        .mockResolvedValueOnce({ successCount: 2, failureCount: 0 })
        .mockResolvedValueOnce({ successCount: 1, failureCount: 0 });

      // Act
      const result = await service.sendNotificationToUsers(userIds, payload);

      // Assert
      expect(result.successCount).toBe(2); // user1, user2 성공
      expect(result.failureCount).toBe(1); // user3 실패 (토큰 없음)
      expect(mockFcmTokenRepository.find).toHaveBeenCalledTimes(3);
    });
  });

  describe('saveFcmToken', () => {
    const userId = 'test-user-id';
    const token = 'test-fcm-token';
    const userAgent = 'Mozilla/5.0';

    it('새 FCM 토큰을 저장해야 함', async () => {
      // Arrange
      mockFcmTokenRepository.findOne.mockResolvedValue(null);
      const newTokenData = {
        userId,
        token,
        platform: 'web',
        userAgent,
        lastUsedAt: expect.any(Date),
      };
      const newToken = { id: 1, ...newTokenData };
      mockFcmTokenRepository.create.mockReturnValue(newTokenData);
      mockFcmTokenRepository.save.mockResolvedValue(newToken);

      // Act
      const result = await service.saveFcmToken(userId, token, userAgent);

      // Assert
      expect(result).toEqual(newToken);
      expect(mockFcmTokenRepository.findOne).toHaveBeenCalledWith({
        where: { userId, token },
      });
      expect(mockFcmTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          token,
          platform: 'web',
          userAgent,
          lastUsedAt: expect.any(Date),
        }),
      );
      expect(mockFcmTokenRepository.save).toHaveBeenCalled();
    });

    it('기존 FCM 토큰을 업데이트해야 함', async () => {
      // Arrange
      const existingToken = {
        id: 1,
        token,
        userId,
        userAgent: 'old-user-agent',
        isActive: false,
      };
      mockFcmTokenRepository.findOne.mockResolvedValue(existingToken);

      const updatedToken = {
        ...existingToken,
        userAgent,
        isActive: true,
        lastUsedAt: expect.any(Date),
      };
      mockFcmTokenRepository.save.mockResolvedValue(updatedToken);

      // Act
      const result = await service.saveFcmToken(userId, token, userAgent);

      // Assert
      expect(result).toEqual(updatedToken);
      expect(mockFcmTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent,
          isActive: true,
          lastUsedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('removeFcmToken', () => {
    const userId = 'test-user-id';
    const token = 'test-fcm-token';

    it('FCM 토큰을 성공적으로 제거해야 함', async () => {
      // Arrange
      mockFcmTokenRepository.delete.mockResolvedValue({ affected: 1 });

      // Act
      const result = await service.removeFcmToken(userId, token);

      // Assert
      expect(result).toBe(true);
      expect(mockFcmTokenRepository.delete).toHaveBeenCalledWith({
        userId,
        token,
      });
    });

    it('존재하지 않는 FCM 토큰 제거 시 false를 반환해야 함', async () => {
      // Arrange
      mockFcmTokenRepository.delete.mockResolvedValue({ affected: 0 });

      // Act
      const result = await service.removeFcmToken(userId, token);

      // Assert
      expect(result).toBe(false);
    });
  });
});
