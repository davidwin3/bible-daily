import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { Mission } from '../entities/mission.entity';
import { MissionScripture } from '../entities/mission-scripture.entity';
import { UserMission } from '../entities/user-mission.entity';
import { User } from '../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMissionDto } from './dto/create-mission.dto';

describe('MissionsService', () => {
  let service: MissionsService;
  let missionsRepository: Repository<Mission>;
  let missionScripturesRepository: Repository<MissionScripture>;
  let userMissionsRepository: Repository<UserMission>;
  let usersRepository: Repository<User>;
  let notificationsService: NotificationsService;

  const mockMissionsRepository = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockMissionScripturesRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserMissionsRepository = {
    count: jest.fn(),
  };

  const mockUsersRepository = {
    find: jest.fn(),
  };

  const mockNotificationsService = {
    sendNotificationToUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MissionsService,
        {
          provide: getRepositoryToken(Mission),
          useValue: mockMissionsRepository,
        },
        {
          provide: getRepositoryToken(MissionScripture),
          useValue: mockMissionScripturesRepository,
        },
        {
          provide: getRepositoryToken(UserMission),
          useValue: mockUserMissionsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<MissionsService>(MissionsService);
    missionsRepository = module.get<Repository<Mission>>(
      getRepositoryToken(Mission),
    );
    missionScripturesRepository = module.get<Repository<MissionScripture>>(
      getRepositoryToken(MissionScripture),
    );
    userMissionsRepository = module.get<Repository<UserMission>>(
      getRepositoryToken(UserMission),
    );
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMission', () => {
    const createMissionDto: CreateMissionDto = {
      date: '2024-01-01',
      title: '신년 성경 읽기',
      description: '새해 첫 성경 읽기',
      scriptures: [
        {
          book: '창세기',
          chapter: 1,
          startVerse: 1,
          endVerse: 10,
          order: 1,
        },
      ],
    };

    const mockMission = {
      id: 1,
      date: '2024-01-01',
      title: '신년 성경 읽기',
      description: '새해 첫 성경 읽기',
    };

    const mockUsers = [{ id: 'user1' }, { id: 'user2' }, { id: 'user3' }];

    it('새 미션을 성공적으로 생성하고 알림을 전송해야 함', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null), // 기존 미션 없음
      };

      mockMissionsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockMissionsRepository.create.mockReturnValue(mockMission);
      mockMissionsRepository.save.mockResolvedValue(mockMission);

      const mockMissionScripture = {
        ...createMissionDto.scriptures[0],
        missionId: mockMission.id,
      };
      mockMissionScripturesRepository.create.mockReturnValue(
        mockMissionScripture,
      );
      mockMissionScripturesRepository.save.mockResolvedValue([
        mockMissionScripture,
      ]);

      mockUsersRepository.find.mockResolvedValue(mockUsers);
      mockNotificationsService.sendNotificationToUsers.mockResolvedValue({
        successCount: 3,
        failureCount: 0,
      });

      // Act
      const result = await service.createMission(createMissionDto);

      // Assert
      expect(result).toEqual(mockMission);

      // 미션 생성 확인
      expect(mockMissionsRepository.create).toHaveBeenCalledWith({
        date: createMissionDto.date,
        title: createMissionDto.title,
        description: createMissionDto.description,
      });
      expect(mockMissionsRepository.save).toHaveBeenCalledWith(mockMission);

      // 성경구절 저장 확인
      expect(mockMissionScripturesRepository.create).toHaveBeenCalledWith({
        ...createMissionDto.scriptures[0],
        missionId: mockMission.id,
      });
      expect(mockMissionScripturesRepository.save).toHaveBeenCalled();

      // 알림 전송 확인
      expect(mockUsersRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        select: ['id'],
      });
      expect(
        mockNotificationsService.sendNotificationToUsers,
      ).toHaveBeenCalledWith(
        ['user1', 'user2', 'user3'],
        expect.objectContaining({
          title: '📖 새로운 성경 읽기 미션이 등록되었습니다!',
          body: expect.stringContaining('신년 성경 읽기'),
          data: expect.objectContaining({
            type: 'new-mission',
            missionId: '1',
            date: '2024-01-01',
          }),
        }),
      );
    });

    it('이미 존재하는 날짜의 미션 생성 시 ConflictException을 던져야 함', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockMission), // 기존 미션 존재
      };

      mockMissionsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      // Act & Assert
      await expect(service.createMission(createMissionDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createMission(createMissionDto)).rejects.toThrow(
        'Mission for this date already exists',
      );

      // 미션 생성이 호출되지 않았는지 확인
      expect(mockMissionsRepository.create).not.toHaveBeenCalled();
      expect(mockMissionsRepository.save).not.toHaveBeenCalled();
      expect(
        mockNotificationsService.sendNotificationToUsers,
      ).not.toHaveBeenCalled();
    });

    it('활성 사용자가 없을 때도 미션은 생성되어야 함', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockMissionsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockMissionsRepository.create.mockReturnValue(mockMission);
      mockMissionsRepository.save.mockResolvedValue(mockMission);
      mockUsersRepository.find.mockResolvedValue([]); // 활성 사용자 없음

      // Act
      const result = await service.createMission(createMissionDto);

      // Assert
      expect(result).toEqual(mockMission);
      expect(
        mockNotificationsService.sendNotificationToUsers,
      ).not.toHaveBeenCalled();
    });

    it('알림 전송 실패 시에도 미션 생성은 성공해야 함', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockMissionsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockMissionsRepository.create.mockReturnValue(mockMission);
      mockMissionsRepository.save.mockResolvedValue(mockMission);
      mockUsersRepository.find.mockResolvedValue(mockUsers);
      mockNotificationsService.sendNotificationToUsers.mockRejectedValue(
        new Error('Notification service error'),
      );

      // Act
      const result = await service.createMission(createMissionDto);

      // Assert
      expect(result).toEqual(mockMission);
      expect(
        mockNotificationsService.sendNotificationToUsers,
      ).toHaveBeenCalled();
    });

    it('성경구절 없이도 미션을 생성할 수 있어야 함', async () => {
      // Arrange
      const createMissionDtoWithoutScriptures = {
        ...createMissionDto,
        scriptures: undefined,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockMissionsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockMissionsRepository.create.mockReturnValue(mockMission);
      mockMissionsRepository.save.mockResolvedValue(mockMission);
      mockUsersRepository.find.mockResolvedValue(mockUsers);
      mockNotificationsService.sendNotificationToUsers.mockResolvedValue({
        successCount: 3,
        failureCount: 0,
      });

      // Act
      const result = await service.createMission(
        createMissionDtoWithoutScriptures,
      );

      // Assert
      expect(result).toEqual(mockMission);
      expect(mockMissionScripturesRepository.create).not.toHaveBeenCalled();
      expect(mockMissionScripturesRepository.save).not.toHaveBeenCalled();

      // 알림에서 성경구절 정보가 없어도 전송되어야 함
      expect(
        mockNotificationsService.sendNotificationToUsers,
      ).toHaveBeenCalledWith(
        ['user1', 'user2', 'user3'],
        expect.objectContaining({
          title: '📖 새로운 성경 읽기 미션이 등록되었습니다!',
          body: '신년 성경 읽기',
        }),
      );
    });
  });
});
